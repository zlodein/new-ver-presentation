<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
        Предстоящие события
      </h3>
      <router-link
        to="/dashboard/calendar"
        class="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
      >
        Подробнее
      </router-link>
    </div>

    <div v-if="loading" class="mt-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Загрузка...
    </div>

    <div
      v-else-if="!upcomingEvents.length"
      class="mt-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Нет предстоящих событий
    </div>

    <ul v-else class="mt-4 space-y-4">
      <li
        v-for="event in upcomingEvents"
        :key="event.id"
        class="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800"
      >
        <div
          class="flex shrink-0 flex-col rounded-lg bg-gray-100 px-2.5 py-1.5 text-center dark:bg-gray-800"
        >
          <span class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {{ event.dayName }}
          </span>
          <span class="text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ event.dayNum }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ event.month }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ event.time }}
          </p>
          <router-link
            :to="`/dashboard/calendar?eventId=${encodeURIComponent(event.id)}`"
            class="mt-0.5 block truncate text-sm text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
          >
            {{ event.title }}
          </router-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, hasApi } from '@/api/client'

const loading = ref(false)
const upcomingEvents = ref([])

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
]
const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function formatEvent(e) {
  const start = new Date(e.start)
  const dayName = DAYS_SHORT[start.getDay()]
  const dayNum = start.getDate()
  const month = MONTHS_SHORT[start.getMonth()]
  let time = ''
  if (!e.allDay) {
    const h = start.getHours()
    const m = start.getMinutes()
    time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  } else {
    time = 'Весь день'
  }
  return {
    id: e.id,
    title: e.title,
    dayName,
    dayNum,
    month,
    time,
  }
}

async function loadUpcoming() {
  if (!hasApi()) {
    upcomingEvents.value = []
    return
  }
  loading.value = true
  try {
    const data = await api.get('/api/calendar/events')
    const now = new Date()
    const withStart = data
      .map((e) => {
        const start = e.start ? new Date(e.start) : null
        return { ...e, start }
      })
      .filter((e) => e.start && e.start >= now)
    withStart.sort((a, b) => a.start - b.start)
    upcomingEvents.value = withStart.slice(0, 5).map((e) =>
      formatEvent({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        end: e.end,
        allDay: !!e.allDay,
      })
    )
  } catch (err) {
    console.error('Ошибка загрузки событий:', err)
    upcomingEvents.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadUpcoming)
</script>
