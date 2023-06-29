<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue';
import MessageDemo from './components/MessageDemo.vue';
import axios from 'axios'
import { ref, onMounted } from "vue";

const message = ref('');

onMounted(()=>{
  axios.options("https://rsa.chat.darxs.cn").then((res)=>{

    message.value = JSON.stringify(res.data);
  });
});
</script>

<template>
  <div class="flex flex-col min-h-screen dark:bg-zinc-900">
    <SiteNavigation />
    <MessageDemo />
    <RouterView />
  </div>
  {{ message }}
</template>
