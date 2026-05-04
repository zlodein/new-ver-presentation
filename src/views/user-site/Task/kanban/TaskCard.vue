<template>
  <div
    draggable="true"
    class="p-5 bg-white border border-gray-200 task rounded-xl shadow-theme-sm dark:border-gray-800 dark:bg-white/5"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div v-if="task.description">
          <h4 class="mb-2 text-base text-gray-800 dark:text-white/90">
            {{ task.title }}
          </h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {{ task.description }}
          </p>
        </div>
        <div v-else>
          <h4 class="mb-5 text-base text-gray-800 dark:text-white/90">
            {{ task.title }}
          </h4>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span
            v-if="task.date"
            class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
          >
            <Calendar2Line class="w-4 h-4 shrink-0" />
            {{ task.date }}
          </span>
          <span
            v-if="task.tag"
            :class="getTagClass(task.tag.color)"
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
          >
            {{ task.tag.text }}
          </span>
        </div>
      </div>

      <div class="relative shrink-0" ref="menuRef">
        <button
          type="button"
          @click.stop="menuOpen = !menuOpen"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Действия"
        >
          <HorizontalDots class="w-5 h-5" />
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-full z-40 mt-1 w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            @click.stop="handleEdit"
            class="flex w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Редактировать
          </button>
          <button
            type="button"
            @click.stop="handleDelete"
            class="flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Calendar2Line, HorizontalDots } from '@/icons'

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

defineProps<{
  task: {
    id: string
    title: string
    description?: string
    date?: string
    tag?: { text: string; color: string }
  }
}>()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

function handleEdit() {
  menuOpen.value = false
  emit('edit')
}

function handleDelete() {
  menuOpen.value = false
  emit('delete')
}

const getTagClass = (color: string) => {
  const baseClasses = 'px-2 py-0.5 text-xs font-medium'
  switch (color) {
    case 'brand':
      return `${baseClasses} bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400`
    case 'gray':
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80`
    case 'success':
      return `${baseClasses} bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500`
    case 'orange':
      return `${baseClasses} bg-orange-400/10 text-orange-400`
    default:
      return `${baseClasses} bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400`
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
