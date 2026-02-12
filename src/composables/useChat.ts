import { ref, computed, watch } from 'vue'
import { api, hasApi, type ChatConversation, type ChatMessageItem } from '@/api/client'

const conversations = ref<ChatConversation[]>([])
const selectedUserId = ref<string | null>(null)
const messages = ref<ChatMessageItem[]>([])
const loadingConversations = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const searchQuery = ref('')

export function useChat() {
  const selectedConversation = computed(() =>
    selectedUserId.value ? conversations.value.find((c) => c.userId === selectedUserId.value || c.id === selectedUserId.value) ?? null : null
  )

  const filteredConversations = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return conversations.value
    return conversations.value.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        c.lastMessage.toLowerCase().includes(q)
    )
  })

  async function loadConversations() {
    if (!hasApi()) return
    loadingConversations.value = true
    try {
      const list = await api.get<ChatConversation[]>('/api/chat/conversations')
      conversations.value = list ?? []
    } catch {
      conversations.value = []
    } finally {
      loadingConversations.value = false
    }
  }

  async function loadUsers() {
    if (!hasApi()) return
    loadingConversations.value = true
    try {
      const list = await api.get<ChatConversation[]>('/api/chat/users')
      // Merge with existing conversations by userId, avoid duplicates
      const byUserId = new Map<string, ChatConversation>()
      for (const c of conversations.value) byUserId.set(c.userId, c)
      for (const u of list ?? []) {
        if (!byUserId.has(u.userId)) byUserId.set(u.userId, { ...u, lastMessage: '', lastMessageTime: '' })
      }
      conversations.value = Array.from(byUserId.values()).sort((a, b) => {
        const at = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const bt = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        if (bt !== at) return bt - at
        return (a.name || '').localeCompare(b.name || '')
      })
    } catch {
      // keep existing
    } finally {
      loadingConversations.value = false
    }
  }

  async function loadMessages(withUserId: string) {
    if (!hasApi() || !withUserId) return
    loadingMessages.value = true
    try {
      const list = await api.get<ChatMessageItem[]>(`/api/chat/messages?with=${encodeURIComponent(withUserId)}`)
      messages.value = list ?? []
    } catch {
      messages.value = []
    } finally {
      loadingMessages.value = false
    }
  }

  async function sendMessage(toUserId: string, message: string) {
    if (!hasApi() || !toUserId || !message.trim()) return null
    sending.value = true
    try {
      const created = await api.post<ChatMessageItem & { isOwn: boolean }>('/api/chat/messages', {
        toUserId,
        message: message.trim(),
      })
      if (created) {
        messages.value = [...messages.value, { ...created, isOwn: true }]
        // Update last message in conversation
        const conv = conversations.value.find((c) => c.userId === toUserId || c.id === toUserId)
        if (conv) {
          conv.lastMessage = created.message
          conv.lastMessageTime = created.createdAt ?? ''
        } else {
          await loadConversations()
        }
        return created
      }
      return null
    } catch {
      return null
    } finally {
      sending.value = false
    }
  }

  function setSelectedUser(userId: string | null) {
    selectedUserId.value = userId
  }

  function setSearchQuery(q: string) {
    searchQuery.value = q
  }

  watch(selectedUserId, (id) => {
    if (id) loadMessages(id)
    else messages.value = []
  })

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    selectedUserId,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    searchQuery,
    loadConversations,
    loadUsers,
    loadMessages,
    sendMessage,
    setSelectedUser,
    setSearchQuery,
  }
}
