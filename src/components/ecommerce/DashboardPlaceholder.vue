<template>
  <div
    class="flex h-full min-h-[160px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 md:p-6"
  >
    <p class="text-lg font-semibold text-gray-800 dark:text-white/90">
      {{ greeting }}{{ displayName }}!
    </p>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      Заглушка
    </p>
    <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
      Блок в разработке
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()

const displayName = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.name || currentUser.value.firstName || ''
  const last_name = currentUser.value.last_name || currentUser.value.lastName || ''
  const full = `${name} ${last_name}`.trim()
  return full ? ` ${full}` : (currentUser.value.email ? ` ${currentUser.value.email.split('@')[0]}` : '')
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Доброе утро,'
  if (hour >= 12 && hour < 18) return 'Добрый день,'
  return 'Добрый вечер,'
})
</script>
