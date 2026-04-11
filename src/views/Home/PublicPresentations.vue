<template>
  <PublicLayout>
    <div class="space-y-8">
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="border-b border-gray-100 bg-gradient-to-r from-brand-500/10 via-transparent to-transparent px-5 py-3 dark:border-white/10 dark:from-brand-500/15">
          <p class="text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-400">
            {{ page.kicker }}
          </p>
        </div>
        <div class="px-5 py-10 sm:px-8 sm:py-12">
          <h1
            class="mb-4 max-w-3xl text-left text-2xl font-semibold leading-tight text-gray-800 dark:text-white sm:text-3xl lg:text-4xl"
            v-html="heroTitleHtml"
          />
          <p class="mb-8 max-w-2xl text-left text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {{ page.heroSubtitle }}
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link
              v-if="page.primaryCta?.label && page.primaryCta?.to"
              :to="page.primaryCta.to"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              {{ page.primaryCta.label }}
            </router-link>
            <router-link
              v-if="page.secondaryCta?.label && page.secondaryCta?.to"
              :to="page.secondaryCta.to"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800"
            >
              {{ page.secondaryCta.label }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-medium transition"
          :class="
            activeCategory === cat.id
              ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-500'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600'
          "
          @click="activeCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in filteredTemplates"
          :key="item.id"
          class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-900/50"
        >
          <div
            class="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
          >
            <div class="absolute inset-0 flex items-center justify-center opacity-40">
              <span class="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">Preview</span>
            </div>
            <span
              class="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm dark:bg-gray-900/90 dark:text-gray-200"
            >
              {{ categoryLabel(item.category) }}
            </span>
          </div>
          <div class="flex flex-1 flex-col p-5">
            <h2 class="mb-2 text-left text-base font-semibold text-gray-800 dark:text-white">
              {{ item.title }}
            </h2>
            <p class="mb-4 flex-1 text-left text-sm text-gray-500 dark:text-gray-400">
              {{ item.blurb }}
            </p>
            <div class="flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]"
                :disabled="!item.pdfUrl?.trim()"
                @click="openModal('pdf', item)"
              >
                Посмотреть в PDF
              </button>
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-950/60"
                :disabled="!item.publicViewUrl?.trim()"
                @click="openModal('public', item)"
              >
                Публичная ссылка
              </button>
            </div>
          </div>
        </article>
      </div>

      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Условия использования сервиса и тарифы описаны в разделах
        <router-link to="/tariffs" class="text-brand-600 hover:underline dark:text-brand-400">«Тарифы»</router-link>
        и
        <router-link to="/terms" class="text-brand-600 hover:underline dark:text-brand-400">«Правила»</router-link>.
      </p>

      <div
        class="rounded-2xl border border-gray-200 bg-white px-5 py-8 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8"
      >
        <h2 class="mb-2 text-left text-xl font-semibold text-gray-800 dark:text-white">
          Вопросы по редактору и публикации
        </h2>
        <p class="mb-8 text-left text-sm text-gray-500 dark:text-gray-400">
          Как устроена работа в редакторе e-presentation.ru: PDF, публичный просмотр и настройки отображения.
        </p>
        <div class="space-y-3">
          <details
            v-for="(faq, i) in page.faq"
            :key="i"
            class="group rounded-xl border border-gray-100 bg-gray-50/50 open:bg-white dark:border-white/10 dark:bg-white/[0.02] dark:open:bg-white/[0.04]"
          >
            <summary
              class="cursor-pointer list-none px-4 py-3 text-left text-sm font-medium text-gray-800 dark:text-gray-200 [&::-webkit-details-marker]:hidden"
            >
              <span class="flex items-center justify-between gap-2">
                {{ faq.q }}
                <span class="text-gray-400 transition group-open:rotate-180">▼</span>
              </span>
            </summary>
            <div class="border-t border-gray-100 px-4 pb-3 pt-2 text-sm leading-relaxed text-gray-600 dark:border-white/10 dark:text-gray-400">
              {{ faq.a }}
            </div>
          </details>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="modal"
        class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        @click.self="modal = null"
      >
        <div
          class="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
        >
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
            <p class="truncate pr-4 text-sm font-medium text-gray-800 dark:text-white">{{ modal.title }}</p>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10"
              @click="modal = null"
            >
              Закрыть
            </button>
          </div>
          <iframe :src="modal.url" class="min-h-[75vh] w-full flex-1 border-0 bg-white dark:bg-gray-950" :title="modal.title" />
        </div>
      </div>
    </Teleport>
  </PublicLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { api, hasApi } from '@/api/client'
import type { DemoCatalogItem, DemoCategory, PresentationsPageSettings } from '@/types/pageSettings'

type Cat = 'all' | DemoCategory

const categories: { id: Cat; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'city', label: 'Городская' },
  { id: 'country', label: 'Загородная' },
  { id: 'commercial', label: 'Коммерческая' },
]

const activeCategory = ref<Cat>('all')

const DEFAULT_PAGE: PresentationsPageSettings = {
  kicker: 'Каталог шаблонов',
  heroTitle:
    'Презентации для профессионального\nпредставления объектов недвижимости',
  heroSubtitle:
    'Подбор оформления под тип объекта: городская, загородная и коммерческая недвижимость. Ниже — примеры готовых материалов в PDF и публичном просмотре.',
  primaryCta: { label: 'Тарифы и доступ', to: '/tariffs' },
  secondaryCta: { label: 'Регистрация', to: '/signup' },
  catalog: [
    { id: '1', category: 'city', title: 'Серия «Город · базовая»', blurb: 'Универсальная структура для квартир и апартаментов в многоквартирном фонде.', pdfUrl: '', publicViewUrl: '' },
    { id: '2', category: 'city', title: 'Серия «Город · расширенная»', blurb: 'Дополнительные блоки под планировку, инфраструктуру и юридические параметры.', pdfUrl: '', publicViewUrl: '' },
    { id: '3', category: 'city', title: 'Серия «Город · премиум»', blurb: 'Акцент на визуальную подачу и сравнение вариантов внутри одного объекта.', pdfUrl: '', publicViewUrl: '' },
    { id: '4', category: 'country', title: 'Серия «Загород · дом»', blurb: 'Сценарий для коттеджей и таунхаусов: участок, коммуникации, этажность.', pdfUrl: '', publicViewUrl: '' },
    { id: '5', category: 'country', title: 'Серия «Загород · участок»', blurb: 'Фокус на земельном участке и разрешённом использовании.', pdfUrl: '', publicViewUrl: '' },
    { id: '6', category: 'commercial', title: 'Серия «Офис / торговля»', blurb: 'Помещения под офис, retail и смешанное использование.', pdfUrl: '', publicViewUrl: '' },
    { id: '7', category: 'commercial', title: 'Серия «Склад / производство»', blurb: 'Технические характеристики, логистика, допуски грузового транспорта.', pdfUrl: '', publicViewUrl: '' },
    { id: '8', category: 'city', title: 'Серия «Новостройка»', blurb: 'Совместимость с материалами застройщика и сроками сдачи.', pdfUrl: '', publicViewUrl: '' },
  ],
  faq: [
    {
      q: 'Как получить PDF из редактора?',
      a: 'В редакторе презентации сохраните изменения и нажмите «Экспорт в PDF». Файл формируется на сервере и скачивается в браузере. Кнопка доступна, если в настройках презентации включён экспорт в PDF или презентация опубликована — точные условия зависят от тарифа.',
    },
    {
      q: 'Что такое публичная ссылка?',
      a: 'В редакторе можно включить публичный доступ к просмотру: будет сгенерирована короткая ссылка на страницу просмотра в браузере без входа в личный кабинет. Ссылку можно скопировать и отправить клиенту.',
    },
    {
      q: 'Что настраивается в презентации?',
      a: 'Доступны слайды с наборами блоков (тексты, изображения, контакты и др.), порядок слайдов и загрузка фото. В настройках презентации задаются шрифты и параметры отображения — они применяются в редакторе, в публичном просмотре и при выгрузке в PDF.',
    },
    {
      q: 'Какие требования к фотоматериалам?',
      a: 'Рекомендуется использовать снимки с достаточным разрешением для экрана и печати (ориентир — не ниже 1920 px по длинной стороне), форматы JPG или PNG в пределах лимитов загрузки в интерфейсе редактора.',
    },
    {
      q: 'Как передать материал клиенту?',
      a: 'Можно отправить PDF по почте или в мессенджере либо дать публичную ссылку на онлайн-просмотр, если эта опция включена для вашей презентации и тарифа.',
    },
  ],
}

const page = ref<PresentationsPageSettings>({ ...DEFAULT_PAGE })

const modal = ref<{ mode: 'pdf' | 'public'; url: string; title: string } | null>(null)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const heroTitleHtml = computed(() => {
  const raw = page.value.heroTitle || DEFAULT_PAGE.heroTitle || ''
  return escapeHtml(raw).replace(/\n/g, '<br />')
})

const filteredTemplates = computed(() => {
  const list = page.value.catalog?.length ? page.value.catalog : DEFAULT_PAGE.catalog!
  if (activeCategory.value === 'all') return list
  return list.filter((t) => t.category === activeCategory.value)
})

function categoryLabel(c: DemoCategory) {
  const m = { city: 'Городская', country: 'Загородная', commercial: 'Коммерческая' }
  return m[c]
}

function resolvePreviewUrl(raw: string): string {
  const u = (raw || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  const path = u.startsWith('/') ? u : `/${u}`
  if (typeof window === 'undefined') return path
  try {
    return new URL(path, window.location.origin).href
  } catch {
    return path
  }
}

function openModal(mode: 'pdf' | 'public', item: DemoCatalogItem) {
  const raw = mode === 'pdf' ? item.pdfUrl : item.publicViewUrl
  const url = resolvePreviewUrl(raw || '')
  if (!url) return
  modal.value = { mode, url, title: item.title }
}

function mergeSettings(raw: PresentationsPageSettings | null | undefined) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const merged: PresentationsPageSettings = {
    kicker: typeof s.kicker === 'string' && s.kicker.trim() ? s.kicker : DEFAULT_PAGE.kicker,
    heroTitle: typeof s.heroTitle === 'string' && s.heroTitle.trim() ? s.heroTitle : DEFAULT_PAGE.heroTitle,
    heroSubtitle:
      typeof s.heroSubtitle === 'string' && s.heroSubtitle.trim() ? s.heroSubtitle : DEFAULT_PAGE.heroSubtitle,
    primaryCta:
      s.primaryCta?.label && s.primaryCta?.to
        ? { label: s.primaryCta.label, to: s.primaryCta.to }
        : DEFAULT_PAGE.primaryCta,
    secondaryCta:
      s.secondaryCta?.label && s.secondaryCta?.to
        ? { label: s.secondaryCta.label, to: s.secondaryCta.to }
        : DEFAULT_PAGE.secondaryCta,
    catalog: Array.isArray(s.catalog) && s.catalog.length > 0 ? (s.catalog as DemoCatalogItem[]) : DEFAULT_PAGE.catalog,
    faq: Array.isArray(s.faq) && s.faq.length > 0 ? (s.faq as { q: string; a: string }[]) : DEFAULT_PAGE.faq,
  }
  page.value = merged
}

onMounted(async () => {
  if (!hasApi()) return
  try {
    const res = await api.get<{ settings: PresentationsPageSettings }>('/api/site/pages/presentations')
    mergeSettings(res?.settings)
  } catch {
    mergeSettings(undefined)
  }
})
</script>
