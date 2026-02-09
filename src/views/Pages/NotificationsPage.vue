<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12"
    >
      <div class="mb-6 flex items-center justify-between">
          <h3
            class="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl"
          >
            Все уведомления
          </h3>
          <button
            v-if="notifications.length > 0"
            @click="handleClearAll"
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            <svg
              class="fill-current"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M9 2C8.62123 2 8.27497 2.214 8.10557 2.55279L7.38197 4H4C3.44772 4 3 4.44772 3 5C3 5.55228 3.44772 6 4 6V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V6C16.5523 6 17 5.55228 17 5C17 4.44772 16.5523 4 16 4H12.618L11.8944 2.55279C11.725 2.214 11.3788 2 11 2H9ZM6 6V16H14V6H6ZM8 8C8.55228 8 9 8.44772 9 9V13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13V9C7 8.44772 7.44772 8 8 8ZM12 8C12.5523 8 13 8.44772 13 9V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V9C11 8.44772 11.4477 8 12 8Z"
                fill="currentColor"
              />
            </svg>
            Удалить все
          </button>
        </div>

        <div v-if="loading" class="text-center py-12">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p class="mt-4 text-gray-500 dark:text-gray-400">Загрузка уведомлений...</p>
        </div>

        <div v-else-if="notifications.length === 0" class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Нет уведомлений
          </h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Здесь будут отображаться все ваши уведомления
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            role="button"
            tabindex="0"
            @click="handleNotificationClick(notification)"
            @keydown.enter="handleNotificationClick(notification)"
            class="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/5 transition-shadow cursor-pointer"
            :class="{ 'bg-gray-50 dark:bg-white/5': !notification.read }"
          >
            <div
              v-if="notification.type !== 'calendar' && notification.type !== 'presentation'"
              :class="{
                'bg-success-500': notification.type === 'success',
                'bg-warning-500': notification.type === 'warning',
                'bg-error-500': notification.type === 'error',
                'bg-primary-500': notification.type === 'info',
              }"
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white text-lg font-semibold"
            >
              {{ notification.title.charAt(0).toUpperCase() }}
            </div>

            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
                    {{ notification.title }}
                  </h4>
                  <p v-if="notification.message" class="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {{ notification.message }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTime(notification.createdAt) }}
                  </p>
                </div>

                <div class="ml-4 flex items-center gap-2" @click.stop>
                  <span
                    v-if="!notification.read"
                    class="h-2 w-2 rounded-full bg-orange-400"
                  ></span>
                  <button
                    @click="handleDelete(notification.id)"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Удалить уведомление"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'

const router = useRouter()
const currentPageTitle = ref('Уведомления')
const notifications = ref([])
const loading = ref(false)

function navigateFromNotification(notification) {
  const sourceId = notification.sourceId ?? notification.source_id
  if (notification.type === 'calendar' && sourceId) {
    router.push({ path: '/dashboard/calendar', query: { eventId: String(sourceId) } })
    return
  }
  if (notification.type === 'presentation' && sourceId) {
    router.push({ path: `/dashboard/presentations/${sourceId}/edit` })
    return
  }
}

const handleNotificationClick = async (notification) => {
  const id = notification?.id != null ? String(notification.id).trim() : ''
  if (!notification.read && id) {
    try {
      await api.put(`/api/notifications/${id}/read`)
      notification.read = true
    } catch (err) {
      console.error('Ошибка отметки уведомления:', err)
    }
  }
  navigateFromNotification(notification)
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (diffMins < 1) return `только что, ${timeStr}`
  if (diffMins < 60) return `${diffMins} мин. назад, ${timeStr}`
  if (diffHours < 24) return `${diffHours} ч. назад, ${timeStr}`
  if (diffDays < 7) return `${diffDays} дн. назад, ${timeStr}`
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadNotifications = async () => {
  try {
    loading.value = true
    const data = await api.get('/api/notifications')
    notifications.value = data
  } catch (err) {
    console.error('Ошибка загрузки уведомлений:', err)
    alert('Ошибка загрузки уведомлений')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await api.get(`/api/notifications/actions/delete/${String(id)}`)
    notifications.value = notifications.value.filter((n) => String(n.id) !== String(id))
  } catch (err) {
    console.error('Ошибка удаления уведомления:', err)
    alert('Ошибка удаления уведомления')
  }
}

const handleClearAll = async () => {
  if (!confirm('Удалить все уведомления?')) {
    return
  }

  try {
    await api.get('/api/notifications/actions/clear-all')
    notifications.value = []
  } catch (err) {
    console.error('Ошибка очистки уведомлений:', err)
    alert('Ошибка очистки уведомлений')
  }
}

onMounted(() => {
  loadNotifications()
})
</script>
