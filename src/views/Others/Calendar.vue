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
                <div class="relative flex-1">
                  <flat-pickr
                    v-model="eventStartDate"
                    :config="flatpickrDateConfig"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Выберите дату"
                  />
                  <span class="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66659 1.5415C7.0808 1.5415 7.41658 1.87729 7.41658 2.2915V2.99984H12.5833V2.2915C12.5833 1.87729 12.919 1.5415 13.3333 1.5415C13.7475 1.5415 14.0833 1.87729 14.0833 2.2915V2.99984L15.4166 2.99984C16.5212 2.99984 17.4166 3.89527 17.4166 4.99984V7.49984V15.8332C17.4166 16.9377 16.5212 17.8332 15.4166 17.8332H4.58325C3.47868 17.8332 2.58325 16.9377 2.58325 15.8332V7.49984V4.99984C2.58325 3.89527 3.47868 2.99984 4.58325 2.99984L5.91659 2.99984V2.2915C5.91659 1.87729 6.25237 1.5415 6.66659 1.5415ZM6.66659 4.49984H4.58325C4.30711 4.49984 4.08325 4.7237 4.08325 4.99984V6.74984H15.9166V4.99984C15.9166 4.7237 15.6927 4.49984 15.4166 4.49984H13.3333H6.66659ZM15.9166 8.24984H4.08325V15.8332C4.08325 16.1093 4.30711 16.3332 4.58325 16.3332H15.4166C15.6927 16.3332 15.9166 16.1093 15.9166 15.8332V8.24984Z" fill=""/>
                    </svg>
                  </span>
                </div>
                <p class="mt-2 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Время</p>
                <div class="flex gap-3">
                  <div class="relative z-20 bg-transparent flex-1">
                    <select
                      v-model.number="eventStartHour"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </div>
                  <div class="relative z-20 bg-transparent flex-1">
                    <select
                      v-model.number="eventStartMinute"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="m in minutesOptions" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Дата и время окончания
                </label>
                <div class="relative flex-1">
                  <flat-pickr
                    v-model="eventEndDate"
                    :config="flatpickrDateConfig"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Выберите дату"
                  />
                  <span class="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66659 1.5415C7.0808 1.5415 7.41658 1.87729 7.41658 2.2915V2.99984H12.5833V2.2915C12.5833 1.87729 12.919 1.5415 13.3333 1.5415C13.7475 1.5415 14.0833 1.87729 14.0833 2.2915V2.99984L15.4166 2.99984C16.5212 2.99984 17.4166 3.89527 17.4166 4.99984V7.49984V15.8332C17.4166 16.9377 16.5212 17.8332 15.4166 17.8332H4.58325C3.47868 17.8332 2.58325 16.9377 2.58325 15.8332V7.49984V4.99984C2.58325 3.89527 3.47868 2.99984 4.58325 2.99984L5.91659 2.99984V2.2915C5.91659 1.87729 6.25237 1.5415 6.66659 1.5415ZM6.66659 4.49984H4.58325C4.30711 4.49984 4.08325 4.7237 4.08325 4.99984V6.74984H15.9166V4.99984C15.9166 4.7237 15.6927 4.49984 15.4166 4.49984H13.3333H6.66659ZM15.9166 8.24984H4.08325V15.8332C4.08325 16.1093 4.30711 16.3332 4.58325 16.3332H15.4166C15.6927 16.3332 15.9166 16.1093 15.9166 15.8332V8.24984Z" fill=""/>
                    </svg>
                  </span>
                </div>
                <p class="mt-2 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Время</p>
                <div class="flex gap-3">
                  <div class="relative z-20 bg-transparent flex-1">
                    <select
                      v-model.number="eventEndHour"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </div>
                  <div class="relative z-20 bg-transparent flex-1">
                    <select
                      v-model.number="eventEndMinute"
                      class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="m in minutesOptions" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </div>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from '@/components/profile/Modal.vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { api } from '@/api/client'
import ruLocale from '@fullcalendar/core/locales/ru'

const flatpickrDateConfig = {
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'j F Y',
  wrap: true,
  locale: Russian,
}
const route = useRoute()
const router = useRouter()
const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventStartDate = ref('')
const eventStartHour = ref(9)
const eventStartMinute = ref(0)
const eventEndDate = ref('')
const eventEndHour = ref(10)
const eventEndMinute = ref(0)
const eventLevel = ref('')
const eventNotes = ref('')
const events = ref([])
const loading = ref(false)

const minutesOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
function timeFromHourMin(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

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
    events.value = data.map((e) => {
      const allDay = !!e.allDay
      const start = e.start
      let end = e.end
      if (!allDay && start) {
        const startDate = new Date(start)
        if (!end) {
          end = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString()
        } else {
          const endDate = new Date(end)
          if (endDate <= startDate) {
            end = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString()
          }
        }
      }
      return {
        id: e.id,
        title: e.title,
        start,
        end,
        allDay,
        extendedProps: {
          calendar: e.extendedProps?.calendar ?? 'Primary',
          notes: e.extendedProps?.notes ?? '',
        },
      }
    })
  } catch (err) {
    console.error('Ошибка загрузки событий:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadEvents()
  await nextTick()
  const eventId = route.query.eventId
  if (eventId && calendarRef.value?.getApi) {
    const fcEvent = calendarRef.value.getApi().getEventById(String(eventId))
    if (fcEvent) handleEventClick({ event: fcEvent })
  }
})

const openModal = () => {
  if (!selectedEvent.value) {
    const now = new Date()
    eventStartDate.value = now.toISOString().split('T')[0]
    eventStartHour.value = now.getHours()
    eventStartMinute.value = Math.min(55, Math.round(now.getMinutes() / 5) * 5)
    const end = new Date(now.getTime() + 3600000)
    eventEndDate.value = end.toISOString().split('T')[0]
    eventEndHour.value = end.getHours()
    eventEndMinute.value = Math.min(55, Math.round(end.getMinutes() / 5) * 5)
  }
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetModalFields()
}

const resetModalFields = () => {
  eventTitle.value = ''
  eventStartDate.value = ''
  eventStartHour.value = 9
  eventStartMinute.value = 0
  eventEndDate.value = ''
  eventEndHour.value = 10
  eventEndMinute.value = 0
  eventLevel.value = 'Синий'
  eventNotes.value = ''
  selectedEvent.value = null
}

const handleDateSelect = (_selectInfo) => {
  resetModalFields()
  const now = new Date()
  eventStartDate.value = now.toISOString().split('T')[0]
  eventStartHour.value = now.getHours()
  eventStartMinute.value = Math.min(55, Math.round(now.getMinutes() / 5) * 5)
  const end = new Date(now.getTime() + 3600000)
  eventEndDate.value = end.toISOString().split('T')[0]
  eventEndHour.value = end.getHours()
  eventEndMinute.value = Math.min(55, Math.round(end.getMinutes() / 5) * 5)
  openModal()
}

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event
  if (event.extendedProps?.type === 'task' && event.extendedProps?.taskId) {
    router.push('/dashboard/tasks')
    return
  }
  selectedEvent.value = event
  eventTitle.value = event.title

  const startDate = event.start ? new Date(event.start) : new Date()
  eventStartDate.value = startDate.toISOString().split('T')[0]
  eventStartHour.value = startDate.getHours()
  eventStartMinute.value = Math.min(55, Math.round(startDate.getMinutes() / 5) * 5)

  const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 3600000)
  eventEndDate.value = endDate.toISOString().split('T')[0]
  eventEndHour.value = endDate.getHours()
  eventEndMinute.value = Math.min(55, Math.round(endDate.getMinutes() / 5) * 5)

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
    
    const startTimeStr = timeFromHourMin(eventStartHour.value, eventStartMinute.value)
    const endTimeStr = timeFromHourMin(eventEndHour.value, eventEndMinute.value)
    const startDateTime = `${eventStartDate.value}T${startTimeStr}:00`
    const endDateTime = eventEndDate.value ? `${eventEndDate.value}T${endTimeStr}:00` : undefined
    const allDay = false
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
  slotDuration: '00:30:00',
  slotLabelInterval: '00:30:00',
  slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  eventMinHeight: 25,
  customButtons: {
    addEventButton: {
      text: 'Добавить событие +',
      click: openModal,
    },
  },
})
</script>
