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
  const selectedConversation = computed(() => {
    const sid = toStrId(selectedUserId.value)
    if (!sid) return null
    const found = conversations.value.find((c) => toStrId(c.userId) === sid || toStrId(c.id) === sid) ?? null
    console.log('[Chat] selectedConversation', { selectedUserId: selectedUserId.value, sid, found: !!found, conversationsCount: conversations.value.length })
    return found
  })

  const filteredConversations = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return conversations.value
    return conversations.value.filter(
      (c) =>
        (typeof c.name === 'string' && c.name.toLowerCase().includes(q)) ||
        (typeof c.role === 'string' && c.role.toLowerCase().includes(q)) ||
        (typeof c.lastMessage === 'string' && c.lastMessage.toLowerCase().includes(q))
    )
  })

  function toStrId(v: unknown): string {
    if (v == null) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    if (typeof v === 'object') return ''
    return String(v)
  }

  function normalizeConversation(c: ChatConversation): ChatConversation {
    const id = toStrId(c.userId ?? c.id)
    return {
      ...c,
      id: id || toStrId(c.id),
      userId: id,
      name: typeof c.name === 'string' ? c.name : (c.name != null ? 'Пользователь' : ''),
      role: typeof c.role === 'string' ? c.role : '',
      lastMessage: typeof c.lastMessage === 'string' ? c.lastMessage : '',
      lastMessageTime: typeof c.lastMessageTime === 'string' ? c.lastMessageTime : '',
    }
  }

  async function loadConversations() {
    if (!hasApi()) {
      console.log('[Chat] loadConversations: нет API, пропуск')
      return
    }
    console.log('[Chat] loadConversations: начало')
    loadingConversations.value = true
    try {
      const list = await api.get<ChatConversation[]>('/api/chat/conversations')
      console.log('[Chat] loadConversations: ответ', list?.length ?? 0, list)
      conversations.value = (list ?? []).map(normalizeConversation)
      console.log('[Chat] loadConversations: нормализовано', conversations.value.length, conversations.value)
    } catch (err) {
      console.error('[Chat] loadConversations: ошибка', err)
      conversations.value = []
    } finally {
      loadingConversations.value = false
      console.log('[Chat] loadConversations: конец, loading=false')
    }
  }

  async function loadUsers() {
    if (!hasApi()) {
      console.log('[Chat] loadUsers: нет API, пропуск')
      return
    }
    console.log('[Chat] loadUsers: начало')
    loadingConversations.value = true
    try {
      const list = await api.get<ChatConversation[]>('/api/chat/users')
      console.log('[Chat] loadUsers: ответ', list?.length ?? 0, list)
      const byUserId = new Map<string, ChatConversation>()
      for (const c of conversations.value) byUserId.set(toStrId(c.userId), c)
      for (const u of list ?? []) {
        const uid = toStrId(u.userId ?? u.id)
        if (!uid) continue
        if (!byUserId.has(uid)) byUserId.set(uid, normalizeConversation({ ...u, lastMessage: '', lastMessageTime: '' }))
      }
      conversations.value = Array.from(byUserId.values()).sort((a, b) => {
        const at = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const bt = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        if (bt !== at) return bt - at
        return (a.name || '').localeCompare(b.name || '')
      })
      console.log('[Chat] loadUsers: объединённый список', conversations.value.length, conversations.value)
    } catch (err) {
      console.error('[Chat] loadUsers: ошибка', err)
    } finally {
      loadingConversations.value = false
      console.log('[Chat] loadUsers: конец, loading=false')
    }
  }

  async function loadMessages(withUserId: string) {
    const uid = toStrId(withUserId)
    if (!hasApi() || !uid) {
      console.log('[Chat] loadMessages: нет API или userId', { withUserId, uid })
      return
    }
    console.log('[Chat] loadMessages: начало', uid)
    loadingMessages.value = true
    try {
      const list = await api.get<ChatMessageItem[]>(`/api/chat/messages?with=${encodeURIComponent(uid)}`)
      console.log('[Chat] loadMessages: ответ', list?.length ?? 0, list)
      messages.value = list ?? []
    } catch (err) {
      console.error('[Chat] loadMessages: ошибка', err)
      messages.value = []
    } finally {
      loadingMessages.value = false
      console.log('[Chat] loadMessages: конец, loading=false')
    }
  }

  async function sendMessage(toUserId: string | number, message: string) {
    const uid = toStrId(toUserId)
    if (!hasApi() || !uid || !message.trim()) return null
    console.log('[Chat] sendMessage', uid, message.trim().slice(0, 50))
    sending.value = true
    try {
      const created = await api.post<ChatMessageItem & { isOwn: boolean }>('/api/chat/messages', {
        toUserId: uid,
        message: message.trim(),
      })
      if (created) {
        messages.value = [...messages.value, { ...created, isOwn: true }]
        const conv = conversations.value.find((c) => toStrId(c.userId) === uid || toStrId(c.id) === uid)
        if (conv) {
          conv.lastMessage = created.message
          conv.lastMessageTime = created.createdAt ?? ''
        } else {
          await loadConversations()
        }
        return created
      }
      return null
    } catch (err) {
      console.error('[Chat] sendMessage: ошибка', err)
      return null
    } finally {
      sending.value = false
    }
  }

  function setSelectedUser(userId: string | number | null) {
    const sid = userId != null ? toStrId(userId) : null
    console.log('[Chat] setSelectedUser', { userId, sid })
    selectedUserId.value = sid
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
