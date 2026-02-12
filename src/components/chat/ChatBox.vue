<template>
  <div
    class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4"
  >
    <!-- Header -->
    <div
      v-if="selectedConversation"
      class="sticky flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 xl:px-6"
    >
      <div class="flex items-center gap-3">
        <div class="relative h-12 w-full max-w-[48px] shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            v-if="selectedConversation.avatar"
            :src="selectedConversation.avatar"
            :alt="selectedConversation.name"
            class="object-cover object-center w-full h-full"
          />
          <span
            v-else
            class="flex items-center justify-center w-full h-full text-lg font-medium text-gray-600 dark:text-gray-300"
          >
            {{ selectedConversation.name.charAt(0).toUpperCase() }}
          </span>
          <span
            class="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900"
            :class="{
              'bg-success-500': selectedConversation.status === 'online',
              'bg-warning-500': selectedConversation.status === 'away',
              'bg-error-500': selectedConversation.status === 'offline',
            }"
          ></span>
        </div>
        <h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ selectedConversation.name }}</h5>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
          title="Звонок"
        >
          <svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.54488 11.7254L8.80112 10.056C8.94007 9.98476 9.071 9.89524 9.16639 9.77162C9.57731 9.23912 9.66722 8.51628 9.38366 7.89244L7.76239 4.32564C7.23243 3.15974 5.7011 2.88206 4.79552 3.78764L3.72733 4.85577C3.36125 5.22182 3.18191 5.73847 3.27376 6.24794C3.9012 9.72846 5.56003 13.0595 8.25026 15.7497C10.9405 18.44 14.2716 20.0988 17.7521 20.7262C18.2615 20.8181 18.7782 20.6388 19.1442 20.2727L20.2124 19.2045C21.118 18.2989 20.8403 16.7676 19.6744 16.2377L16.1076 14.6164C15.4838 14.3328 14.7609 14.4227 14.2284 14.8336C14.1048 14.929 14.0153 15.06 13.944 15.1989L12.2747 18.4552" stroke="" stroke-width="1.5" />
          </svg>
        </button>
        <button type="button" class="text-gray-700 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90" title="Видеозвонок">
          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4.25 5.25C3.00736 5.25 2 6.25736 2 7.5V16.5C2 17.7426 3.00736 18.75 4.25 18.75H15.25C16.4926 18.75 17.5 17.7426 17.5 16.5V15.3957L20.1118 16.9465C20.9451 17.4412 22 16.8407 22 15.8716V8.12838C22 7.15933 20.9451 6.55882 20.1118 7.05356L17.5 8.60433V7.5C17.5 6.25736 16.4926 5.25 15.25 5.25H4.25ZM17.5 10.3488V13.6512L20.5 15.4325V8.56756L17.5 10.3488ZM3.5 7.5C3.5 7.08579 3.83579 6.75 4.25 6.75H15.25C15.6642 6.75 16 7.08579 16 7.5V16.5C16 16.9142 15.6642 17.25 15.25 17.25H4.25C3.83579 17.25 3.5 16.9142 3.5 16.5V7.5Z" fill="" />
          </svg>
        </button>
        <div class="relative -mb-1.5">
          <DropdownMenu :menu-items="menuItems">
            <template #icon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 12.0041 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z" fill="currentColor" />
              </svg>
            </template>
          </DropdownMenu>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-gray-500 dark:text-gray-400"
    >
      <svg class="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-sm">Выберите диалог слева или начните переписку с пользователем.</p>
    </div>

    <!-- Messages -->
    <div
      v-if="selectedConversation"
      ref="messagesContainer"
      class="flex-1 max-h-full p-5 space-y-6 overflow-auto custom-scrollbar xl:space-y-8 xl:p-6"
    >
      <div v-if="loadingMessages" class="flex justify-center py-4 text-sm text-gray-500">
        Загрузка сообщений...
      </div>
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="msg.isOwn ? 'ml-auto max-w-[350px] text-right' : 'max-w-[350px]'"
        >
          <div v-if="!msg.isOwn" class="flex items-start gap-4">
            <div class="w-full h-10 rounded-full max-w-10 shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                v-if="selectedConversation.avatar"
                :src="selectedConversation.avatar"
                :alt="selectedConversation.name"
                class="object-cover object-center w-full h-full"
              />
              <span v-else class="flex items-center justify-center w-full h-full text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ selectedConversation.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <div class="px-3 py-2 bg-gray-100 rounded-lg rounded-tl-sm dark:bg-white/5">
                <p class="text-sm text-gray-800 dark:text-white/90">{{ msg.message }}</p>
              </div>
              <p class="mt-2 text-gray-500 text-theme-xs dark:text-gray-400">{{ formatTime(msg.createdAt) }}</p>
            </div>
          </div>
          <div v-else>
            <div class="px-3 py-2 ml-auto rounded-lg rounded-tr-sm max-w-max bg-brand-500 dark:bg-brand-500">
              <p class="text-sm text-white dark:text-white/90">{{ msg.message }}</p>
            </div>
            <p class="mt-2 text-gray-500 text-theme-xs dark:text-gray-400">{{ formatTime(msg.createdAt) }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Send form -->
    <div
      v-if="selectedConversation"
      class="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-800"
    >
      <form class="flex items-center justify-between gap-2" @submit.prevent="onSubmit">
        <div class="relative w-full">
          <input
            v-model="messageText"
            type="text"
            placeholder="Введите сообщение..."
            class="w-full pl-12 pr-5 text-sm text-gray-800 bg-transparent border-none outline-hidden h-9 placeholder:text-gray-400 focus:border-0 focus:ring-0 dark:text-white/90"
            :disabled="sending"
          />
        </div>
        <div class="flex items-center shrink-0">
          <button
            type="submit"
            class="flex items-center justify-center ml-3 text-white rounded-lg h-9 w-9 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 xl:ml-5"
            :disabled="sending || !messageText.trim()"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.98481 2.44399C3.11333 1.57147 1.15325 3.46979 1.96543 5.36824L3.82086 9.70527C3.90146 9.89367 3.90146 10.1069 3.82086 10.2953L1.96543 14.6323C1.15326 16.5307 3.11332 18.4291 4.98481 17.5565L16.8184 12.0395C18.5508 11.2319 18.5508 8.76865 16.8184 7.961L4.98481 2.44399ZM3.34453 4.77824C3.0738 4.14543 3.72716 3.51266 4.35099 3.80349L16.1846 9.32051C16.762 9.58973 16.762 10.4108 16.1846 10.68L4.35098 16.197C3.72716 16.4879 3.0738 15.8551 3.34453 15.2223L5.19996 10.8853C5.21944 10.8397 5.23735 10.7937 5.2537 10.7473L9.11784 10.7473C9.53206 10.7473 9.86784 10.4115 9.86784 9.99726C9.86784 9.58304 9.53206 9.24726 9.11784 9.24726L5.25157 9.24726C5.2358 9.20287 5.2186 9.15885 5.19996 9.11528L3.34453 4.77824Z" fill="white" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatConversation } from '@/api/client'
import type { ChatMessageItem } from '@/api/client'
import DropdownMenu from '../common/DropdownMenu.vue'

const props = defineProps<{
  selectedConversation: ChatConversation | null
  messages: ChatMessageItem[]
  loadingMessages: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  close: []
}>()

const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const menuItems = [
  { label: 'Подробнее', onClick: () => {} },
  { label: 'Удалить', onClick: () => {} },
]

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин`
  if (diffHours < 24) return `${diffHours} ч`
  if (diffDays < 7) return `${diffDays} дн`
  return d.toLocaleDateString()
}

function onSubmit() {
  const text = messageText.value.trim()
  if (!text || !props.selectedConversation || props.sending) return
  emit('send', text)
  messageText.value = ''
}

watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      const el = messagesContainer.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
)

</script>

<style></style>
