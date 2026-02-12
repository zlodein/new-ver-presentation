<template>
  <div
    class="xl:w-1/4 flex-col w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:flex"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 transition-all duration-300 z-999999 bg-gray-900/50"
      @click="toggleSidebar"
    ></div>

    <chat-header
      :search-query="searchQuery"
      @toggle="toggleSidebar"
      @search="$emit('search', $event)"
    />
    <chat-list
      :is-open="isOpen"
      :conversations="conversations"
      :loading="loading"
      :selected-user-id="selectedUserId"
      @toggle="toggleSidebar"
      @select="$emit('select', $event)"
      @load="$emit('load')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChatConversation } from '@/api/client'
import ChatHeader from './ChatHeader.vue'
import ChatList from './ChatList.vue'

const isOpen = ref(false)

defineProps<{
  conversations: ChatConversation[]
  loading: boolean
  searchQuery: string
  selectedUserId: string | null
}>()

defineEmits<{
  select: [userId: string]
  search: [query: string]
  load: []
}>()

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}
</script>
