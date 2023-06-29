<script setup lang="ts">
defineProps<{
  top?: boolean,
  bottom?: boolean,
  user?: boolean,
  message?: string
}>();

</script>

<template>
  <div :class="[top ? 'mt-2' : 'mt-0.5', 'mx-4 relative flex', { 'flex-row-reverse': user }]">
    <div v-if="bottom"
      :class="['absolute bottom-0 overflow-hidden', 'h-5 w-4.5',
        user ? 'bg-sky-500 dark:bg-sky-700 right-0 -mr-3 rounded-bl-50' 
        : 'bg-gray-200 dark:bg-zinc-700 left-0 -ml-3 rounded-br-50']">
      <div :class="['h-7 -mt-1 w-5 bg-white dark:bg-zinc-900',
        user ? 'ml-1.5 rounded-bl-50' : '-ml-2 rounded-br-50']">
      </div>
    </div>
    <div :class="['px-2.5 py-1 rounded-2xl break-words font-sans', 'max-w-xs md:max-w-md lg:max-w-lg',
      user ? 'text-white bg-sky-500 dark:bg-sky-700' 
      : 'text-black dark:text-white bg-gray-200 dark:bg-zinc-700',
      {
        'rounded-tl-md': !top && !user, 'rounded-bl-md': !bottom && !user,
        'rounded-tr-md': !top && user, 'rounded-br-md': !bottom && user,
      },]">
      {{ message }}
    </div>
  </div>
</template>

<style>
.rounded-br-50 {
  border-bottom-right-radius: 50%;
}

.rounded-bl-50 {
  border-bottom-left-radius: 50%;
}

.w-4\.5 {
  width: 1.125rem;
}
</style>