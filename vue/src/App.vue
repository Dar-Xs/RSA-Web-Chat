<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteNavigation from './components/SiteNavigation.vue';
import MessageDemo from './components/MessageDemo.vue';

</script>

<template>
  <div class="flex flex-col min-h-screen dark:bg-zinc-900">
    <SiteNavigation />
    <MessageDemo />
    <RouterView />
  </div>
</template>
