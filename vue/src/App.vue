<script setup lang="ts">
import SiteNavigation from './components/SiteNavigation.vue';
import MessageDemo from './components/MessageDemo.vue';
import { ref, onMounted } from "vue";
import io, { Socket } from "socket.io-client";
import { generateRSAKeyPairToPEM, importPrivateKey, decryptStringRSA } from "./utils/rsa";
import Clipboard from 'clipboard';
import Message from './components/Message.vue';

const API_host = import.meta.env.VITE_API_URL;

let webSocket: Socket;
const publicKey = ref("");
const privateKey = ref("");
const privateKeyHash = ref("");
const privateCryptoKey = (() => {
  let result: CryptoKey;
  return async () => {
    if (result == undefined) {
      result = await importPrivateKey(privateKey.value);
    }
    return result;
  };
})();
function handleStart() {
  // 判断浏览器是否支持websocket
  if (!window.WebSocket) {
    alert("WebSocket not supported");
    return;
  }
  // 创建一个websocket
  webSocket = io(`https://${API_host}:3000`, {
    withCredentials: true,
    extraHeaders: {
      'Access-Control-Allow-Origin': '*',
    },
  });

  // 主动向后台发送数据
  webSocket.emit("message", {
    message: "前端向后端发送一条数据",
  });

  // 监听websocket通讯
  webSocket.on("message", (message: string) => {
    // 这是服务端返回的数据
    console.log(message);
  })
  // 监听连接关闭
  webSocket.on("close", () => {
    console.log("Connection closed.");
  });

  generateRSAKeyPairToPEM().then((keyPair) => {
    publicKey.value = keyPair.publicKey;
    privateKey.value = keyPair.privateKey;

    webSocket.emit("login:challenge", { publicKey: publicKey.value });
  });

  webSocket.on("login:challenge", async (data: { question: string }) => {
    const key = await privateCryptoKey();
    const ans = await decryptStringRSA(key, data.question);
    console.log(ans);
    webSocket.emit("login:answer", { publicKey: publicKey.value, answer: ans });

  });

  webSocket.on("login:answer", (data: { success: boolean, hash: string, message: string }) => {
    if (data.success) {
      privateKeyHash.value = data.hash;
    }
    console.log(data.message);
  });

  webSocket.on("find", (data: { success: boolean, publicKey: string, message: string }) => {
    if (data.success) {
      userKey.value = data.publicKey;
    }
    console.log(data.message);
  });
}

onMounted(() => {
  handleStart();

  const clipboard = new Clipboard('.copy-button');
  clipboard.on('success', (e) => {
    console.log('Copied to clipboard');
    e.clearSelection();
  });
  clipboard.on('error', (e) => {
    console.log('Failed to copy to clipboard');
  });
});

// 连接其他用户
const userHash = ref("");
const userKey = ref("");
const connect = () => {
  if (!webSocket) {
    handleStart();
  }
  webSocket.emit("find", { publicKey: publicKey.value, userHash: userHash.value });
};

// 展示连接面板
const showConnect = ref(true);

// 输入框事件
const messageValue = ref("");
const inputRef = ref<HTMLInputElement | null>(null)
const inputRefBg = ref<HTMLInputElement | null>(null)
const updateHeight = () => {
  const elem = inputRef.value;
  if (!elem) return;
  elem.style.height = 'auto';
  elem.style.height = elem.scrollHeight + 'px';
  // 已输入行数的算法
  // const lineHeight = parseInt(getComputedStyle(elem).lineHeight);
  // const padding = parseInt(getComputedStyle(elem).paddingTop) + parseInt(getComputedStyle(elem).paddingBottom);
  // const contentHeight = elem.scrollHeight - padding;
  // const lineCount = Math.floor(contentHeight / lineHeight);
  // console.log(elem.scrollHeight, lineCount);

  const bgElem = inputRefBg.value;
  if (!bgElem) return;
  bgElem.style.height = (elem.scrollHeight + 9) + 'px';
};

// 发送消息
const chatView = ref<HTMLInputElement | null>(null)
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.metaKey) {
    event.preventDefault();
    if (messageValue.value == "") return;
    let top = true;
    if (messages.value.length > 0) {
      const lastMessage = messages.value[messages.value.length - 1];
      if (lastMessage.user) {
        lastMessage.bottom = false;
        top = false;
      }
    }
    messages.value.push({
      top: top,
      bottom: true,
      user: true,
      message: messageValue.value
    });
    messageValue.value = "";
    setTimeout(() => {
      updateHeight();
      const chatViewEle = chatView.value;
      if (!chatViewEle) return;
      chatViewEle.scrollTop = chatViewEle.scrollHeight;
    }, 0);

  }
}

// 展示消息
const messages = ref<{
  top: boolean,
  bottom: boolean,
  user: boolean,
  message: string
}[]>([]);

</script>

<template>
  <div class="max-h-screen min-h-screen flex flex-col dark:bg-zinc-900 dark:text-white" >
    <div class="fixed top-0 left-0 right-0 z-50">
      <div class="z-50 relative" @click="() => { showConnect = !showConnect }">
        <SiteNavigation :privateKeyHash="privateKeyHash" v-model:userHash="userHash" @connect="connect" />
      </div>
      <div :class="[{ '-translate-y-full': !showConnect },
        'z-40 relative transition ease-in-out backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-b border-slate-900/10']">
        <div class="grid grid-cols-4 gap-2 gap-x-0 max-w-2xl mx-auto py-2">
          <div class=" p-2 m-1 justify-self-end">Yours:</div>
          <p class="col-span-2 self-center m-1 truncate">{{ privateKeyHash == "" ? "loging in" : privateKeyHash }}</p>
          <button class="rounded-md p-2 m-1 w-auto text-white bg-sky-700 copy-button"
            :data-clipboard-text="privateKeyHash">Copy</button>

          <div class=" p-2 m-1 w-auto justify-self-end">Friend's:</div>
          <input class="col-span-2 rounded-md border-2 p-2 m-1 dark:bg-zinc-900 dark:border-slate-600" v-model="userHash" placeholder="Paste here" />
          <button @click="connect" class="rounded-md p-2 m-1 text-white bg-sky-700">Connect</button>
        </div>
      </div>
    </div>

    <div class="h-12 grow-0 shrink-0"></div>
    <div ref="chatView" class="relative grow shrink overflow-auto">
      <div class="my-2 flex flex-col min-h-full dark:bg-zinc-900">
        <MessageDemo />
        <Message v-for="message in messages" v-bind="message" />
      </div>
    </div>
    <div ref="inputRefBg" class="h-12 grow-0 shrink-0"></div>

    <div class="fixed bottom-0 left-0 right-0 flex backdrop-blur z-50 bg-white/95 dark:bg-zinc-900 border-t border-slate-900/10 dark:border-slate-700/70">
      <textarea ref="inputRef"
        className="h-10 p-2 m-1 w-full resize-none overflow-hidden placeholder:text-slate-300 dark:bg-zinc-900 dark:placeholder:text-slate-600 outline-0"
        placeholder="Write a message..." v-model="messageValue" @input="updateHeight" @keydown="handleKeyDown"
        rows='1'></textarea>
    </div>
  </div>
</template>
