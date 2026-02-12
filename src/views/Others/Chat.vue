<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
      <div class="flex flex-col h-full gap-6 xl:flex-row xl:gap-5">
        <chat-sidebar
          :conversations="chat.conversations"
          :loading="chat.loadingConversations"
          :search-query="chat.searchQuery"
          :selected-user-id="chat.selectedUserId"
          @select="chat.setSelectedUser"
          @search="chat.setSearchQuery"
          @load="chat.loadConversations(); chat.loadUsers()"
        />
        <chat-box
          :selected-conversation="chat.selectedConversation"
          :messages="chat.messages"
          :loading-messages="chat.loadingMessages"
          :sending="chat.sending"
          @send="(msg) => chat.selectedUserId && chat.sendMessage(chat.selectedUserId, msg)"
          @close="chat.setSelectedUser(null)"
        />
      </div>
    </div>
  </admin-layout>
</template>

<script setup>
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ChatSidebar from '../../components/chat/ChatSidebar.vue'
import ChatBox from '../../components/chat/ChatBox.vue'
import { useChat } from '@/composables/useChat'

const currentPageTitle = ref('Чат')
const chat = useChat()

onMounted(() => {
  chat.loadConversations()
  chat.loadUsers()
})
</script>

<style></style>
