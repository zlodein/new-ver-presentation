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
                  class="custom-scrollbar max-h-[calc(58vh-162px)] space-y-7 divide-y divide-gray-200 overflow-y-auto pr-2 dark:divide-gray-800"
                >
                  <!-- Первое сообщение — исходный запрос -->
                  <MessageItem
                    :name="ticket.userName || ticket.userEmail || 'Пользователь'"
                    :email="ticket.userEmail || ''"
                    :avatar="''"
                    :time="formatApiDateTime(ticket.createdAt)"
                    :content="ticket.message || '—'"
                  />
                  <MessageItem
                    v-for="r in replies"
                    :key="r.id"
                    :name="r.userName || r.userEmail || 'Пользователь'"
                    :email="r.userEmail || ''"
                    :avatar="''"
                    :time="formatApiDateTime(r.createdAt)"
                    :content="r.message"
                  />
                </div>

                <!-- Reply Input -->
                <div class="pt-5">
                  <div
                    class="mx-auto max-h-[162px] w-full rounded-2xl border border-gray-200 shadow-xs dark:border-gray-800 dark:bg-gray-800"
                  >
                    <textarea
                      v-model="replyText"
                      placeholder="Введите ваш ответ..."
                      rows="4"
                      class="w-full resize-none border-none bg-transparent p-5 font-normal text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white"
                    />
                    <div v-if="replyError" class="px-5 pb-2 text-sm text-red-500">
                      {{ replyError }}
                    </div>
                    <div class="flex items-center justify-between p-3">
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ replies.length + 1 }} сообщ.</span>
                      <button
                        type="button"
                        :disabled="replyLoading || !replyText.trim()"
                        @click="sendReply"
                        class="bg-brand-500 hover:bg-brand-600 shadow-theme-xs inline-flex h-9 items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {{ replyLoading ? 'Отправка...' : 'Ответить' }}
                      </button>
                    </div>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import MessageItem from '@/components/support/MessageItem.vue'
import StatusRadio from '@/components/support/StatusRadio.vue'
import { api } from '@/api/client'
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

const isAdmin = computed(() => currentUser.value?.role_id === 2)

const pageTitle = computed(() => {
  if (!ticket.value) return 'Тикет'
  return `${ticket.value.ticketId} — ${ticket.value.subject}`
})

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
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить тикет'
    ticket.value = null
    replies.value = []
  } finally {
    loading.value = false
  }
}

async function sendReply() {
  const text = replyText.value.trim()
  if (!text || !ticket.value) return
  replyError.value = ''
  replyLoading.value = true
  try {
    const newReply = await api.post(`/api/support/${ticket.value.id}/reply`, { message: text })
    replies.value = [...replies.value, newReply]
    replyText.value = ''
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
