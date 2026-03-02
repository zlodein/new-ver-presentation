<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
  >
    <div class="flex justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Активные сессии
        </h3>
        <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Работали с чужого компьютера? Вы можете выйти из системы на всех устройствах.
        </p>
      </div>
    </div>
    <div
      class="my-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-900 sm:px-6"
    >
      <div
        ref="mapRef"
        class="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
      />
    </div>
    <div class="space-y-4">
      <div
        v-for="session in sessionsWithLocation"
        :key="session.id"
        class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              {{ session.browser }}{{ session.os ? ` (${session.os})` : '' }}
            </p>
            <span class="block truncate text-gray-500 text-theme-xs dark:text-gray-400">
              {{ session.locationText }}
            </span>
          </div>
          <span
            v-if="session.isCurrent"
            class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
          >
            Текущее устройство
          </span>
        </div>
      </div>
      <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Загрузка...
      </div>
      <div v-else-if="sessions.length === 0 && !error" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Нет активных сессий
      </div>
      <div v-else-if="error" class="py-4 text-center text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>
      <div v-if="sessionsWithLocation.length > 1" class="pt-2">
        <button
          type="button"
          :disabled="logoutLoading"
          class="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/50"
          @click="logoutAll"
        >
          {{ logoutLoading ? 'Выход...' : 'Выйти со всех устройств кроме текущего' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import jsVectorMap from 'jsvectormap'
import 'jsvectormap/dist/maps/world'
import { api, hasApi } from '@/api/client'

interface SessionItem {
  id: string
  sessionId: string
  browser: string
  os: string
  country?: string
  city?: string
  lat?: number
  lng?: number
  ip?: string
  createdAt: string
  isCurrent?: boolean
}

const mapRef = ref<HTMLElement | null>(null)
const mapInstance = ref<ReturnType<typeof jsVectorMap> | null>(null)
const sessions = ref<SessionItem[]>([])
const loading = ref(true)
const error = ref('')
const logoutLoading = ref(false)

const markersFromSessions = computed(() => {
  return sessions.value
    .filter((s) => s.lat != null && s.lng != null)
    .map((s, i) => ({
      name: s.city || s.country || `Сессия ${i + 1}`,
      coords: [s.lat!, s.lng!],
    }))
})

function getLocationText(s: SessionItem): string {
  const parts: string[] = []
  if (s.city && s.country) parts.push(`${s.city}, ${s.country}`)
  else if (s.country) parts.push(s.country)
  else if (s.city) parts.push(s.city)
  if (s.ip && !parts.length) parts.push(`IP: ${s.ip}`)
  if (!parts.length) return 'Местоположение неизвестно'
  const date = new Date(s.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
  return `${parts.join(', ')} · ${date}`
}

const sessionsWithLocation = computed(() =>
  sessions.value.map((s) => ({
    ...s,
    locationText: getLocationText(s),
  }))
)

// Перезаписываем sessions для отображения с locationText
async function fetchSessions() {
  if (!hasApi()) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ sessions: SessionItem[] }>('/api/auth/sessions')
    sessions.value = res.sessions || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить сессии'
    sessions.value = []
  } finally {
    loading.value = false
  }
}

async function logoutAll() {
  if (!hasApi()) return
  logoutLoading.value = true
  try {
    await api.post('/api/auth/sessions/logout-all')
    await fetchSessions()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка при выходе'
  } finally {
    logoutLoading.value = false
  }
}

function initMap() {
  if (!mapRef.value) return
  mapInstance.value = new jsVectorMap({
    selector: mapRef.value,
    map: 'world',
    zoomButtons: false,
    regionStyle: {
      initial: {
        fontFamily: 'Outfit',
        fill: '#D9D9D9',
      },
      hover: {
        fillOpacity: 1,
        fill: '#465fff',
      },
    },
    markers:
      markersFromSessions.value.length > 0
        ? markersFromSessions.value.map((m) => ({ name: m.name, coords: m.coords }))
        : [{ name: 'World', coords: [55.7558, 37.6173] }],
    markerStyle: {
      initial: {
        strokeWidth: 1,
        fill: '#465fff',
        fillOpacity: 1,
        r: 5,
      },
      hover: {
        fill: '#465fff',
        fillOpacity: 1,
      },
      selected: {},
      selectedHover: {},
    },
  })
}

onMounted(async () => {
  await fetchSessions()
  initMap()
})
</script>
