<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue';
import MessageDemo from './components/MessageDemo.vue';
import { ref, onMounted } from "vue";

const message = ref('');

onMounted(()=>{
  message.value = String(import.meta.env.VITE_API_URL)
});
</script>

<template>
  <div class="flex flex-col min-h-screen dark:bg-zinc-900">
    <SiteNavigation />
    <MessageDemo />
    <RouterView />
    VITE_API_URL: {{ message }}
  </div>
</template>
