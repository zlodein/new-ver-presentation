<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div class="custom-calendar">
        <FullCalendar ref="calendarRef" class="min-h-screen" :options="calendarOptions" />
      </div>

      <!-- Modal -->
      <Modal v-if="isOpen" @close="closeModal">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
          >
            <h5
              class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl"
            >
              {{ selectedEvent ? 'Редактировать событие' : 'Добавить событие' }}
            </h5>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Запланируйте следующее важное событие: добавьте или отредактируйте его
            </p>

            <div class="mt-8">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Название события
                </label>
                <input
                  v-model="eventTitle"
                  type="text"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Цвет события
                </label>
                <div class="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div v-for="(value, key) in calendarsEvents" :key="key" class="n-chk">
                    <div :class="`form-check form-check-${value} form-check-inline`">
                      <label
                        class="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        :for="`modal${key}`"
                      >
                        <span class="relative">
                          <input
                            type="radio"
                            :name="'event-level'"
                            :value="key"
                            :id="`modal${key}`"
                            v-model="eventLevel"
                            class="sr-only form-check-input"
                          />
                          <span
                            class="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700"
                          >
                            <span class="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                          </span>
                        </span>
                        {{ key }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Дата и время начала
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="eventStartDate"
                    type="date"
                    class="dark:bg-dark-900 h-11 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <input
                    v-model="eventStartTime"
                    type="time"
                    class="dark:bg-dark-900 h-11 w-32 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Дата и время окончания
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="eventEndDate"
                    type="date"
                    class="dark:bg-dark-900 h-11 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <input
                    v-model="eventEndTime"
                    type="time"
                    class="dark:bg-dark-900 h-11 w-32 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Заметки
                </label>
                <textarea
                  v-model="eventNotes"
                  rows="3"
                  placeholder="Дополнительные заметки к событию..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                @click="closeModal"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Закрыть
              </button>

              <button
                @click="handleAddOrUpdateEvent"
                :disabled="loading"
                class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto disabled:opacity-50"
              >
                {{ loading ? 'Сохранение...' : (selectedEvent ? 'Сохранить изменения' : 'Добавить событие') }}
              </button>
              <button
                v-if="selectedEvent"
                @click="handleDeleteEvent"
                class="flex w-full justify-center rounded-lg border border-error-500 bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 sm:w-auto"
              >
                Удалить событие
              </button>
            </div>
          </div>
        </template>
      </Modal>
      <!-- <Teleport to="body">
        <div v-if="isOpen" class="modal-backdrop" @click="closeModal"></div>
        <div v-if="isOpen" class="modal">
          <div >
            <h5
              class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl"
            >
              {{ selectedEvent ? 'Edit Event' : 'Add Event' }}
            </h5>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Plan your next big moment: schedule or edit an event to stay on track
            </p>

            <div class="mt-8">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  v-model="eventTitle"
                  type="text"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Цвет события
                </label>
                <div class="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div v-for="(value, key) in calendarsEvents" :key="key" class="n-chk">
                    <div :class="`form-check form-check-${value} form-check-inline`">
                      <label
                        class="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        :for="`modal${key}`"
                      >
                        <span class="relative">
                          <input
                            type="radio"
                            :name="'event-level'"
                            :value="key"
                            :id="`modal${key}`"
                            v-model="eventLevel"
                            class="sr-only form-check-input"
                          />
                          <span
                            class="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700"
                          >
                            <span class="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                          </span>
                        </span>
                        {{ key }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Дата начала
                </label>
                <input
                  v-model="eventStartDate"
                  type="date"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Дата окончания
                </label>
                <input
                  v-model="eventEndDate"
                  type="date"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                @click="closeModal"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                @click="handleAddOrUpdateEvent"
                class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {{ selectedEvent ? 'Update Changes' : 'Add Event' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport> -->
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const currentPageTitle = ref('Календарь')
import { ref, reactive, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from '@/components/profile/Modal.vue'
import { api } from '@/api/client'
import ruLocale from '@fullcalendar/core/locales/ru'

const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventStartDate = ref('')
const eventStartTime = ref('')
const eventEndDate = ref('')
const eventEndTime = ref('')
const eventLevel = ref('')
const eventNotes = ref('')
const events = ref([])
const loading = ref(false)

// Отображаемые названия цветов (как в Google Calendar)
const calendarsEvents = reactive({
  Красный: 'Danger',
  Зеленый: 'Success',
  Синий: 'Primary',
  Оранжевый: 'Warning',
})
// Обратный маппинг: значение API -> метка для выбора в форме
const colorValueToLabel = { Danger: 'Красный', Success: 'Зеленый', Primary: 'Синий', Warning: 'Оранжевый' }

const loadEvents = async () => {
  try {
    loading.value = true
    const data = await api.get('/api/calendar/events')
    events.value = data.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      extendedProps: {
        calendar: e.extendedProps?.calendar ?? 'Primary',
        notes: e.extendedProps?.notes ?? '',
      },
    }))
  } catch (err) {
    console.error('Ошибка загрузки событий:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvents()
})

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetModalFields()
}

const resetModalFields = () => {
  eventTitle.value = ''
  eventStartDate.value = ''
  eventStartTime.value = ''
  eventEndDate.value = ''
  eventEndTime.value = ''
  eventLevel.value = 'Синий'
  eventNotes.value = ''
  selectedEvent.value = null
}

const handleDateSelect = (selectInfo) => {
  resetModalFields()
  const startDate = new Date(selectInfo.startStr)
  const endDate = selectInfo.endStr ? new Date(selectInfo.endStr) : new Date(selectInfo.startStr)
  
  eventStartDate.value = startDate.toISOString().split('T')[0]
  eventStartTime.value = startDate.toTimeString().slice(0, 5)
  eventEndDate.value = endDate.toISOString().split('T')[0]
  eventEndTime.value = endDate.toTimeString().slice(0, 5)
  openModal()
}

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event
  selectedEvent.value = event
  eventTitle.value = event.title
  
  const startDate = event.start ? new Date(event.start) : new Date()
  eventStartDate.value = startDate.toISOString().split('T')[0]
  eventStartTime.value = startDate.toTimeString().slice(0, 5)
  
  const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 3600000)
  eventEndDate.value = endDate.toISOString().split('T')[0]
  eventEndTime.value = endDate.toTimeString().slice(0, 5)
  
  eventLevel.value = colorValueToLabel[event.extendedProps?.calendar] ?? 'Синий'
  eventNotes.value = event.extendedProps?.notes ?? ''
  openModal()
}

const handleAddOrUpdateEvent = async () => {
  if (!eventTitle.value || !eventStartDate.value) {
    alert('Пожалуйста, заполните название и дату начала')
    return
  }

  try {
    loading.value = true
    
    // Формируем дату начала с временем
    const startDateTime = eventStartTime.value 
      ? `${eventStartDate.value}T${eventStartTime.value}:00`
      : `${eventStartDate.value}T00:00:00`
    
    // Формируем дату окончания с временем
    const endDateTime = eventEndDate.value && eventEndTime.value
      ? `${eventEndDate.value}T${eventEndTime.value}:00`
      : eventEndDate.value
        ? `${eventEndDate.value}T23:59:59`
        : undefined

    const allDay = !eventStartTime.value && !eventEndTime.value
    const colorValue = calendarsEvents[eventLevel.value] ?? 'Primary'

    if (selectedEvent.value) {
      // Update existing event
      await api.put(`/api/calendar/events/${selectedEvent.value.id}`, {
        title: eventTitle.value,
        start: startDateTime,
        end: endDateTime,
        allDay,
        color: colorValue,
        notes: eventNotes.value || undefined,
      })
    } else {
      // Add new event
      await api.post('/api/calendar/events', {
        title: eventTitle.value,
        start: startDateTime,
        end: endDateTime,
        allDay,
        color: colorValue,
        notes: eventNotes.value || undefined,
      })
      
      // Уведомление создается на сервере при создании события
    }
    
    await loadEvents()
    closeModal()
  } catch (err) {
    console.error('Ошибка сохранения события:', err)
    alert(err?.payload?.error || 'Ошибка сохранения события')
  } finally {
    loading.value = false
  }
}

const handleDeleteEvent = async () => {
  if (!selectedEvent.value) return

  if (!confirm('Вы уверены, что хотите удалить это событие?')) {
    return
  }

  const eventId = String(selectedEvent.value.id)
  try {
    loading.value = true
    await api.get(`/api/calendar/events/actions/delete/${encodeURIComponent(eventId)}`)
    events.value = events.value.filter((e) => String(e.id) !== eventId)
    closeModal()
  } catch (err) {
    console.error('Ошибка удаления события:', err)
    alert(err?.payload?.error || 'Ошибка удаления события')
  } finally {
    loading.value = false
  }
}

const truncateTitle = (title, maxLen = 16) => {
  if (!title) return ''
  const t = String(title).trim()
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…'
}

const renderEventContent = (eventInfo) => {
  const cal = eventInfo.event.extendedProps?.calendar ?? 'Primary'
  const colorClass = `fc-bg-${String(cal).toLowerCase()}`
  const title = eventInfo.event.title || ''
  const shortTitle = truncateTitle(title)
  const fullTitle = title.length > 16 ? title : ''
  const titleAttr = fullTitle ? ` title="${String(fullTitle).replace(/"/g, '&quot;')}"` : ''
  const timeText = eventInfo.timeText || ''
  return {
    html: `
      <div class="event-fc-color fc-event-main fc-event-title-truncate flex ${colorClass} p-1 rounded-sm"${titleAttr}>
        <div class="fc-daygrid-event-dot"></div>
        <div class="fc-event-time">${timeText}</div>
        <div class="fc-event-title">${shortTitle}</div>
      </div>
    `,
  }
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: ruLocale,
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next addEventButton',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  buttonText: {
    today: 'Сегодня',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
  },
  events: events,
  selectable: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventContent: renderEventContent,
  dayMaxEvents: 4,
  dayMaxEventRows: true,
  moreLinkText: (num) => `+ ещё ${num}`,
  selectMirror: true,
  selectOverlap: true,
  eventOverlap: true,
  customButtons: {
    addEventButton: {
      text: 'Добавить событие +',
      click: openModal,
    },
  },
})
</script>
