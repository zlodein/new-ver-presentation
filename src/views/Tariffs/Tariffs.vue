<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="mx-auto w-full max-w-[480px]">
      <h2
        class="mb-2 text-center text-title-sm font-bold text-gray-800 dark:text-white/90"
      >
        Тарифы: максимум возможностей для каждого!
      </h2>
      <p v-if="currentTariffLabel" class="mb-7 text-center text-sm text-gray-500 dark:text-gray-400">
        Текущий тариф: <strong class="text-gray-700 dark:text-gray-300">{{ currentTariffLabel }}</strong>
        <span v-if="currentTariff === 'test_drive'" class="block mt-1">
          Сменить тариф на «Эксперт» можно ниже для снятия ограничений.
        </span>
      </p>
      <p v-else class="mb-7 text-center text-sm text-gray-500 dark:text-gray-400">
        Выберите тариф для начала работы
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6">
      <!-- Тест драйв -->
      <div
        class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <span class="mb-3 block text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          Тест драйв
        </span>
        <div class="mb-1 flex items-end">
          <h2 class="text-title-md font-bold text-gray-800 dark:text-white/90">
            Бесплатно
          </h2>
          <span class="mb-1 ml-1 inline-block text-sm text-gray-500 dark:text-gray-400">
            один раз
          </span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Ознакомление с возможностями сервиса: одна презентация, до 4 слайдов, без публичной ссылки.
        </p>
        <div class="my-6 h-px w-full bg-gray-200 dark:bg-gray-800" />
        <ul class="mb-8 space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <li class="flex items-center gap-3">
            <CheckIcon />
            1 презентация
          </li>
          <li class="flex items-center gap-3">
            <CheckIcon />
            До 4 слайдов суммарно
          </li>
          <li class="flex items-center gap-3">
            <CheckIcon />
            Без публичной ссылки
          </li>
          <li class="flex items-center gap-3 text-gray-400 dark:text-gray-500">
            <CrossIcon />
            Задачи и календарь недоступны
          </li>
        </ul>
        <button
          type="button"
          :disabled="!canChooseTestDrive"
          class="flex w-full items-center justify-center rounded-lg bg-gray-800 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:hover:bg-brand-600"
          @click="chooseTariff('test_drive')"
        >
          {{ canChooseTestDrive ? 'Выбрать тест драйв' : 'Доступен только один раз' }}
        </button>
      </div>

      <!-- Эксперт -->
      <div
        class="rounded-2xl border border-gray-800 bg-gray-800 p-6 dark:border-white/10 dark:bg-white/10"
      >
        <span class="mb-3 block text-theme-xl font-semibold text-white">
          Эксперт
        </span>
        <div class="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div class="flex items-end">
            <h2 class="text-title-md font-bold text-white">
              {{ expertPriceFormatted }}
            </h2>
            <span class="mb-1 ml-1 inline-block text-sm text-white/70">
              за {{ expertQuantityBounded }} {{ pluralize(expertQuantityBounded, 'презентацию', 'презентации', 'презентаций') }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <label class="sr-only">Количество презентаций</label>
            <input
              v-model.number="expertQuantity"
              type="number"
              min="1"
              max="100"
              class="h-11 w-20 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-medium text-white shadow-theme-xs placeholder:text-white/40 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
              placeholder="1–100"
              aria-label="Количество презентаций"
            />
          </div>
        </div>
        <p class="mt-2 text-sm text-white/70">
          {{ expertDiscountDescription }}
        </p>
        <div class="my-6 h-px w-full bg-white/20" />
        <ul class="mb-8 space-y-3 text-sm text-white/80">
          <li class="flex items-center gap-3">
            <CheckIcon class="text-success-500" />
            Неограниченное количество слайдов
          </li>
          <li class="flex items-center gap-3">
            <CheckIcon class="text-success-500" />
            Публичная ссылка на презентацию
          </li>
          <li class="flex items-center gap-3">
            <CheckIcon class="text-success-500" />
            Задачи и календарь
          </li>
        </ul>
        <button
          type="button"
          class="flex w-full items-center justify-center rounded-lg bg-brand-500 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600"
          @click="chooseTariff('expert')"
        >
          {{ currentTariff === 'test_drive' ? 'Сменить на Эксперт' : 'Выбрать Эксперт' }}
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/api/client'

const CheckIcon = { template: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0"><path d="M13.4017 4.35986L6.12166 11.6399L2.59833 8.11657" stroke="#12B76A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
const CrossIcon = { template: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }

const EXPERT_BASE_PRICE = 900

function discountPercent(quantity: number): number {
  if (quantity < 2) return 0
  if (quantity < 5) return 5
  if (quantity < 10) return 10
  if (quantity < 20) return 15
  if (quantity <= 100) return 20
  return 20
}

function expertTotal(quantity: number): number {
  const q = Math.max(1, Math.min(100, Math.floor(quantity) || 1))
  const discount = discountPercent(q) / 100
  return Math.round(q * EXPERT_BASE_PRICE * (1 - discount))
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const router = useRouter()
const { currentUser, fetchUser } = useAuth()
const currentPageTitle = ref('Тарифы')
const expertQuantity = ref(1)
const choosing = ref(false)

const canChooseTestDrive = computed(() => {
  const u = currentUser.value
  return !!u && !u.testDriveUsed
})

const currentTariff = computed(() => currentUser.value?.tariff ?? null)
const currentTariffLabel = computed(() => {
  const t = currentTariff.value
  if (t === 'test_drive') return 'Тест драйв'
  if (t === 'expert') return 'Эксперт'
  return ''
})

const expertQuantityBounded = computed(() =>
  Math.max(1, Math.min(100, Math.floor(expertQuantity.value) || 1))
)

const expertDiscountPercent = computed(() =>
  discountPercent(expertQuantityBounded.value)
)

const expertPriceFormatted = computed(() => {
  const total = expertTotal(expertQuantityBounded.value)
  return `${total.toLocaleString('ru-RU')} ₽`
})

const expertDiscountDescription = computed(() => {
  const q = expertQuantityBounded.value
  const pct = expertDiscountPercent.value
  if (pct === 0) {
    return '900 ₽ за презентацию. Динамическая система скидок в зависимости от количества, максимальная скидка 20%.'
  }
  const word = q === 1 ? 'презентации' : 'презентациях'
  return `Динамическая система скидок: при ${q} ${word} — скидка ${pct}%. Максимальный процент скидки 20%.`
})

async function chooseTariff(tariff: 'test_drive' | 'expert') {
  if (choosing.value) return
  if (tariff === 'test_drive' && !canChooseTestDrive.value) return
  choosing.value = true
  try {
    await api.patch('/api/auth/tariff', { tariff })
    await fetchUser()
    router.push('/dashboard')
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Ошибка выбора тарифа'
    alert(msg)
  } finally {
    choosing.value = false
  }
}

</script>
