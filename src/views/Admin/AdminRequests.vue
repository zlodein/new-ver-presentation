<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Запросы в поддержку</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Все обращения пользователей
          </p>
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
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Пользователь</th>
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
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ item.userName || item.userEmail || '—' }}
                  </div>
                  <div v-if="item.userName && item.userEmail" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ item.userEmail }}
                  </div>
                  <div v-else-if="item.userEmail" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ item.userEmail }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ item.subject }}
                </td>
                <td class="max-w-xs px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ item.message || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="item.status === 'solved'
                      ? 'bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500'
                      : 'bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-500'"
                    class="text-theme-xs rounded-full px-2 py-0.5 font-medium"
                  >
                    {{ item.status === 'solved' ? 'Решён' : 'В ожидании' }}
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
                  Нет запросов
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'

const currentPageTitle = ref('Запросы')

const requests = ref([])
const loading = ref(true)
const error = ref('')

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function loadRequests() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.get('/api/admin/support')
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
  try {
    await api.get(`/api/admin/support/actions/delete/${encodeURIComponent(item.id)}`)
    requests.value = requests.value.filter((r) => r.id !== item.id)
  } catch (e) {
    error.value = e?.message || 'Не удалось удалить запрос'
    loadRequests()
  }
}

onMounted(() => loadRequests())
</script>
