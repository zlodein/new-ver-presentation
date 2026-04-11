<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-6">
      <router-link
        to="/dashboard"
        class="inline-block text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        ← К панели управления
      </router-link>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        Эти тексты и цены показываются на публичной странице <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/tariffs</code> и в кабинете
        <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/dashboard/tariffs</code>. Плейсхолдеры: в подсказке про смену тарифа — <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{expert}</code>; в
        описаниях скидок — <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{basePrice}</code>, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{maxPct}</code>, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{q}</code>,
        <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{wordGenitive}</code>, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{pct}</code>; в списке возможностей Эксперта — <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">{q}</code>.
      </p>

      <ComponentCard title="Общий заголовок страницы">
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Заголовок (H2)</label>
            <input v-model="form.pageTitle" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Подсказка: выбор тарифа (нет текущего)</label>
            <textarea v-model="form.introLoggedInNoTariff" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Подсказка под «Тест драйв» (залогинен)</label>
            <textarea v-model="form.introLoggedInHasTariff" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Текст для гостей (до ссылок Войти / Регистрация)</label>
            <textarea v-model="form.introPublicLogin" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Тариф «Тест драйв»">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input v-model="form.testDrive.title" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Цена (крупно)</label>
            <input v-model="form.testDrive.priceMain" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Подпись к цене</label>
            <input v-model="form.testDrive.priceHint" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
            <textarea v-model="form.testDrive.description" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Плюсы (с галочкой), по одному на строку</label>
            <textarea v-model="testDriveBullets" rows="4" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ограничения (с крестиком), по одному на строку</label>
            <textarea v-model="testDriveRestrictions" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (гость)</label>
            <input v-model="form.testDrive.ctaLoggedOut" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (доступен тест)</label>
            <input v-model="form.testDrive.ctaLoggedInAvailable" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (тест уже использован)</label>
            <input v-model="form.testDrive.ctaLoggedInUnavailable" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Тариф «Эксперт»">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
            <input v-model="form.expert.title" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Базовая цена за презентацию (₽)</label>
            <input v-model.number="form.expert.basePrice" type="number" min="1" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Макс. скидка (%)</label>
            <input v-model.number="form.expert.maxDiscountPercent" type="number" min="0" max="100" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Текст при отсутствии скидки (одна презентация)</label>
            <textarea v-model="form.expert.discountDescriptionZero" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Текст при скидке &gt; 0</label>
            <textarea v-model="form.expert.discountDescriptionWithPct" rows="2" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Возможности (с галочкой), по одному на строку; можно <code class="text-xs">{q}</code></label>
            <textarea v-model="expertFeaturesText" rows="5" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (гость)</label>
            <input v-model="form.expert.ctaLoggedOut" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (смена с тест-драйва)</label>
            <input v-model="form.expert.ctaLoggedInTestDrive" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка (прочие случаи)</label>
            <input v-model="form.expert.ctaLoggedInOther" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
        </div>

        <div class="mt-6">
          <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Диапазоны скидки по количеству презентаций</p>
          <div v-for="(tier, ti) in form.expert.discountTiers" :key="ti" class="mb-2 flex flex-wrap items-end gap-2">
            <div>
              <span class="text-xs text-gray-500">от</span>
              <input v-model.number="tier.from" type="number" min="1" max="100" class="ml-1 w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <span class="text-xs text-gray-500">до</span>
              <input v-model.number="tier.to" type="number" min="1" max="100" class="ml-1 w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <span class="text-xs text-gray-500">%</span>
              <input v-model.number="tier.percent" type="number" min="0" max="100" class="ml-1 w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <button type="button" class="text-sm text-red-600 dark:text-red-400" @click="form.expert.discountTiers.splice(ti, 1)">Удалить</button>
          </div>
          <button
            type="button"
            class="mt-2 text-sm text-brand-600 dark:text-brand-400"
            @click="form.expert.discountTiers.push({ from: 1, to: 1, percent: 0 })"
          >
            + Диапазон
          </button>
        </div>
      </ComponentCard>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <span v-if="saved" class="text-sm text-green-600 dark:text-green-400">Сохранено</span>
        <span v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</span>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'
import { type TariffPageSettings, mergeTariffPageSettings } from '@/types/tariffSettings'

const currentPageTitle = 'Редактирование тарифов (контент страницы)'

const form = reactive<TariffPageSettings>(mergeTariffPageSettings(null))

const testDriveBullets = ref(form.testDrive.bullets.join('\n'))
const testDriveRestrictions = ref(form.testDrive.restrictions.join('\n'))
const expertFeaturesText = ref(form.expert.features.join('\n'))

const saving = ref(false)
const saved = ref(false)
const error = ref('')

function syncTextareasFromForm() {
  testDriveBullets.value = form.testDrive.bullets.join('\n')
  testDriveRestrictions.value = form.testDrive.restrictions.join('\n')
  expertFeaturesText.value = form.expert.features.join('\n')
}

function applyTextareasToForm() {
  form.testDrive.bullets = testDriveBullets.value.split('\n').map((s) => s.trim()).filter(Boolean)
  form.testDrive.restrictions = testDriveRestrictions.value.split('\n').map((s) => s.trim()).filter(Boolean)
  form.expert.features = expertFeaturesText.value.split('\n').map((s) => s.trim()).filter(Boolean)
}

function applyMerged(merged: TariffPageSettings) {
  form.pageTitle = merged.pageTitle
  form.introChooseTariff = merged.introChooseTariff
  form.introLoggedInHasTariff = merged.introLoggedInHasTariff
  form.introLoggedInNoTariff = merged.introLoggedInNoTariff
  form.introPublicLogin = merged.introPublicLogin
  form.testDrive = { ...merged.testDrive, bullets: [...merged.testDrive.bullets], restrictions: [...merged.testDrive.restrictions] }
  form.expert = {
    ...merged.expert,
    discountTiers: merged.expert.discountTiers.map((t) => ({ ...t })),
    features: [...merged.expert.features],
  }
  syncTextareasFromForm()
}

async function load() {
  error.value = ''
  try {
    const res = await api.get<{ settings: Partial<TariffPageSettings> }>('/api/admin/tariff-settings')
    applyMerged(mergeTariffPageSettings(res?.settings))
  } catch {
    applyMerged(mergeTariffPageSettings(null))
  }
}

async function save() {
  applyTextareasToForm()
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    const payload = JSON.parse(JSON.stringify(form)) as TariffPageSettings
    await api.put('/api/admin/tariff-settings', payload)
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
