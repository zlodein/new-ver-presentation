<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click="toggleDropdown"
    >
      <span
        :class="[
          { hidden: !notifying, flex: notifying },
          'absolute right-0 top-0.5 z-1 flex h-2 w-2 rounded-full',
          indicatorBadgeClass
        ]"
      >
        <span
          :class="['absolute inline-flex w-full h-full rounded-full opacity-75 -z-1 animate-ping', indicatorBadgeClass]"
        ></span>
      </span>
      <svg
        class="fill-current"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          fill=""
        />
      </svg>
    </button>

    <!-- Dropdown Start: высота по контенту, не более 5 уведомлений -->
    <div
      v-if="dropdownOpen"
      class="absolute -right-[240px] mt-[17px] flex w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 max-h-[min(85vh,420px)] min-h-0"
    >
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800"
      >
        <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Уведомления</h5>

        <div class="flex items-center gap-2">
          <button
            v-if="displayedNotifications.length > 0"
            @click="handleClearAll"
            class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-theme-xs"
            title="Очистить все уведомления (только в виджете)"
          >
            <span class="hidden sm:inline">Очистить все</span>
            <svg
              class="fill-current"
              width="20"
              height="20"
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
          </button>
          <button @click="closeDropdown" class="text-gray-500 dark:text-gray-400">
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>

      <ul class="flex flex-col min-h-0 flex-1 overflow-y-auto custom-scrollbar max-h-[320px]">
        <li v-if="notifications.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
          Нет уведомлений
        </li>
        <li v-for="notification in displayedNotifications" :key="notification.id" @click="handleItemClick(notification)">
          <a
            class="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 cursor-pointer"
            :class="{ 'bg-gray-50 dark:bg-white/5': !notification.read }"
            href="#"
          >
            <span
              v-if="notification.type !== 'calendar' && notification.type !== 'presentation'"
              class="relative block w-full h-10 rounded-full z-1 max-w-10 flex-shrink-0"
            >
              <div 
                :class="{
                  'bg-success-500': notification.type === 'success',
                  'bg-warning-500': notification.type === 'warning',
                  'bg-error-500': notification.type === 'error',
                  'bg-brand-500': notification.type === 'support',
                  'bg-primary-500': notification.type === 'info',
                }"
                class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              >
                {{ notification.title.charAt(0).toUpperCase() }}
              </div>
              <span
                v-if="!notification.read"
                :class="['absolute top-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900', notificationIndicatorClass(notification.type, notification)]"
              ></span>
            </span>

            <span class="block flex-1">
              <span class="mb-1.5 block text-theme-sm text-gray-800 dark:text-white/90 font-medium">
                {{ notification.title }}
              </span>
              <span v-if="notification.message" class="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">
                {{ notification.message }}
              </span>
            </span>
          </a>
        </li>
      </ul>

      <router-link
        to="/dashboard/notifications"
        class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        @click="closeDropdown"
      >
        Все уведомления
      </router-link>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '@/api/client'

const router = useRouter()
const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const notifications = ref([])
const loading = ref(false)

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.read).length
})

const notifying = computed(() => unreadCount.value > 0)

const PANEL_CLEARED_IDS_KEY = 'notification_panel_cleared_ids'

/** По тексту и типу: истекло → red, добавлено/успех → green, истекает/скоро → orange (бэкенд присылает type 'calendar'/'presentation', не success/error) */
function getNotificationLevel(notification) {
  const type = notification?.type ?? ''
  const title = (notification?.title ?? '').toLowerCase()
  const message = (notification?.message ?? '').toLowerCase()
  const text = title + ' ' + message
  if (type === 'error') return 'error'
  if (type === 'success') return 'success'
  if (type === 'warning') return 'warning'
  if (/истек|истекл|истекш/i.test(text)) return 'error'
  if (/добавлено|новое событие|опубликование|успешно/i.test(text)) return 'success'
  if (/истекает|скоро/i.test(text)) return 'warning'
  return 'warning'
}

function notificationIndicatorClass(type, notification) {
  const level = getNotificationLevel(notification ?? { type })
  if (level === 'error') return 'bg-error-500'
  if (level === 'success') return 'bg-success-500'
  return 'bg-orange-400'
}

/** Класс точки на колокольчике: при смешанных типах — синий; иначе по приоритету (error > warning > success) */
const indicatorBadgeClass = computed(() => {
  const unread = notifications.value.filter((n) => !n.read)
  const levels = unread.map((n) => getNotificationLevel(n))
  const unique = new Set(levels)
  if (unique.size > 1) return 'bg-primary-500'
  if (levels.some((l) => l === 'error')) return 'bg-error-500'
  if (levels.some((l) => l === 'warning')) return 'bg-orange-400'
  if (levels.some((l) => l === 'success')) return 'bg-success-500'
  return 'bg-orange-400'
})

const displayedNotifications = computed(() => notifications.value.slice(0, 5))

function getPanelClearedIds() {
  try {
    const raw = localStorage.getItem(PANEL_CLEARED_IDS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function setPanelClearedIds(ids) {
  try {
    const arr = ids.size ? Array.from(ids) : []
    if (arr.length) localStorage.setItem(PANEL_CLEARED_IDS_KEY, JSON.stringify(arr))
    else localStorage.removeItem(PANEL_CLEARED_IDS_KEY)
  } catch (_) {}
}

const loadNotifications = async () => {
  try {
    loading.value = true
    const data = await api.get('/api/notifications')
    const cleared = getPanelClearedIds()
    notifications.value = Array.isArray(data) ? data.filter((n) => !cleared.has(String(n.id))) : []
  } catch (err) {
    console.error('Ошибка загрузки уведомлений:', err)
  } finally {
    loading.value = false
  }
}

const toggleDropdown = async () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    await loadNotifications()
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleItemClick = async (notification) => {
  const id = notification?.id != null ? String(notification.id).trim() : ''
  if (!notification.read && id) {
    try {
      await api.put(`/api/notifications/${id}/read`)
      notification.read = true
    } catch (err) {
      console.error('Ошибка отметки уведомления:', err)
    }
  }
  closeDropdown()
  navigateFromNotification(notification)
}

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
  if (notification.type === 'support' && sourceId) {
    router.push({ path: `/dashboard/support/${sourceId}` })
    return
  }
}

/** Очистить панель: скрыть текущие уведомления из виджета до следующей загрузки; на странице /dashboard/notifications они остаются */
const handleClearAll = () => {
  const cleared = getPanelClearedIds()
  notifications.value.forEach((n) => cleared.add(String(n.id)))
  setPanelClearedIds(cleared)
  notifications.value = []
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') loadNotifications()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('visibilitychange', onVisibilityChange)
  loadNotifications()
  const interval = setInterval(loadNotifications, 30000)
  onUnmounted(() => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
