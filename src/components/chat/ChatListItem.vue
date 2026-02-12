<template>
  <div
    class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
    :class="{ 'bg-gray-100 dark:bg-white/[0.06]': selected }"
    @click="$emit('click')"
  >
    <div class="relative h-12 w-full max-w-[48px] shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
      <img
        v-if="chat.avatar"
        :src="chat.avatar"
        :alt="safeStr(chat.name) || 'User'"
        class="object-cover object-center w-full h-full"
      />
      <span
        v-else
        class="flex items-center justify-center w-full h-full text-lg font-medium text-gray-600 dark:text-gray-300"
      >
        {{ (safeStr(chat.name) || '?').charAt(0).toUpperCase() }}
      </span>
      <span
        class="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900"
        :class="{
          'bg-success-500': chat.status === 'online',
          'bg-warning-500': chat.status === 'away',
          'bg-error-500': chat.status === 'offline',
        }"
      ></span>
    </div>
    <div class="w-full min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h5 class="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
            {{ safeStr(chat.name) || 'Пользователь' }}
          </h5>
          <p class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400 truncate">
            {{ safeStr(chat.role) || safeStr(chat.lastMessage) || 'Нет сообщений' }}
          </p>
        </div>
        <span class="text-gray-400 text-theme-xs shrink-0">{{ safeStr(chat.lastMessageTime) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatConversation } from '@/api/client'

function safeStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') return 'Пользователь'
  return String(v)
}

defineProps<{
  chat: ChatConversation
  selected?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
