<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="mx-auto w-full max-w-[480px]">
      <h2
        class="mb-2 text-center text-title-sm font-bold text-gray-800 dark:text-white/90"
      >
        {{ cfg.pageTitle }}
      </h2>
      <p v-if="currentTariffLabel" class="mb-7 text-center text-sm text-gray-500 dark:text-gray-400">
        Текущий тариф: <strong class="text-gray-700 dark:text-gray-300">{{ currentTariffLabel }}</strong>
        <span v-if="currentTariff === 'test_drive'" class="mt-1 block">
          {{ replaceExpertPlaceholder(cfg.introLoggedInHasTariff) }}
        </span>
      </p>
      <p v-else class="mb-7 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ cfg.introLoggedInNoTariff }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <span class="mb-3 block text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {{ cfg.testDrive.title }}
        </span>
        <div class="mb-1 flex items-end">
          <h2 class="text-title-md font-bold text-gray-800 dark:text-white/90">
            {{ cfg.testDrive.priceMain }}
          </h2>
          <span class="mb-1 ml-1 inline-block text-sm text-gray-500 dark:text-gray-400">
            {{ cfg.testDrive.priceHint }}
          </span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ cfg.testDrive.description }}
        </p>
        <div class="my-6 h-px w-full bg-gray-200 dark:bg-gray-800" />
        <ul class="mb-8 space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <li v-for="(b, i) in cfg.testDrive.bullets" :key="'p-' + i" class="flex items-center gap-3">
            <CheckIcon />
            {{ b }}
          </li>
          <li
            v-for="(b, i) in cfg.testDrive.restrictions"
            :key="'n-' + i"
            class="flex items-center gap-3 text-gray-400 dark:text-gray-500"
          >
            <CrossIcon />
            {{ b }}
          </li>
        </ul>
        <button
          type="button"
          :disabled="!canChooseTestDrive"
          class="flex w-full items-center justify-center rounded-lg bg-gray-800 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:hover:bg-brand-600"
          @click="chooseTariff('test_drive')"
        >
          {{ canChooseTestDrive ? cfg.testDrive.ctaLoggedInAvailable : cfg.testDrive.ctaLoggedInUnavailable }}
        </button>
      </div>

      <div
        class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <span class="mb-3 block text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {{ cfg.expert.title }}
        </span>
        <div class="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div class="flex flex-wrap items-baseline gap-2">
            <h2 class="text-title-md font-bold text-gray-800 dark:text-white/90">
              {{ expertPriceFormatted }}
            </h2>
            <template v-if="expertDiscountPercentVal > 0">
              <span class="text-sm font-medium text-success-600 dark:text-success-400">−{{ expertDiscountPercentVal }}%</span>
              <span class="text-sm text-gray-500 line-through dark:text-gray-400">{{ expertOldPriceFormatted }}</span>
            </template>
            <span class="mb-1 inline-block text-sm text-gray-500 dark:text-gray-400">
              за {{ expertQuantityBounded }} {{ pluralize(expertQuantityBounded, 'презентацию', 'презентации', 'презентаций') }}
            </span>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <label class="sr-only">Количество презентаций</label>
            <input
              v-model.number="expertQuantity"
              type="number"
              min="1"
              max="100"
              class="h-11 w-20 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-center text-sm font-medium text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              placeholder="1–100"
              aria-label="Количество презентаций"
            />
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ expertDiscountDescription }}
        </p>
        <div class="my-6 h-px w-full bg-gray-200 dark:bg-gray-800" />
        <ul class="mb-8 space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <li v-for="(line, i) in expertFeatureLines" :key="i" class="flex items-center gap-3">
            <CheckIcon />
            {{ line }}
          </li>
        </ul>
        <button
          type="button"
          class="flex w-full items-center justify-center rounded-lg bg-gray-800 p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:hover:bg-brand-600"
          @click="chooseTariff('expert')"
        >
          {{ currentTariff === 'test_drive' ? cfg.expert.ctaLoggedInTestDrive : cfg.expert.ctaLoggedInOther }}
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'
import { useTariffPlansSettings } from '@/composables/useTariffPlansSettings'
import { api } from '@/api/client'

const CheckIcon = { template: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0"><path d="M13.4017 4.35986L6.12166 11.6399L2.59833 8.11657" stroke="#12B76A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
const CrossIcon = { template: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }

const router = useRouter()
const { currentUser, fetchUser } = useAuth()
const {
  cfg,
  load,
  expertDiscountPercent,
  expertTotal,
  pluralize,
  expertDiscountDescriptionText,
  expertFeatureLine,
  tariffShortLabel,
  replaceExpertPlaceholder,
} = useTariffPlansSettings()

const expertQuantity = ref(1)
const choosing = ref(false)

const currentPageTitle = computed(() => cfg.value.pageTitle)

onMounted(() => {
  load()
})

const canChooseTestDrive = computed(() => {
  const u = currentUser.value
  return !!u && !u.testDriveUsed
})

const currentTariff = computed(() => currentUser.value?.tariff ?? null)
const currentTariffLabel = computed(() => tariffShortLabel(currentTariff.value))

const expertQuantityBounded = computed(() =>
  Math.max(1, Math.min(100, Math.floor(expertQuantity.value) || 1))
)

const expertDiscountPercentVal = computed(() => expertDiscountPercent(expertQuantityBounded.value))

const expertPriceFormatted = computed(() => {
  const total = expertTotal(expertQuantityBounded.value)
  return `${total.toLocaleString('ru-RU')} ₽`
})

const expertOldPriceFormatted = computed(() => {
  const q = expertQuantityBounded.value
  const total = q * cfg.value.expert.basePrice
  return `${total.toLocaleString('ru-RU')} ₽`
})

const expertDiscountDescription = computed(() =>
  expertDiscountDescriptionText(expertQuantityBounded.value)
)

const expertFeatureLines = computed(() => {
  const q = expertQuantityBounded.value
  return cfg.value.expert.features.map((t) => expertFeatureLine(t, q))
})

async function chooseTariff(tariff: 'test_drive' | 'expert') {
  if (choosing.value) return
  if (tariff === 'test_drive' && !canChooseTestDrive.value) return
  choosing.value = true
  try {
    await api.patch('/api/auth/tariff', tariff === 'expert' ? { tariff, quantity: expertQuantityBounded.value } : { tariff })
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
