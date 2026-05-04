<template>
  <div class="relative" ref="dropdownRef">
    <button @click="openDropDown = !openDropDown" class="text-gray-700 dark:text-gray-400">
      <HorizontalDots />
    </button>
    <div
      v-if="openDropDown"
      class="absolute right-0 top-full z-40 w-[160px] space-y-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-md dark:border-gray-800 dark:bg-gray-dark"
    >
      <button
        v-for="action in actions"
        :key="action.id"
        @click="handleAction(action.id)"
        class="flex w-full px-3 py-2 font-medium text-left text-gray-500 rounded-lg text-theme-xs hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import HorizontalDots from '@/icons/HorizontalDots.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'clear-column'): void
}>()

defineProps<{
  columnStatus?: string
}>()

const openDropDown = ref(false)
const actions = [
  { id: 'clear', label: 'Переместить все в "Выполнено"' },
]
const dropdownRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    openDropDown.value = false
  }
}

const handleAction = (actionId: string) => {
  if (actionId === 'clear') emit('clear-column')
  openDropDown.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
