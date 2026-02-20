<template>
  <div class="mb-1 last:mb-0">
    <div class="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-400">
      {{ title }}
    </div>
    <ul class="py-1">
      <li v-for="item in items" :key="item.id">
        <RouterLink
          :to="item.link"
          class="flex flex-col gap-0.5 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-white/90 dark:hover:bg-gray-800"
          @click="$emit('navigate')"
        >
          <span class="font-medium">{{ item.title }}</span>
          <span v-if="item.subtitle" class="text-xs text-gray-500 dark:text-gray-400">
            {{ item.subtitle }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { SearchResultItem } from '@/composables/useGlobalSearch'

defineProps<{
  title: string
  items: SearchResultItem[]
}>()

defineEmits<{
  navigate: []
}>()
</script>
