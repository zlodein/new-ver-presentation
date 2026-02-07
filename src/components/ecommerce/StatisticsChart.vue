<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
      <div class="w-full">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Статистика</h3>
        <p v-if="selectedPresentationTitle" class="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ selectedPresentationTitle }}
        </p>
        <p v-else class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Статистика просмотров презентаций
        </p>
      </div>

      <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div class="relative">
          <select
            v-model="selectedPresentationId"
            @change="loadStatistics"
            class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:focus:border-brand-800 min-w-[200px]"
          >
            <option value="">Презентации</option>
            <option v-for="pres in publicPresentations" :key="pres.id" :value="pres.id">
              {{ pres.title }}
            </option>
          </select>
        </div>

        <div class="relative">
          <flat-pickr
            :model-value="date"
            :config="flatpickrConfig"
            @update:model-value="onDateUpdate"
            @on-close="onDateClose"
            class="pl-3 sm:pl-9 dark:bg-dark-900 h-10 w-10 sm:w-56 rounded-lg border border-gray-200 bg-white text-transparent sm:text-theme-sm sm:text-gray-800 shadow-theme-xs placeholder:text-transparent sm:placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-transparent sm:dark:text-gray-400 dark:placeholder:text-transparent sm:dark:placeholder:text-gray-400 dark:focus:border-brand-800"
            placeholder="Выберите дату"
          />
          <span
            class="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-1/2 -translate-x-1/2 sm:left-3 sm:translate-x-0 top-1/2 dark:text-gray-400"
          >
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
                d="M6.66659 1.5415C7.0808 1.5415 7.41658 1.87729 7.41658 2.2915V2.99984H12.5833V2.2915C12.5833 1.87729 12.919 1.5415 13.3333 1.5415C13.7475 1.5415 14.0833 1.87729 14.0833 2.2915V2.99984L15.4166 2.99984C16.5212 2.99984 17.4166 3.89527 17.4166 4.99984V7.49984V15.8332C17.4166 16.9377 16.5212 17.8332 15.4166 17.8332H4.58325C3.47868 17.8332 2.58325 16.9377 2.58325 15.8332V7.49984V4.99984C2.58325 3.89527 3.47868 2.99984 4.58325 2.99984L5.91659 2.99984V2.2915C5.91659 1.87729 6.25237 1.5415 6.66659 1.5415ZM6.66659 4.49984H4.58325C4.30711 4.49984 4.08325 4.7237 4.08325 4.99984V6.74984H15.9166V4.99984C15.9166 4.7237 15.6927 4.49984 15.4166 4.49984H13.3333H6.66659ZM15.9166 8.24984H4.08325V15.8332C4.08325 16.1093 4.30711 16.3332 4.58325 16.3332H15.4166C15.6927 16.3332 15.9166 16.1093 15.9166 15.8332V8.24984Z"
                fill=""
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
    <div v-if="loading" class="flex items-center justify-center h-[310px]">
      <span class="text-gray-500">Загрузка...</span>
    </div>
    <template v-else>
      <div v-if="selectedPresentationId && totalViews !== null && totalViews > 0" class="mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Всего просмотров: <span class="font-semibold text-gray-800 dark:text-white">{{ totalViews }}</span>
        </p>
      </div>
      <div v-if="selectedPresentationId && totalViews !== null && totalViews > 0" class="max-w-full overflow-x-auto custom-scrollbar">
        <div id="chartThree" class="-ml-4 min-w-[1000px] xl:min-w-full pl-2">
          <VueApexCharts type="area" height="310" :options="chartOptions" :series="series" />
        </div>
      </div>
      <div v-else-if="selectedPresentationId && totalViews === 0" class="flex items-center justify-center h-[310px]">
        <p class="text-center text-gray-500 dark:text-gray-400 max-w-md">
          Статистика начнет собираться, после того как вы поделитесь презентацией
        </p>
      </div>
      <div v-else-if="publicPresentations.length === 0" class="flex items-center justify-center h-[310px]">
        <p class="text-center text-gray-500 dark:text-gray-400 max-w-md">
          Статистика начнет собираться, после того как вы поделитесь презентацией
        </p>
      </div>
      <div v-else class="flex items-center justify-center h-[310px] text-gray-500 dark:text-gray-400">
        Выберите презентацию для просмотра статистики
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import flatPickr from 'vue-flatpickr-component'
import VueApexCharts from 'vue3-apexcharts'
import { api, hasApi, getToken } from '@/api/client'
import { Russian } from 'flatpickr/dist/l10n/ru.js'

const presentations = ref<Array<{ id: string; title: string; isPublic?: boolean; publicUrl?: string }>>([])
const selectedPresentationId = ref('')
const date = ref<Date[] | string | null>(null)
const loading = ref(false)
const totalViews = ref<number | null>(null)
const viewsByDate = ref<Record<string, number>>({})

const publicPresentations = computed(() => {
  return presentations.value.filter(p => p.isPublic && p.publicUrl)
})

const selectedPresentationTitle = computed(() => {
  if (!selectedPresentationId.value) return ''
  const presentation = presentations.value.find(p => p.id === selectedPresentationId.value)
  return presentation?.title || ''
})

const flatpickrConfig = computed(() => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return {
    mode: 'range' as const,
    dateFormat: 'd.m.Y',
    locale: Russian,
    defaultDate: [thirtyDaysAgo, now],
    defaultMonth: now.getMonth(),
    defaultYear: now.getFullYear(),
  }
})

const series = computed(() => {
  if (!selectedPresentationId.value || Object.keys(viewsByDate.value).length === 0) {
    return [{
      name: 'Просмотры',
      data: [],
    }]
  }
  
  // Сортируем даты
  const sortedDates = Object.keys(viewsByDate.value).sort()
  const data = sortedDates.map(date => viewsByDate.value[date])
  
  return [{
    name: 'Просмотры',
    data,
  }]
})

const chartOptions = computed(() => {
  const categories = Object.keys(viewsByDate.value).sort()
  const formattedCategories = categories.map(date => {
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  })
  
  return {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#465FFF'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    fill: {
      gradient: {
        enabled: true,
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: ['#465FFF'],
      fillColors: ['#FFFFFF'],
      hover: {
        size: 7,
      },
    },
    labels: {
      show: false,
      position: 'top',
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy',
      },
      y: {
        formatter: (val: number) => `${val} просмотров`,
      },
    },
    xaxis: {
      type: 'category',
      categories: formattedCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      title: {
        text: 'Просмотры',
        style: {
          fontSize: '12px',
        },
      },
    },
  }
})

async function loadPresentations() {
  if (!hasApi() || !getToken()) return
  try {
    const data = await api.get<Array<{ id: string; title: string; isPublic?: boolean; publicUrl?: string }>>('/api/presentations')
    presentations.value = data
    // Автоматически выбираем первую публичную презентацию, если есть
    const publicPres = data.find(p => p.isPublic && p.publicUrl)
    if (publicPres && !selectedPresentationId.value) {
      selectedPresentationId.value = publicPres.id
      loadStatistics()
    }
  } catch (err) {
    console.error('Ошибка загрузки презентаций:', err)
  }
}

let loadStatisticsTimeout: ReturnType<typeof setTimeout> | null = null

async function loadStatistics() {
  if (!selectedPresentationId.value || !hasApi() || !getToken()) {
    totalViews.value = null
    viewsByDate.value = {}
    return
  }
  
  // Отменяем предыдущий запрос, если он еще не выполнен
  if (loadStatisticsTimeout) {
    clearTimeout(loadStatisticsTimeout)
    loadStatisticsTimeout = null
  }
  
  loading.value = true
  try {
    let startDate: string | undefined = undefined
    let endDate: string | undefined = undefined
    
    if (date.value) {
      if (Array.isArray(date.value) && date.value.length === 2) {
        startDate = date.value[0] ? new Date(date.value[0]).toISOString().split('T')[0] : undefined
        endDate = date.value[1] ? new Date(date.value[1]).toISOString().split('T')[0] : undefined
      } else if (typeof date.value === 'string') {
        const parsedDate = new Date(date.value)
        if (!isNaN(parsedDate.getTime())) {
          startDate = parsedDate.toISOString().split('T')[0]
        }
      }
    }
    
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const data = await api.get<{
      totalViews: number
      viewsByDate: Record<string, number>
      views: Array<{ id: number; viewedAt: string; ipAddress?: string }>
    }>(`/api/presentations/${selectedPresentationId.value}/views?${params.toString()}`)
    
    totalViews.value = data.totalViews
    viewsByDate.value = data.viewsByDate
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err)
    totalViews.value = 0
    viewsByDate.value = {}
  } finally {
    loading.value = false
    loadStatisticsTimeout = null
  }
}

function onDateUpdate(value: Date[] | string | null) {
  // Просто обновляем значение без загрузки статистики
  // Статистика загрузится при закрытии календаря
  if (value === null || (Array.isArray(value) && value.length === 0)) {
    date.value = null
  } else if (Array.isArray(value)) {
    date.value = value as Date[]
  }
}

function onDateClose(selectedDates: Date[], dateStr: string, instance: any) {
  // При закрытии календаря проверяем, есть ли выбранный диапазон
  if (selectedDates && Array.isArray(selectedDates)) {
    if (selectedDates.length === 2) {
      date.value = selectedDates as Date[]
      // Загружаем статистику при закрытии, если диапазон выбран
      if (loadStatisticsTimeout) {
        clearTimeout(loadStatisticsTimeout)
      }
      loadStatisticsTimeout = setTimeout(() => {
        loadStatistics()
      }, 100)
    } else if (selectedDates.length === 0) {
      date.value = null
      // Загружаем статистику без фильтров, если диапазон сброшен
      if (loadStatisticsTimeout) {
        clearTimeout(loadStatisticsTimeout)
      }
      loadStatisticsTimeout = setTimeout(() => {
        loadStatistics()
      }, 100)
    }
  }
}

watch(selectedPresentationId, () => {
  loadStatistics()
})

onMounted(() => {
  loadPresentations()
})
</script>

<style scoped>
.area-chart {
  width: 100%;
}
</style>
