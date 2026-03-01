<template>
  <div
    class="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      class="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6"
    >
      <div class="flex justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Ваш тариф — {{ tariffLabel }}</h3>
          <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {{ tariffSubtitle }}
          </p>
        </div>
        <div>
          <DropdownMenu :menu-items="menuItems">
            <template #icon>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                  fill="currentColor"
                />
              </svg>
            </template>
          </DropdownMenu>
        </div>
      </div>
      <div class="relative max-h-[195px]">
        <div id="chartTwo" class="h-full">
          <div class="radial-bar-chart">
            <VueApexCharts type="radialBar" height="330" :options="chartOptions" :series="series" />
          </div>
        </div>
      </div>
      <p class="mx-auto mt-1.5 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
        {{ tariffDescription }}
      </p>
    </div>

    <div class="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Осталось
        </p>
        <p class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
          {{ remaining }}
        </p>
      </div>

      <div class="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Использовано
        </p>
        <p class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
          {{ used }}
        </p>
      </div>

      <div class="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Всего
        </p>
        <p class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
          {{ total }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DropdownMenu from '../common/DropdownMenu.vue'
import VueApexCharts from 'vue3-apexcharts'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { currentUser, fetchUser } = useAuth()

const menuItems = [
  { label: 'Тарифы', onClick: () => router.push('/dashboard/tariffs') },
]

const total = computed(() => {
  const u = currentUser.value as { tariff?: string; expertPlanQuantity?: number } | null
  if (!u) return 0
  if (u.tariff === 'expert') return Math.max(1, u.expertPlanQuantity ?? 1)
  if (u.tariff === 'test_drive') return 1
  return 0
})

const used = computed(() => {
  const u = currentUser.value as { expertPresentationsUsed?: number } | null
  return Math.max(0, u?.expertPresentationsUsed ?? 0)
})

const remaining = computed(() => Math.max(0, total.value - used.value))

const tariffLabel = computed(() => {
  const t = currentUser.value?.tariff
  if (t === 'expert') return 'Эксперт'
  if (t === 'test_drive') return 'Тест драйв'
  return t || '—'
})

const tariffSubtitle = computed(() => {
  const t = currentUser.value?.tariff
  if (!t) return 'Лимит презентаций по вашему тарифу'
  return 'Лимит презентаций по вашему тарифу'
})

const tariffDescription = computed(() => {
  const t = total.value
  const r = remaining.value
  const u = used.value
  if (t === 0) return 'Выберите тариф в разделе «Тарифы», чтобы создавать презентации.'
  if (r === 0) return 'Лимит презентаций исчерпан. Увеличьте пакет в разделе «Тарифы».'
  return `Доступно ${r} из ${t} презентаций. Удалённые учитываются в лимите.`
})

const series = computed(() => {
  const tot = total.value
  if (tot <= 0) return [0]
  const pct = (remaining.value / tot) * 100
  return [Math.min(100, Math.max(0, pct))]
})

const chartOptions = {
  colors: ['#465FFF'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    sparkline: { enabled: true },
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: { size: '80%' },
      track: {
        background: '#E4E7EC',
        strokeWidth: '100%',
        margin: 5,
      },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '36px',
          fontWeight: '600',
          offsetY: 60,
          color: '#1D2939',
          formatter: function (val: number) {
            return val.toFixed(0) + '%'
          },
        },
      },
    },
  },
  fill: { type: 'solid', colors: ['#465FFF'] },
  stroke: { lineCap: 'round' },
  labels: ['Progress'],
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.radial-bar-chart {
  width: 100%;
  max-width: 330px;
  margin: 0 auto;
}
</style>
