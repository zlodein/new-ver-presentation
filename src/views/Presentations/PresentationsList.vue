<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle">
      <template #append>
        <span
          v-if="presentationsLimitText"
          class="text-sm font-medium"
          :style="{ color: presentationsLimitColor }"
        >
          {{ presentationsLimitText }}
        </span>
      </template>
    </PageBreadcrumb>
    <div class="space-y-6">
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {{ error }}
      </div>
      <div
        v-if="isExpert && expertPresentationsUsed >= expertPlanQuantity"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
      >
        <p class="flex-1">
          Лимит презентаций исчерпан ({{ expertPresentationsUsed }} из {{ expertPlanQuantity }}). Для увеличения лимита выберите в разделе «Тарифы» дополнительное количество презентаций.
        </p>
        <router-link
          to="/dashboard/tariffs"
          class="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          Перейти к тарифам
        </router-link>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            :class="[
              'rounded-md px-4 py-2 text-sm font-medium transition',
              activeTab === 'published'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            ]"
            @click="switchTab('published')"
          >
            Опубликованные
            <span v-if="counts !== null" class="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300" :class="{ 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300': activeTab === 'published' }">{{ counts.published }}</span>
          </button>
          <button
            type="button"
            :class="[
              'rounded-md px-4 py-2 text-sm font-medium transition',
              activeTab === 'draft'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            ]"
            @click="switchTab('draft')"
          >
            Черновики
            <span v-if="counts !== null" class="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300" :class="{ 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300': activeTab === 'draft' }">{{ counts.draft }}</span>
          </button>
          <button
            type="button"
            :class="[
              'rounded-md px-4 py-2 text-sm font-medium transition',
              activeTab === 'deleted'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            ]"
            @click="switchTab('deleted')"
          >
            Удалённые
            <span v-if="counts !== null" class="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300" :class="{ 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300': activeTab === 'deleted' }">{{ counts.deleted }}</span>
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <p v-if="activeTab !== 'published'" class="text-sm text-gray-500 dark:text-gray-400">
            {{ loading ? 'Загрузка...' : activeTab === 'deleted' ? 'Удалённые можно восстановить в течение месяца' : 'Черновики можно редактировать и публиковать' }}
          </p>
          <template v-if="activeTab === 'published' || activeTab === 'draft'">
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                :disabled="!canCreatePresentation"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                :title="cannotCreateReason"
                @click="createAndOpenEditor()"
              >
                <PlusIcon />
                Создать презентацию
              </button>
            </div>
          </template>
        </div>
      </div>

      <div
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="presentation in presentations"
          :key="presentation.id"
          class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-brand-800"
        >
          <template v-if="activeTab === 'deleted'">
            <div class="flex flex-1 flex-col">
              <div
                class="relative aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="presentation.coverImage"
                  :src="presentation.coverImage"
                  :alt="presentation.title"
                  class="h-full w-full object-cover"
                />
                <span v-else class="text-4xl text-gray-400 dark:text-gray-500">
                  {{ presentation.title?.charAt(0) || 'П' }}
                </span>
                <span class="absolute left-2 top-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm">
                  Удалено
                </span>
              </div>
              <div class="flex flex-1 flex-col p-4">
                <h3 class="font-semibold text-gray-800 dark:text-white/90 line-clamp-1">
                  {{ presentation.title || 'Без названия' }}
                </h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Удалено {{ formatApiDate((presentation as PresentationWithDeleted).deletedAt) }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-green-50 hover:text-green-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-green-950 dark:hover:text-green-400"
              title="Восстановить презентацию"
              @click.stop="restorePresentation(presentation)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </template>
          <template v-else>
          <router-link
            :to="`/dashboard/presentations/${presentation.id}/edit`"
            class="flex flex-1 flex-col"
          >
            <div
              class="relative aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
              @touchstart.passive="onSliderTouchStart(presentation.id, $event)"
              @touchend.passive="onSliderTouchEnd(presentation.id, presentation, $event)"
            >
              <div
                class="flex h-full w-full transition-transform duration-300 ease-out"
                :style="sliderTrackStyle(presentation)"
              >
                <div
                  v-for="(slide, slideIdx) in getCardSlides(presentation)"
                  :key="`${presentation.id}-${slideIdx}`"
                  class="h-full min-w-full shrink-0"
                >
                  <div
                    class="editor-sidebar-thumb-frame relative h-full w-full overflow-hidden border-y border-gray-200/70 bg-gray-100 [contain:paint] dark:border-gray-700/80 dark:bg-gray-900/60"
                    :style="{ aspectRatio: `${BOOKLET_PAGE_W} / ${BOOKLET_PAGE_H}` }"
                  >
                    <div
                      class="pointer-events-none absolute left-0 top-0 origin-top-left will-change-transform"
                      :style="{
                        width: `${BOOKLET_PAGE_W}px`,
                        height: `${BOOKLET_PAGE_H}px`,
                        transform: `scale(${CARD_THUMB_SCALE})`,
                        transformOrigin: 'top left',
                      }"
                    >
                      <div
                        class="presentation-slider-wrap booklet-view editor-sidebar-thumb-booklet max-w-none shadow-none"
                        :style="cardPresentationStyle(presentation)"
                        :data-image-frame="getCardSettings(presentation).imageFrame"
                        :data-template="getCardSettings(presentation).template"
                      >
                        <div class="booklet-page relative h-full w-full overflow-hidden">
                          <div class="booklet-page__inner">
                            <div class="booklet-scale-root h-full w-full">
                              <component :is="cardSlideComponentForPresentation(presentation)" :slide="slide" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  v-if="getCardSlides(presentation).length === 0"
                  class="h-full min-w-full shrink-0"
                >
                  <img
                    v-if="presentation.coverImage"
                    :src="presentation.coverImage"
                    :alt="presentation.title"
                    class="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <span class="text-4xl text-gray-400 dark:text-gray-500">
                      {{ presentation.title?.charAt(0) || 'П' }}
                    </span>
                  </div>
                </div>
              </div>
              <span
                v-if="presentation.status"
                class="absolute left-2 top-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm"
                :class="presentation.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ presentation.status === 'published' ? 'Опубликовано' : 'Черновик' }}
              </span>
              <template v-if="getCardSlides(presentation).length > 1">
                <button
                  type="button"
                  class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow-sm transition hover:bg-white dark:bg-gray-800/90 dark:text-gray-300"
                  title="Предыдущий слайд"
                  @click.stop.prevent="prevCardSlide(presentation)"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow-sm transition hover:bg-white dark:bg-gray-800/90 dark:text-gray-300"
                  title="Следующий слайд"
                  @click.stop.prevent="nextCardSlide(presentation)"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div class="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 px-2 py-1">
                  <span
                    v-for="(_, dotIdx) in getCardSlides(presentation)"
                    :key="`${presentation.id}-dot-${dotIdx}`"
                    class="h-1.5 w-1.5 rounded-full"
                    :class="getCardSlideIndex(presentation.id) === dotIdx ? 'bg-white' : 'bg-white/50'"
                  />
                </div>
              </template>
            </div>
            <div class="flex flex-1 flex-col p-4">
              <h3 class="font-semibold text-gray-800 dark:text-white/90 line-clamp-1">
                {{ presentation.title || 'Без названия' }}
              </h3>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Обновлено {{ formatApiDate(presentation.updatedAt) }}
              </p>
            </div>
          </router-link>
          <div class="absolute right-2 top-2 flex gap-1">
            <button
              v-if="presentation.status === 'draft'"
              type="button"
              class="rounded-lg bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-950 dark:hover:text-blue-400"
              title="Копировать презентацию"
              @click.stop="copyPresentation(presentation)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button
              type="button"
              class="rounded-lg bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-green-50 hover:text-green-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-green-950 dark:hover:text-green-400"
              title="Предпросмотр"
              @click.stop="openPreview(presentation)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button
            type="button"
            class="rounded-lg bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            title="Удалить презентацию"
              @click.stop="confirmDelete(presentation)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          </template>
        </div>
      </div>

      <div
        v-if="presentations.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700"
      >
        <p class="text-gray-500 dark:text-gray-400">
          {{ activeTab === 'deleted' ? 'Удалённых презентаций пока нет' : activeTab === 'draft' ? 'Черновиков пока нет' : 'Опубликованных презентаций пока нет' }}
        </p>
        <button
          v-if="activeTab === 'published' || activeTab === 'draft'"
          type="button"
          :disabled="!canCreatePresentation"
          :title="cannotCreateReason"
          class="mt-4 inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="createAndOpenEditor()"
        >
          <PlusIcon />
          Создать первую презентацию
        </button>
      </div>
    </div>

  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { api, hasApi, getToken } from '@/api/client'
import type { PresentationListItem } from '@/api/client'
import { formatApiDate } from '@/composables/useApiDate'
import { useAuth } from '@/composables/useAuth'
import type { SlideItem } from '@/types/presentationSlide'
import {
  BOOKLET_TEMPLATE_BASIC,
  BOOKLET_TEMPLATE_URBAN_REAL_ESTATE,
  normalizeBookletTemplateId,
} from '@/data/bookletTemplates'
import {
  PRESENTATION_EDITOR_SLIDE_KEY,
  type PresentationEditorSlideInject,
  type DadataSuggestionItem,
} from './presentationEditorSlideKey'
import PresentationEditorSlideBlockBasic from './slide-blocks/PresentationEditorSlideBlockBasic.vue'
import PresentationEditorSlideBlockUrbanRealEstate from './slide-blocks/PresentationEditorSlideBlockUrbanRealEstate.vue'
import '@/assets/booklet-slides.css'
import '@/assets/booklet-template-basic.css'
import '@/assets/booklet-template-urban-real-estate.css'
const router = useRouter()
const { currentUser, fetchUser } = useAuth()
const userTariff = computed(() => (currentUser.value as { tariff?: string } | undefined)?.tariff)
const isTestDrive = computed(() => userTariff.value === 'test_drive')
const isExpert = computed(() => userTariff.value === 'expert')
/** На тест-драйве можно создать только одну презентацию за всё время (даже после удаления). */
const testDriveUsed = computed(() => (currentUser.value as { testDriveUsed?: boolean } | undefined)?.testDriveUsed === true)
const expertPlanQuantity = computed(() => Math.max(1, (currentUser.value as { expertPlanQuantity?: number } | undefined)?.expertPlanQuantity ?? 1))
const expertPresentationsUsed = computed(() => Math.max(0, (currentUser.value as { expertPresentationsUsed?: number } | undefined)?.expertPresentationsUsed ?? 0))
const canCreatePresentation = computed(() => {
  if (isTestDrive.value) {
    if (testDriveUsed.value) return false
    return presentations.value.length < 1
  }
  if (isExpert.value) {
    return expertPresentationsUsed.value < expertPlanQuantity.value
  }
  return true
})
/** Текст подсказки, почему нельзя создать презентацию */
const cannotCreateReason = computed(() => {
  if (isTestDrive.value && testDriveUsed.value) return 'Вы уже использовали тест драйв. Перейдите на тариф «Эксперт» для создания новых презентаций.'
  if (isTestDrive.value) return 'На тарифе «Тест драйв» доступна только одна презентация.'
  if (isExpert.value && expertPresentationsUsed.value >= expertPlanQuantity.value) return `Достигнут лимит презентаций (${expertPlanQuantity.value}). Удалённые тоже учитываются. Увеличьте пакет в разделе «Тарифы».`
  return ''
})

/** Склонение: 1 презентация, 2–4 презентации, 0/5–20 презентаций */
function pluralizePresentations(n: number): string {
  const abs = Math.abs(n) % 100
  const n10 = abs % 10
  if (abs >= 11 && abs <= 19) return 'презентаций'
  if (n10 === 1) return 'презентация'
  if (n10 >= 2 && n10 <= 4) return 'презентации'
  return 'презентаций'
}

/** Лимит: всего по тарифу (1 для тест-драйва, N для эксперта); null если лимит не показываем */
const presentationsLimitTotal = computed(() => {
  if (isTestDrive.value) return 1
  if (isExpert.value) return expertPlanQuantity.value
  return null
})
/** Сколько ещё презентаций можно создать */
const presentationsLimitRemaining = computed(() => {
  const total = presentationsLimitTotal.value
  if (total == null) return null
  if (isTestDrive.value) return testDriveUsed.value ? 0 : 1
  if (isExpert.value) return Math.max(0, expertPlanQuantity.value - expertPresentationsUsed.value)
  return null
})
/** Количество удалённых презентаций (учитываются в лимите) — только для тарифа Эксперт. Берём из API counts, чтобы число было одинаковым на всех вкладках. */
const presentationsDeletedCount = computed(() => {
  if (!isExpert.value) return 0
  if (counts.value != null) return counts.value.deleted
  return 0
})

/** Текст рядом с заголовком: «доступна 1 презентация», «доступно 3 из 5 презентаций (из них удалено 2)» и т.д. */
const presentationsLimitText = computed(() => {
  const total = presentationsLimitTotal.value
  const remaining = presentationsLimitRemaining.value
  if (total == null || remaining == null) return ''
  const word = pluralizePresentations(total)
  if (total === 1 && remaining === 1) return 'доступна 1 презентация'
  const wordForTotal = total === 1 ? 'презентации' : word // из 1 презентации, из 5 презентаций
  let base = ''
  if (total === 1 && remaining === 0) base = 'доступно 0 из 1 презентации'
  else if (remaining === 0) base = `доступно 0 из ${total} ${wordForTotal}`
  else base = `доступно ${remaining} из ${total} ${wordForTotal}`
  const deleted = presentationsDeletedCount.value
  if (deleted > 0) return `${base} (из них удалено ${deleted})`
  return base
})
/** Цвет счётчика: много — success, половина или меньше — warning, закончились — error */
const presentationsLimitColor = computed(() => {
  const total = presentationsLimitTotal.value
  const remaining = presentationsLimitRemaining.value
  if (total == null || remaining == null) return 'var(--color-gray-500)'
  if (remaining === 0) return 'var(--color-error-500)'
  if (remaining <= total / 2) return 'var(--color-warning-500)'
  return 'var(--color-success-500)'
})

const currentPageTitle = ref('Презентации')

const creating = ref(false)

function genSlideId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const SLIDE_TYPES = [
  { type: 'cover', label: 'Обложка' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'description', label: 'Описание' },
  { type: 'infrastructure', label: 'Инфраструктура' },
  { type: 'location', label: 'Местоположение' },
  { type: 'gallery', label: 'Галерея' },
  { type: 'layout', label: 'Планировка' },
  { type: 'contacts', label: 'Контакты' },
]

function getDefaultDataForType(type: string, title: string, subtitle: string): Record<string, unknown> {
  switch (type) {
    case 'cover':
      return {
        title: subtitle || 'ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ',
        subtitle: title || '',
        deal_type: 'Аренда',
        currency: 'RUB',
        price_value: 0,
        show_all_currencies: false,
      }
    case 'description':
      return { heading: 'Описание', text: '' }
    case 'infrastructure':
      return { heading: 'Инфраструктура', content: '', items: ['Пункт 1', 'Пункт 2', 'Пункт 3'] }
    case 'location':
      return {
        heading: 'Местоположение',
        address: '',
        lat: 55.755864,
        lng: 37.617698,
        show_metro: true,
        metro_stations: [],
      }
    case 'gallery':
      return { heading: 'Галерея', images: [] as string[] }
    case 'characteristics':
      return {
        heading: 'Характеристики',
        items: [
          { label: 'Площадь', value: '—' },
          { label: 'Этажность', value: '—' },
          { label: 'Год', value: '—' },
          { label: 'Материал', value: '—' },
        ],
      }
    case 'layout':
      return { heading: 'Планировка' }
    case 'contacts':
      return { heading: 'Контакты', phone: '', email: '', address: '' }
    default:
      return {}
  }
}

/** На тест драйве — только 4 слайда (обложка, описание, галерея, контакты). */
const DEFAULT_SLIDES_TEST_DRIVE = ['cover', 'description', 'gallery', 'contacts']

function buildDefaultSlides(title: string, subtitle: string) {
  const types = isTestDrive.value ? DEFAULT_SLIDES_TEST_DRIVE : SLIDE_TYPES.map((s) => s.type)
  return types.map((type: string) => ({
    id: genSlideId(),
    type,
    data: getDefaultDataForType(type, title, subtitle),
    hidden: false,
  }))
}

/** Создаёт презентацию с указанными названием и описанием (или значениями по умолчанию) и открывает редактор. */
async function createAndOpenEditor(title = 'Новая презентация', subtitle = '') {
  if (creating.value) return
  const finalTitle = String(title).trim() || 'Новая презентация'
  const slides = buildDefaultSlides(finalTitle, subtitle)
  const content = { slides }

  if (hasApi() && getToken()) {
    creating.value = true
    try {
      const created = await api.post<{ id: string }>('/api/presentations', {
        title: finalTitle,
        content,
      })
      await fetchUser()
      router.push(`/dashboard/presentations/${created.id}/edit`)
      return
    } catch {
      error.value = 'Не удалось создать презентацию'
    } finally {
      creating.value = false
    }
  }

  const id = `pres-${Date.now()}`
  const listRaw = localStorage.getItem('presentations-list')
  const list = listRaw ? JSON.parse(listRaw) : []
  list.push({
    id,
    title: finalTitle,
    updatedAt: new Date().toISOString(),
  })
  localStorage.setItem('presentations-list', JSON.stringify(list))
  localStorage.setItem(`presentation-${id}`, JSON.stringify({ slides }))
  router.push(`/dashboard/presentations/${id}/edit`)
}

type TabKind = 'published' | 'draft' | 'deleted'

interface Presentation {
  id: string
  title: string
  coverImage?: string
  previewContent?: { slides: unknown[]; settings?: Record<string, string> }
  updatedAt: string
  status?: string
  deletedAt?: string | null
}

interface PresentationWithDeleted extends Presentation {
  deletedAt: string
}

const activeTab = ref<TabKind>('published')
const presentations = ref<Presentation[]>([])
const sliderIndexByPresentationId = ref<Record<string, number>>({})
const touchStartXByPresentationId = ref<Record<string, number>>({})
const loading = ref(false)
const error = ref('')
const counts = ref<{ published: number; draft: number; deleted: number } | null>(null)
const BOOKLET_PAGE_W = 1123
const BOOKLET_PAGE_H = 794
const CARD_THUMB_SCALE = 0.24
const DEFAULT_CARD_SETTINGS = {
  template: BOOKLET_TEMPLATE_BASIC,
  fontFamily: 'system-ui',
  imageBorderRadius: '0',
  imageFrame: 'none',
  themeColor: '#fcfcfc',
}

const EMPTY_DADATA_SUGGESTIONS: DadataSuggestionItem[] = []

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? '').trim()).filter(Boolean)
}

function asCharacteristics(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const obj = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      label: String(obj.label ?? '').trim(),
      value: String(obj.value ?? '').trim(),
    }
  })
}

const previewSlideInject: PresentationEditorSlideInject = {
  canEditImages: false,
  generateTextLoading: null,
  dadataToken: '',
  dadataLoadingBySlideId: {},
  dadataSuggestionsBySlideId: {},
  activeDadataSlideId: null,
  dadataDropdownStyle: {},
  hasCompanyBlockFilled: false,
  showAdditionalTextInput: false,
  hasCompanyWebsite: false,
  CURRENCIES: [
    { code: 'RUB', symbol: 'RUB' },
    { code: 'USD', symbol: 'USD' },
    { code: 'EUR', symbol: 'EUR' },
  ],
  coverPriceValue: (slide) => String(slide.data?.price_value ?? ''),
  coverPricePlaceholder: (slide) => (String(slide.data?.deal_type ?? '') === 'Продажа' ? 'Цена продажи' : 'Цена аренды'),
  onCoverPriceInput: () => {},
  onCoverCurrencyChange: () => {},
  coverConvertedPrices: () => [],
  getBlockLayout: (slide) => String(slide.data?.blockLayout ?? 'text-left'),
  getImageGrid: (slide) => String(slide.data?.imageGrid ?? '1x1'),
  descriptionImages: (slide) => asStringArray(slide.data?.images),
  onDescriptionImageUpload: () => {},
  infrastructureImages: (slide) => asStringArray(slide.data?.images),
  onInfrastructureImageUpload: () => {},
  setLocationInputRef: () => {},
  onLocationAddressInput: () => {},
  onLocationAddressFocus: () => {},
  onLocationAddressBlur: () => {},
  applyDadataSuggestion: () => {},
  locationMetroLoading: () => false,
  findNearestMetro: () => {},
  galleryImages3: (slide) => asStringArray(slide.data?.images),
  onGalleryImageUpload: () => {},
  charItems: (slide) => asCharacteristics(slide.data?.items),
  removeCharacteristicItem: () => {},
  addCharacteristicItem: () => {},
  layoutImages: (slide) => asStringArray(slide.data?.images),
  onLayoutImageUpload: () => {},
  onSingleImageUpload: () => {},
  openPalettePopup: () => {},
  generateTextWithAI: () => {},
  contactsAvatarDisplayUrl: (slide) => String(slide.data?.avatar ?? slide.data?.avatarUrl ?? ''),
  onContactsAvatarUpload: () => {},
  contactsImageDisplayUrl: (slide) => String(slide.data?.photo ?? slide.data?.image ?? ''),
  onContactsImageUpload: () => {},
  onPhoneInput: () => {},
  customSlidePageStyle: () => ({}),
  customBlockTag: () => 'div',
  customBlockStyle: () => ({}),
}

previewSlideInject.dadataSuggestionsBySlideId = new Proxy(
  {},
  {
    get: () => EMPTY_DADATA_SUGGESTIONS,
  }
) as Record<string, DadataSuggestionItem[]>

provide(PRESENTATION_EDITOR_SLIDE_KEY, previewSlideInject)

function getCardSlides(presentation: Presentation): SlideItem[] {
  const rawSlides = presentation.previewContent?.slides
  if (!Array.isArray(rawSlides) || rawSlides.length === 0) return []
  return rawSlides
    .map((raw, index) => {
      const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
      const data = (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data))
        ? (obj.data as Record<string, unknown>)
        : {}
      return {
        id: typeof obj.id === 'string' && obj.id ? obj.id : `card-slide-${presentation.id}-${index}`,
        type: typeof obj.type === 'string' && obj.type ? obj.type : 'cover',
        data,
        hidden: Boolean(obj.hidden),
      } satisfies SlideItem
    })
    .filter((slide) => !slide.hidden)
}

function getCardSlideIndex(presentationId: string): number {
  const idx = sliderIndexByPresentationId.value[presentationId] ?? 0
  return idx >= 0 ? idx : 0
}

function setCardSlideIndex(presentationId: string, index: number, slideCount: number): void {
  if (slideCount < 2) {
    sliderIndexByPresentationId.value[presentationId] = 0
    return
  }
  const normalized = (index + slideCount) % slideCount
  sliderIndexByPresentationId.value[presentationId] = normalized
}

function nextCardSlide(presentation: Presentation): void {
  const slides = getCardSlides(presentation)
  if (slides.length < 2) return
  setCardSlideIndex(presentation.id, getCardSlideIndex(presentation.id) + 1, slides.length)
}

function prevCardSlide(presentation: Presentation): void {
  const slides = getCardSlides(presentation)
  if (slides.length < 2) return
  setCardSlideIndex(presentation.id, getCardSlideIndex(presentation.id) - 1, slides.length)
}

function sliderTrackStyle(presentation: Presentation): Record<string, string> {
  const slides = getCardSlides(presentation)
  const slideCount = Math.max(slides.length, 1)
  const slideIndex = Math.min(getCardSlideIndex(presentation.id), slideCount - 1)
  return {
    transform: `translateX(-${slideIndex * 100}%)`,
  }
}

function onSliderTouchStart(presentationId: string, event: TouchEvent): void {
  touchStartXByPresentationId.value[presentationId] = event.changedTouches[0]?.clientX ?? 0
}

function onSliderTouchEnd(presentationId: string, presentation: Presentation, event: TouchEvent): void {
  const startX = touchStartXByPresentationId.value[presentationId]
  const endX = event.changedTouches[0]?.clientX ?? startX
  const delta = endX - startX
  if (Math.abs(delta) < 30) return
  if (delta < 0) nextCardSlide(presentation)
  else prevCardSlide(presentation)
}

function getCardSettings(presentation: Presentation): Record<string, string> {
  const settings = presentation.previewContent?.settings ?? {}
  const template = normalizeBookletTemplateId(typeof settings.template === 'string' ? settings.template : undefined)
  return {
    ...DEFAULT_CARD_SETTINGS,
    ...settings,
    template,
  }
}

function cardSlideComponentForPresentation(presentation: Presentation) {
  const settings = getCardSettings(presentation)
  return settings.template === BOOKLET_TEMPLATE_URBAN_REAL_ESTATE
    ? PresentationEditorSlideBlockUrbanRealEstate
    : PresentationEditorSlideBlockBasic
}

function cardPresentationStyle(presentation: Presentation): Record<string, string> {
  const settings = getCardSettings(presentation)
  const tc = settings.themeColor || DEFAULT_CARD_SETTINGS.themeColor
  return {
    fontFamily: settings.fontFamily || DEFAULT_CARD_SETTINGS.fontFamily,
    '--booklet-image-radius': settings.imageBorderRadius || DEFAULT_CARD_SETTINGS.imageBorderRadius,
    '--theme-color': tc,
    '--theme-main-color': tc,
  }
}

/** Оставляем только id презентации: при формате "1:1" (id:user_id) берём часть до двоеточия. */
function normalizePresentationId(id: string | number | undefined): string {
  if (id == null) return ''
  const s = String(id).trim()
  const part = s.includes(':') ? s.split(':')[0].trim() : s
  return part
}

const initialTabChosen = ref(false)

async function loadCounts() {
  if (!hasApi() || !getToken()) return
  try {
    const data = await api.get<{ published: number; draft: number; deleted: number }>('/api/presentations/counts')
    if (isMounted) {
      counts.value = data
      if (!initialTabChosen.value) {
        initialTabChosen.value = true
        if (data.published === 0 && data.draft > 0 && activeTab.value === 'published') {
          activeTab.value = 'draft'
          loadPresentations()
        }
      }
    }
  } catch {
    if (isMounted) counts.value = null
  }
}

let isMounted = false
onMounted(() => {
  isMounted = true
  loadPresentations()
  loadCounts()
})
onUnmounted(() => {
  isMounted = false
})

function switchTab(tab: TabKind) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  loadPresentations()
}

async function loadFromApi() {
  loading.value = true
  error.value = ''
  const filter = activeTab.value === 'deleted' ? 'deleted' : activeTab.value === 'draft' ? 'draft' : 'published'
  try {
    const list = await api.get<PresentationListItem[]>(`/api/presentations?filter=${filter}`)
    if (isMounted) {
      presentations.value = list.map((p) => ({
        ...p,
        id: normalizePresentationId(p.id) || String(p.id ?? ''),
      }))
    }
  } catch (e) {
    if (isMounted) {
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить список'
      presentations.value = []
    }
  } finally {
    if (isMounted) {
      loading.value = false
      loadCounts()
    }
  }
}

function loadFromLocalStorage() {
  if (activeTab.value === 'deleted') {
    presentations.value = []
    return
  }
  try {
    const raw = localStorage.getItem('presentations-list')
    if (raw) {
      const list: Presentation[] = JSON.parse(raw)
      const normalized = list.map((p) => ({ ...p, id: normalizePresentationId(p.id) || String(p.id ?? '') }))
      presentations.value = normalized.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } else {
      presentations.value = []
    }
  } catch {
    presentations.value = []
  }
}

function loadPresentations() {
  if (!isMounted) return
  if (hasApi() && getToken()) {
    loadFromApi()
  } else {
    loadFromLocalStorage()
  }
}

function openPreview(presentation: Presentation) {
  router.push(`/dashboard/presentations/${presentation.id}/view`)
}

async function copyPresentation(presentation: Presentation) {
  const id = presentation?.id != null ? String(presentation.id) : ''
  if (!id) {
    error.value = 'Не удалось определить id презентации'
    return
  }
  try {
    const res = await api.post<{ id: string }>(`/api/presentations/${id}/duplicate`)
    error.value = ''
    await fetchUser()
    await loadPresentations()
    if (res?.id) router.push(`/dashboard/presentations/${res.id}/edit`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось скопировать презентацию'
    loadPresentations()
  }
}

async function restorePresentation(presentation: Presentation) {
  const id = presentation?.id != null ? String(presentation.id) : ''
  if (!id) {
    error.value = 'Не удалось определить id презентации'
    return
  }
  try {
    await api.post('/api/presentations/restore', { id })
    error.value = ''
    await fetchUser()
    activeTab.value = 'published'
    await loadPresentations()
    await loadCounts()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось восстановить презентацию'
    loadPresentations()
    loadCounts()
  }
}

async function confirmDelete(presentation: Presentation) {
  if (!window.confirm(`Удалить презентацию «${presentation.title || 'Без названия'}»? Её можно будет восстановить в течение месяца.`)) {
    return
  }
  if (hasApi() && getToken()) {
    const id = presentation?.id != null ? String(presentation.id) : ''
    if (!id) {
      error.value = 'Не удалось определить id презентации'
      return
    }
    try {
      await api.post('/api/presentations/delete', { id })
      presentations.value = presentations.value.filter((p) => p.id !== presentation.id)
      error.value = ''
      loadCounts()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось удалить презентацию. Если в консоли есть «Tracking Prevention» — разрешите доступ к сайту в настройках браузера или войдите снова.'
      loadPresentations()
      loadCounts()
    }
  } else {
    try {
      localStorage.removeItem(`presentation-${presentation.id}`)
      const raw = localStorage.getItem('presentations-list')
      if (raw) {
        const list: Presentation[] = JSON.parse(raw)
        const next = list.filter((p) => p.id !== presentation.id)
        localStorage.setItem('presentations-list', JSON.stringify(next))
        presentations.value = next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      }
    } catch {
      loadPresentations()
    }
  }
}

</script>
