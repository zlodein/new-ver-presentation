<template>
  <AdminLayout>
    <div>
      <PageBreadcrumb :pageTitle="currentPageTitle" />
      <SupportOverview :total="requests.length" :pending="pendingCount" :solved="solvedCount" />
      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div
          class="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Мои запросы</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Список ваших обращений в поддержку
            </p>
          </div>
          <button
            type="button"
            @click="showCreateModal = true"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            <PlusIcon class="h-5 w-5" />
            Создать запрос
          </button>
        </div>
        <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
          Загрузка...
        </div>
        <div v-else-if="error" class="p-8 text-center text-red-500">
          {{ error }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Тема</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Сообщение</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Дата</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Статус</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="item in requests"
                :key="item.id"
                class="transition hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {{ item.ticketId || '#' + item.id }}
                </td>
                <td class="px-4 py-3">
                  <router-link
                    :to="'/dashboard/support/' + item.id"
                    class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {{ item.subject }}
                  </router-link>
                </td>
                <td class="max-w-xs px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ item.message || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {{ formatApiDate(item.createdAt) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="item.status === 'solved'
                      ? 'bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500'
                      : item.status === 'in_progress'
                        ? 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500'
                        : 'bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-500'"
                    class="text-theme-xs rounded-full px-2 py-0.5 font-medium"
                  >
                    {{ item.status === 'solved' ? 'Решён' : item.status === 'in_progress' ? 'В работе' : 'В ожидании' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    type="button"
                    @click="confirmDelete(item)"
                    class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    title="Удалить"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
              <tr v-if="!requests.length">
                <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Нет запросов. Нажмите «Создать запрос», чтобы отправить обращение.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания запроса -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        @click.self="showCreateModal = false"
      >
        <div
          class="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Новый запрос</h4>
          <form @submit.prevent="submitCreate" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Тема</label>
              <input
                v-model="createForm.subject"
                type="text"
                required
                maxlength="500"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Кратко опишите тему"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Сообщение</label>
              <textarea
                ref="createMessageTextareaRef"
                v-model="createForm.message"
                rows="5"
                class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Опишите ваш вопрос или проблему (Ctrl+V — вставить скриншот)"
                @paste="onCreatePaste"
              />
            </div>
            <div v-if="createAttachments.length" class="flex flex-wrap gap-2">
              <div
                v-for="(att, i) in createAttachments"
                :key="i"
                class="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
              >
                <img v-if="att.type?.startsWith('image/')" :src="att.preview" class="h-12 w-12 rounded object-cover" alt="" />
                <span v-else class="text-xs text-gray-500">{{ att.name || 'Файл' }}</span>
                <button
                  type="button"
                  @click="removeCreateAttachment(i)"
                  class="text-gray-400 hover:text-red-500"
                  title="Удалить"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <input type="file" multiple class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onCreateFileSelect" />
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Прикрепить файл
              </label>
            </div>
            <div v-if="createError" class="text-sm text-red-500">{{ createError }}</div>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="closeCreateModal"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="createLoading || !createForm.subject.trim()"
                class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {{ createLoading ? 'Отправка...' : 'Отправить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import SupportOverview from '@/components/support/SupportOverview.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { api, hasApi, getToken, getApiBase } from '@/api/client'
import { formatApiDate } from '@/composables/useApiDate'

const currentPageTitle = ref('Поддержка')

const requests = ref([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const createForm = ref({ subject: '', message: '' })
const createAttachments = ref([])
const createLoading = ref(false)
const createError = ref('')
const createMessageTextareaRef = ref(null)

const pendingCount = computed(() => requests.value.filter((r) => r.status === 'pending').length)
const solvedCount = computed(() => requests.value.filter((r) => r.status === 'solved').length)

async function loadRequests() {
  if (!hasApi() || !getToken()) {
    loading.value = false
    requests.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await api.get('/api/support')
    requests.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.message || 'Не удалось загрузить запросы'
    requests.value = []
  } finally {
    loading.value = false
  }
}

function confirmDelete(item) {
  if (!window.confirm(`Удалить запрос «${item.subject}»?`)) return
  deleteRequest(item)
}

async function deleteRequest(item) {
  if (!hasApi() || !getToken()) return
  try {
    await api.get(`/api/support/actions/delete/${encodeURIComponent(item.id)}`)
    requests.value = requests.value.filter((r) => r.id !== item.id)
  } catch (e) {
    error.value = e?.message || 'Не удалось удалить запрос'
    loadRequests()
  }
}

function onCreatePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type?.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) addCreateAttachment(file)
      return
    }
  }
}

function onCreateFileSelect(e) {
  const files = e.target.files
  if (!files?.length) return
  for (let i = 0; i < files.length; i++) addCreateAttachment(files[i])
  e.target.value = ''
}

function addCreateAttachment(file) {
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    createError.value = 'Файл не должен превышать 5 МБ'
    return
  }
  createAttachments.value = [
    ...createAttachments.value,
    {
      file,
      name: file.name,
      type: file.type,
      preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    },
  ]
}

function removeCreateAttachment(index) {
  const att = createAttachments.value[index]
  if (att?.preview) URL.revokeObjectURL(att.preview)
  createAttachments.value = createAttachments.value.filter((_, i) => i !== index)
}

async function uploadCreateAttachments() {
  if (!createAttachments.value.length) return []
  const base = getApiBase() || ''
  const token = getToken()
  const uploaded = []
  for (const att of createAttachments.value) {
    const fd = new FormData()
    fd.append('file', att.file)
    const url = `${base}/api/upload/support-file?ticketId=new`
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

function closeCreateModal() {
  showCreateModal.value = false
  createAttachments.value.forEach((att) => {
    if (att.preview) URL.revokeObjectURL(att.preview)
  })
  createAttachments.value = []
  createForm.value = { subject: '', message: '' }
  createError.value = ''
}

async function submitCreate() {
  const subject = createForm.value.subject.trim() || 'Без темы'
  let message = (createForm.value.message || '').trim()
  if (!subject && !message && !createAttachments.value.length) return
  createError.value = ''
  createLoading.value = true
  try {
    if (createAttachments.value.length) {
      const urls = await uploadCreateAttachments()
      createAttachments.value.forEach((att) => {
        if (att.preview) URL.revokeObjectURL(att.preview)
      })
      createAttachments.value = []
      if (urls.length) {
        const imgLines = urls.filter((u) => /\.(jpe?g|png|gif|webp)$/i.test(u.url)).map((u) => `![${u.name}](${u.url})`).join('\n')
        const otherLines = urls.filter((u) => !/\.(jpe?g|png|gif|webp)$/i.test(u.url)).map((u) => `[${u.name}](${u.url})`).join('\n')
        const parts = [message, imgLines, otherLines].filter(Boolean)
        message = parts.join('\n\n')
      }
    }
    await api.post('/api/support', {
      subject,
      message: message || ' ',
    })
    showCreateModal.value = false
    createForm.value = { subject: '', message: '' }
    await loadRequests()
  } catch (e) {
    createError.value = e?.message || 'Не удалось отправить запрос'
  } finally {
    createLoading.value = false
  }
}

onMounted(() => loadRequests())
</script>
