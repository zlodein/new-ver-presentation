<template>
  <article>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img v-if="avatar" :src="avatar" class="h-10 w-10 shrink-0 rounded-full object-cover" alt="" />
        <div
          v-else
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {{ (name || '?').charAt(0).toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ email }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ time }}</p>
    </div>
    <div class="pb-6 whitespace-pre-wrap">
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ content }}</p>
    </div>
  </article>
</template>

<script setup>
defineProps(['name', 'email', 'avatar', 'time', 'content'])
</script>
