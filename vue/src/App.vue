<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue';
import MessageDemo from './components/MessageDemo.vue';
import RSADemo from './views/RSADemo.vue';
import { ref, computed, onMounted } from "vue";
import io from "socket.io-client";
import { generateRSAKeyPairToPEM, importPrivateKey, decryptStringRSA } from "./utils/rsa"

const API_host = import.meta.env.VITE_API_URL;

const publicKey = ref("");
const privateKey = ref("");
const privateCryptoKey = (() => {
  let result: CryptoKey;
  return async () => {
    if (result==undefined) {
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
  const webSocket = io(`http://${API_host}:3000`, {
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

  webSocket.on("login:answer", (data: { success: boolean, message: string }) => {
    console.log(data.message);
  });
}

onMounted(() => {
  handleStart();

});

</script>

<template>
  <div class="flex flex-col min-h-screen dark:bg-zinc-900">
    <SiteNavigation />
    <MessageDemo />
    <RouterView />
    <RSADemo/>
  </div>
</template>
