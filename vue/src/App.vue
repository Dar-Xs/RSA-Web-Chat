<script setup lang="ts">
import SiteNavigation from './components/SiteNavigation.vue';
import { ref, computed, onMounted } from "vue";
import io, { Socket } from "socket.io-client";
import { generateRSAKeyPairToPEM, importPrivateKey, importPublicKey, decryptStringRSA, encryptStringRSA } from "./utils/rsa";
import Clipboard from 'clipboard';
import Message from './components/Message.vue';

const API_host = import.meta.env.VITE_API_URL;

let webSocket: Socket;
const publicKey = ref("");
const privateKey = ref("");
const privateKeyHash = ref("");
const privateCryptoKey = computed(async () => await importPrivateKey(privateKey.value));
const logedin = computed(() => privateKeyHash.value != '');

function handleStart() {
  // 还原状态
  publicKey.value = localStorage.getItem('publicKey')??"";
  privateKey.value = localStorage.getItem('privateKey')??"";

  // 判断浏览器是否支持websocket
  if (!window.WebSocket) {
    alert("WebSocket not supported");
    return;
  }
  // 创建一个websocket
  webSocket = io(`${API_host}`, {
    withCredentials: true,
    extraHeaders: {
      'Access-Control-Allow-Origin': '*',
    },
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

  // 监听连接关闭
  webSocket.on("disconnect", () => {
    console.log("----------------<<disconnect>>");

    privateKeyHash.value = "";
  });

  // 连接建立
  webSocket.on("connect", () => {
    console.log("----------------<<connect>>");
    if (publicKey.value === "") {
      generateRSAKeyPairToPEM().then((keyPair) => {
        publicKey.value = keyPair.publicKey;
        privateKey.value = keyPair.privateKey;
        localStorage.setItem('publicKey', publicKey.value);
        localStorage.setItem('privateKey', privateKey.value);
        webSocket.emit("login:challenge", { publicKey: publicKey.value });
      });
      return;
    }

    webSocket.emit("login:challenge", { publicKey: publicKey.value });
  });

  webSocket.on("login:challenge", async (data: { question: string }) => {
    const key = await privateCryptoKey.value;
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
      showConnect.value = false;
    }
    console.log(data.message);
  });

  webSocket.on("send", (data: { success: boolean, message: string }) => {
    console.log(data.message);
  });

  webSocket.on("receive", async (data: { sender: string, message: string }) => {
    if (data.sender === userHash.value) {
      const key = await privateCryptoKey.value;
      const ans = await decryptStringRSA(key, data.message);
      pushMessage(false, ans);
      setTimeout(() => {
        const chatViewEle = chatView.value;
        if (!chatViewEle) return;
        chatViewEle.scrollTop = chatViewEle.scrollHeight;
      }, 0);

    } else {
      console.log("other message", data);
    }
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
const connected = computed(() => userKey.value !== '');
const userPublicCryptoKey = (() => {
  let result: CryptoKey;
  return async () => {
    if (result == undefined && userKey.value !== "") {
      result = await importPublicKey(userKey.value);
    }
    return result;
  };
})();
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
const handleKeyDown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.metaKey) {
    event.preventDefault();
    if (messageValue.value == "" || !connected.value) return;
    const key = await userPublicCryptoKey();
    const message = await encryptStringRSA(key, messageValue.value);
    webSocket.emit("send", {
      receiverHash: userHash.value,
      message: message,
    });
    pushMessage(true, messageValue.value);
    messageValue.value = "";

    // 等待 Vue 刷新, 有没有更好的写法?
    setTimeout(() => {
      updateHeight();
      const chatViewEle = chatView.value;
      if (!chatViewEle) return;
      chatViewEle.scrollTop = chatViewEle.scrollHeight;
    }, 0);

  }
}

const pushMessage = (user: boolean, message: string) => {
  let top = true;
  if (messages.value.length > 0) {
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage.user === user) {
      lastMessage.bottom = false;
      top = false;
    }
  }
  messages.value.push({
    top: top,
    bottom: true,
    user: user,
    message: message
  });

};

// 展示消息
const messages = ref<{
  top: boolean,
  bottom: boolean,
  user: boolean,
  message: string
}[]>([]);

</script>

<template>
  <div class="max-h-screen min-h-screen flex flex-col dark:bg-zinc-900 dark:text-white">
    <div class="fixed top-0 left-0 right-0 z-50">
      <div class="z-50 relative" @click="() => { showConnect = !showConnect }">
        <SiteNavigation />
      </div>
      <div :class="[{ '-translate-y-full': !showConnect }, 'z-40 relative transition ease-in-out backdrop-blur',
        'bg-white/80 dark:bg-zinc-900/80 border-b border-slate-900/10']">
        <div class="grid grid-cols-4 gap-2 gap-x-0 max-w-2xl mx-auto py-2">
          <div class=" p-2 m-1 justify-self-end">Yours:</div>
          <p class="col-span-2 self-center m-1 truncate">
            {{ logedin ? privateKeyHash : "loging in" }}</p>
          <button :disabled="!logedin" class="rounded-md p-2 m-1 w-auto text-white copy-button bg-sky-600 hover:bg-sky-600/80 disabled:bg-sky-600/80 active:bg-sky-700
           dark:bg-sky-700 dark:hover:bg-sky-600 dark:active:bg-sky-500" :data-clipboard-text="privateKeyHash">
            {{ logedin ? "Copy" : "Offline" }}</button>

          <div class=" p-2 m-1 w-auto justify-self-end">Friend's:</div>
          <input class="col-span-2 rounded-md border-2 p-2 m-1 dark:bg-zinc-900 dark:border-slate-600" v-model="userHash"
            placeholder="Paste here" />
          <button @click="connect" :class="['rounded-md p-2 m-1 ',
            'text-white bg-sky-600 hover:bg-sky-600/80 disabled:bg-sky-600/80 active:bg-sky-700',
            'dark:bg-sky-700 dark:hover:bg-sky-600 dark:active:bg-sky-500']">
            {{ connected ? "Reconnect" : "Connec" }}</button>
        </div>
      </div>
    </div>

    <div class="h-12 grow-0 shrink-0"></div>
    <div ref="chatView" class="relative grow shrink overflow-auto">
      <div class="my-2 flex flex-col min-h-full dark:bg-zinc-900">
        <Message v-for="message in messages" v-bind="message" />
      </div>
    </div>
    <div ref="inputRefBg" class="h-12 grow-0 shrink-0"></div>

    <div class="fixed bottom-0 left-0 right-0 flex backdrop-blur z-50
       bg-white/95 dark:bg-zinc-900 border-t border-slate-900/10 dark:border-slate-700/70">
      <textarea ref="inputRef" className="h-10 p-2 m-1 w-full resize-none overflow-hidden
         placeholder:text-slate-300 dark:bg-zinc-900 dark:placeholder:text-slate-600 outline-0"
        placeholder="Write a message..." v-model="messageValue" @input="updateHeight" @keydown="handleKeyDown"
        rows='1'></textarea>
    </div>
  </div>
</template>
