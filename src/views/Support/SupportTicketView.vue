<template>
  <AdminLayout>
    <div>
      <PageBreadcrumb :pageTitle="pageTitle" />
      <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
        Загрузка...
      </div>
      <div v-else-if="error" class="p-8 text-center text-red-500">
        {{ error }}
      </div>
      <template v-else-if="ticket">
        <div class="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div class="xl:col-span-8 2xl:col-span-9">
            <div
              class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <!-- Header -->
              <div
                class="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-800 dark:text-white/90">
                    {{ ticket.ticketId }} — {{ ticket.subject }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatApiDateTime(ticket.createdAt) }}
                  </p>
                </div>
                <router-link
                  :to="'/dashboard/support'"
                  class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg class="stroke-current" width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path
                      d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  К списку запросов
                </router-link>
              </div>

              <!-- Messages -->
              <div class="relative px-6 py-7">
                <div
                  ref="messagesContainerRef"
                  class="custom-scrollbar max-h-[calc(58vh-200px)] space-y-7 divide-y divide-gray-200 overflow-y-auto pr-2 dark:divide-gray-800"
                >
                  <!-- Первое сообщение — исходный запрос -->
                  <MessageItem
                    :name="ticket.userName || ticket.userEmail || 'Пользователь'"
                    :email="ticket.userEmail || ''"
                    :avatar="getAvatarUrl(ticket.userAvatar)"
                    :time="formatApiDateTime(ticket.createdAt)"
                    :content="ticket.message || '—'"
                  />
                  <MessageItem
                    v-for="r in replies"
                    :key="r.id"
                    :name="r.userName || r.userEmail || 'Пользователь'"
                    :email="r.userEmail || ''"
                    :avatar="getAvatarUrl(r.userAvatar)"
                    :time="formatApiDateTime(r.createdAt)"
                    :content="r.message"
                  />
                </div>

                <!-- Reply Input -->
                <div class="pt-5">
                  <div
                    class="mx-auto w-full rounded-2xl border border-gray-200 shadow-xs dark:border-gray-800 dark:bg-gray-800"
                  >
                    <textarea
                      ref="replyTextareaRef"
                      v-model="replyText"
                      placeholder="Введите ваш ответ... (Ctrl+V — вставить скриншот)"
                      rows="4"
                      class="w-full resize-none border-none bg-transparent p-5 font-normal text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white"
                      @paste="onPaste"
                    />
                    <div v-if="attachments.length" class="flex flex-wrap gap-2 px-5 pb-2">
                      <div
                        v-for="(att, i) in attachments"
                        :key="i"
                        class="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <img v-if="att.type?.startsWith('image/')" :src="att.preview" class="h-12 w-12 rounded object-cover" alt="" />
                        <span v-else class="text-xs text-gray-500">{{ att.name || 'Файл' }}</span>
                        <button
                          type="button"
                          @click="removeAttachment(i)"
                          class="text-gray-400 hover:text-red-500"
                          title="Удалить"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div v-if="replyError" class="px-5 pb-2 text-sm text-red-500">
                      {{ replyError }}
                    </div>
                    <div class="flex items-center p-3">
                      <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <input type="file" multiple class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onFileSelect" />
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Прикрепить файл
                      </label>
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button
                      type="button"
                      :disabled="replyLoading || (!replyText.trim() && !attachments.length)"
                      @click="sendReply"
                      class="bg-brand-500 hover:bg-brand-600 shadow-theme-xs inline-flex h-9 items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {{ replyLoading ? 'Отправка...' : 'Ответить' }}
                    </button>
                  </div>
                </div>

                <!-- Status (для админа) -->
                <div v-if="isAdmin" class="mt-6 flex items-center gap-4">
                  <span class="text-gray-500 dark:text-gray-400">Статус:</span>
                  <div class="flex items-center gap-4">
                    <StatusRadio label="В ожидании" value="pending" v-model="status" @update:modelValue="updateStatus" />
                    <StatusRadio label="Решён" value="solved" v-model="status" @update:modelValue="updateStatus" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar: детали тикета -->
          <div class="xl:col-span-4 2xl:col-span-3">
            <div
              class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <h3 class="text-lg font-medium text-gray-800 dark:text-white/90">Детали тикета</h3>
              </div>
              <ul class="divide-y divide-gray-100 px-6 py-3 dark:divide-gray-800">
                <li class="grid grid-cols-2 gap-5 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Клиент</span>
                  <span class="text-gray-700 dark:text-gray-400">{{ ticket.userName || '—' }}</span>
                </li>
                <li class="grid grid-cols-2 gap-5 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span class="text-sm break-all text-gray-700 dark:text-gray-400">{{ ticket.userEmail || '—' }}</span>
                </li>
                <li class="grid grid-cols-2 gap-5 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">ID тикета</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-400">{{ ticket.ticketId }}</span>
                </li>
                <li class="grid grid-cols-2 gap-5 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Создан</span>
                  <span class="text-sm text-gray-700 dark:text-gray-400">{{ formatApiDateTime(ticket.createdAt) }}</span>
                </li>
                <li class="grid grid-cols-2 gap-5 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Статус</span>
                  <span
                    :class="ticket.status === 'solved'
                      ? 'bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500'
                      : 'bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-500'"
                    class="text-theme-xs rounded-full px-2 py-0.5 font-medium"
                  >
                    {{ ticket.status === 'solved' ? 'Решён' : 'В ожидании' }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MessageItem from '@/components/support/MessageItem.vue'
import StatusRadio from '@/components/support/StatusRadio.vue'
import { api, getApiBase } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { formatApiDateTime } from '@/composables/useApiDate'

const route = useRoute()
const { currentUser } = useAuth()

const ticket = ref(null)
const replies = ref([])
const loading = ref(true)
const error = ref('')
const replyText = ref('')
const replyLoading = ref(false)
const replyError = ref('')
const status = ref('pending')
const attachments = ref([])
const messagesContainerRef = ref(null)
const replyTextareaRef = ref(null)

const isAdmin = computed(() => currentUser.value?.role_id === 2)

const pageTitle = computed(() => {
  if (!ticket.value) return 'Тикет'
  return `${ticket.value.ticketId} — ${ticket.value.subject}`
})

function getAvatarUrl(userImg) {
  if (!userImg || !String(userImg).trim()) return ''
  const img = String(userImg)
  if (img.startsWith('http')) return img
  const base = getApiBase()
  return base ? `${base.replace(/\/$/, '')}${img.startsWith('/') ? '' : '/'}${img}` : img
}

function scrollToLastMessage() {
  nextTick(() => {
    const el = messagesContainerRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function loadTicket() {
  const id = route.params.id
  if (!id) {
    error.value = 'ID тикета не указан'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await api.get(`/api/support/${id}`)
    ticket.value = data.ticket
    replies.value = data.replies || []
    status.value = data.ticket?.status || 'pending'
    scrollToLastMessage()
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить тикет'
    ticket.value = null
    replies.value = []
  } finally {
    loading.value = false
  }
}

function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type?.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) addAttachmentFromFile(file)
      return
    }
  }
}

function onFileSelect(e) {
  const files = e.target.files
  if (!files?.length) return
  for (let i = 0; i < files.length; i++) addAttachmentFromFile(files[i])
  e.target.value = ''
}

function addAttachmentFromFile(file) {
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    replyError.value = 'Файл не должен превышать 5 МБ'
    return
  }
  const att = {
    file,
    name: file.name,
    type: file.type,
    preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
  }
  attachments.value = [...attachments.value, att]
}

function removeAttachment(index) {
  const att = attachments.value[index]
  if (att?.preview) URL.revokeObjectURL(att.preview)
  attachments.value = attachments.value.filter((_, i) => i !== index)
}

async function uploadAttachments() {
  if (!attachments.value.length || !ticket.value) return []
  const base = getApiBase() || ''
  const token = localStorage.getItem('auth_token')
  const uploaded = []
  for (const att of attachments.value) {
    const fd = new FormData()
    fd.append('file', att.file)
    const url = `${base}/api/upload/support-file?ticketId=${encodeURIComponent(ticket.value.id)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
    if (!res.ok) throw new Error('Ошибка загрузки файла')
    const data = await res.json()
    if (data?.url) uploaded.push({ url: data.url, name: att.name })
  }
  return uploaded
}

async function sendReply() {
  const text = replyText.value.trim()
  if ((!text && !attachments.value.length) || !ticket.value) return
  replyError.value = ''
  replyLoading.value = true
  try {
    let message = text || ''
    if (attachments.value.length) {
      const urls = await uploadAttachments()
      attachments.value.forEach((att) => {
        if (att.preview) URL.revokeObjectURL(att.preview)
      })
      attachments.value = []
      if (urls.length) {
        const imgLines = urls.filter((u) => /\.(jpe?g|png|gif|webp)$/i.test(u.url)).map((u) => `![${u.name}](${u.url})`).join('\n')
        const otherLines = urls.filter((u) => !/\.(jpe?g|png|gif|webp)$/i.test(u.url)).map((u) => `[${u.name}](${u.url})`).join('\n')
        const parts = [message, imgLines, otherLines].filter(Boolean)
        message = parts.join('\n\n')
      }
    }
    const newReply = await api.post(`/api/support/${ticket.value.id}/reply`, { message: message || ' ' })
    replies.value = [...replies.value, newReply]
    replyText.value = ''
    scrollToLastMessage()
  } catch (e) {
    replyError.value = e?.message || 'Не удалось отправить ответ'
  } finally {
    replyLoading.value = false
  }
}

async function updateStatus(newStatus) {
  if (!ticket.value || !isAdmin.value) return
  try {
    await api.patch(`/api/support/${ticket.value.id}`, { status: newStatus })
    ticket.value = { ...ticket.value, status: newStatus }
  } catch (e) {
    status.value = ticket.value.status
  }
}

watch(() => route.params.id, () => loadTicket(), { immediate: false })

onMounted(() => loadTicket())
</script>
