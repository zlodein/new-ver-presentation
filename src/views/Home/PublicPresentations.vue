<template>
  <PublicLayout>
    <div class="space-y-8">
      <!-- Герой в стиле главной: светлая карточка + акцент бренда -->
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="border-b border-gray-100 bg-gradient-to-r from-brand-500/10 via-transparent to-transparent px-5 py-3 dark:border-white/10 dark:from-brand-500/15">
          <p class="text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-400">
            Каталог шаблонов
          </p>
        </div>
        <div class="px-5 py-10 sm:px-8 sm:py-12">
          <h1 class="mb-4 max-w-3xl text-left text-2xl font-semibold leading-tight text-gray-800 dark:text-white sm:text-3xl lg:text-4xl">
            Презентации для профессионального<br class="hidden sm:inline" />
            представления объектов недвижимости
          </h1>
          <p class="mb-8 max-w-2xl text-left text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Подбор оформления под тип объекта: городская, загородная и коммерческая недвижимость. Шаблоны адаптированы
            под типовую структуру сделки и готовы к наполнению в редакторе сервиса.
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link
              to="/tariffs"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              Тарифы и доступ
            </router-link>
            <router-link
              to="/signup"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800"
            >
              Регистрация
            </router-link>
          </div>
        </div>
      </div>

      <!-- Фильтр категорий -->
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

      <!-- Сетка шаблонов -->
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
            <div class="flex items-end justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ item.price }}</span>
              <router-link
                to="/dashboard/presentations/new"
                class="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                В редактор →
              </router-link>
            </div>
          </div>
        </article>
      </div>

      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Полный перечень шаблонов и условия использования уточняются в тарифной сетке и в
        <router-link to="/terms" class="text-brand-600 hover:underline dark:text-brand-400">правилах сервиса</router-link>.
      </p>

      <!-- FAQ -->
      <div
        class="rounded-2xl border border-gray-200 bg-white px-5 py-8 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8"
      >
        <h2 class="mb-2 text-left text-xl font-semibold text-gray-800 dark:text-white">
          Вопросы по шаблонам и доступу
        </h2>
        <p class="mb-8 text-left text-sm text-gray-500 dark:text-gray-400">
          Краткие ответы по формату работы с каталогом. Подробности — в документации после входа в сервис.
        </p>
        <div class="space-y-3">
          <details
            v-for="(faq, i) in faqs"
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
  </PublicLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'

type Cat = 'all' | 'city' | 'country' | 'commercial'

const categories: { id: Cat; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'city', label: 'Городская' },
  { id: 'country', label: 'Загородная' },
  { id: 'commercial', label: 'Коммерческая' },
]

const activeCategory = ref<Cat>('all')

const templates = [
  { id: 1, category: 'city' as const, title: 'Серия «Город · базовая»', blurb: 'Универсальная структура для квартир и апартаментов в многоквартирном фонде.', price: 'от 0 ₽' },
  { id: 2, category: 'city' as const, title: 'Серия «Город · расширенная»', blurb: 'Дополнительные блоки под планировку, инфраструктуру и юридические параметры.', price: 'от 375 ₽' },
  { id: 3, category: 'city' as const, title: 'Серия «Город · премиум»', blurb: 'Акцент на визуальную подачу и сравнение вариантов внутри одного объекта.', price: 'от 400 ₽' },
  { id: 4, category: 'country' as const, title: 'Серия «Загород · дом»', blurb: 'Сценарий для коттеджей и таунхаусов: участок, коммуникации, этажность.', price: 'от 425 ₽' },
  { id: 5, category: 'country' as const, title: 'Серия «Загород · участок»', blurb: 'Фокус на земельном участке и разрешённом использовании.', price: 'от 450 ₽' },
  { id: 6, category: 'commercial' as const, title: 'Серия «Офис / торговля»', blurb: 'Помещения под офис, retail и смешанное использование.', price: 'от 475 ₽' },
  { id: 7, category: 'commercial' as const, title: 'Серия «Склад / производство»', blurb: 'Технические характеристики, логистика, допуски грузового транспорта.', price: 'от 500 ₽' },
  { id: 8, category: 'city' as const, title: 'Серия «Новостройка»', blurb: 'Совместимость с материалами застройщика и сроками сдачи.', price: 'от 525 ₽' },
]

const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') return templates
  return templates.filter((t) => t.category === activeCategory.value)
})

function categoryLabel(c: 'city' | 'country' | 'commercial') {
  const m = { city: 'Городская', country: 'Загородная', commercial: 'Коммерческая' }
  return m[c]
}

const faqs = [
  {
    q: 'В каком формате выдаётся готовая презентация?',
    a: 'Итоговый материал доступен для выгрузки в PDF. Набор опций (публичная ссылка, дополнительные форматы) зависит от подключённого тарифа — см. раздел «Тарифы».',
  },
  {
    q: 'Можно ли менять шаблон после выбора?',
    a: 'Да, в рамках редактора допускается корректировка текстов, изображений и порядка блоков. Ограничения по количеству объектов на одну покупку определяются пользовательским соглашением.',
  },
  {
    q: 'Какие требования предъявляются к фотоматериалам?',
    a: 'Рекомендуется использовать исходники с разрешением не ниже 1920 px по длинной стороне, форматы JPG или PNG, объём файла в пределах, указанных в интерфейсе загрузки.',
  },
  {
    q: 'Как передаётся презентация клиенту?',
    a: 'Допустимы отправка PDF по e-mail или мессенджерам, а также передача ссылки на онлайн-просмотр — при наличии соответствующей опции в тарифе.',
  },
  {
    q: 'Предусмотрена ли адаптация под фирменный стиль агентства?',
    a: 'В стандартных шаблонах доступны настройки оформления и размещение логотипа. Индивидуальная разработка макета обсуждается отдельно с поддержкой сервиса.',
  },
]
</script>
