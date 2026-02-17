<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="mx-auto w-full max-w-[420px]">
      <h2
        class="mb-7 text-center text-title-sm font-bold text-gray-800 dark:text-white/90"
      >
        Тарифы: максимум возможностей для каждого!
      </h2>
    </div>
    <div class="mb-10 text-center">
      <div
        class="relative z-1 mx-auto inline-flex rounded-full bg-gray-200 p-1 dark:bg-gray-800"
      >
        <span
          class="absolute top-1/2 -z-1 flex h-11 w-[140px] -translate-y-1/2 rounded-full bg-white shadow-theme-xs duration-200 ease-linear dark:bg-white/10"
          :class="byUnit ? 'translate-x-0' : 'translate-x-full'"
        />
        <button
          type="button"
          @click="byUnit = true"
          :class="[
            'flex h-11 w-[140px] items-center justify-center text-base font-medium',
            byUnit
              ? 'text-gray-800 dark:text-white/90'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/70',
          ]"
        >
          За презентацию
        </button>
        <button
          type="button"
          @click="byUnit = false"
          :class="[
            'flex h-11 w-[140px] items-center justify-center text-base font-medium',
            !byUnit
              ? 'text-gray-800 dark:text-white/90'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/80',
          ]"
        >
          Пакеты и подписка
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6"
      :class="byUnit ? 'xl:grid-cols-3' : 'xl:grid-cols-4'"
    >
      <div
        v-for="(plan, index) in currentPlans"
        :key="plan.id"
        :class="[
          'rounded-2xl border p-6',
          plan.highlight
            ? 'border-gray-800 bg-gray-800 dark:border-white/10 dark:bg-white/10'
            : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]',
        ]"
      >
        <span
          :class="[
            'mb-3 block text-theme-xl font-semibold',
            plan.highlight ? 'text-white' : 'text-gray-800 dark:text-white/90',
          ]"
        >
          {{ plan.name }}
        </span>

        <div class="mb-1 flex items-center justify-between">
          <div class="flex items-end">
            <h2
              :class="[
                'text-title-md font-bold',
                plan.highlight
                  ? 'text-white'
                  : 'text-gray-800 dark:text-white/90',
              ]"
            >
              {{ plan.price }}
            </h2>
            <span
              :class="[
                'mb-1 inline-block text-sm',
                plan.highlight
                  ? 'text-white/70'
                  : 'text-gray-500 dark:text-gray-400',
              ]"
            >
              {{ plan.period }}
            </span>
          </div>
          <span
            v-if="plan.oldPrice"
            :class="[
              'text-theme-xl font-semibold line-through',
              plan.highlight
                ? 'text-gray-300'
                : 'text-gray-400 dark:text-gray-500',
            ]"
          >
            {{ plan.oldPrice }}
          </span>
        </div>

        <p
          :class="[
            'text-sm',
            plan.highlight
              ? 'text-white/70'
              : 'text-gray-500 dark:text-gray-400',
          ]"
        >
          {{ plan.description }}
        </p>

        <div
          class="my-6 h-px w-full"
          :class="
            plan.highlight ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-800'
          "
        />

        <ul class="mb-8 space-y-3">
          <li
            v-for="(item, i) in plan.features"
            :key="i"
            :class="[
              'flex items-center gap-3 text-sm',
              plan.highlight
                ? 'text-white/80'
                : 'text-gray-500 dark:text-gray-400',
            ]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="shrink-0"
            >
              <path
                d="M13.4017 4.35986L6.12166 11.6399L2.59833 8.11657"
                stroke="#12B76A"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ item }}
          </li>
        </ul>

        <button
          type="button"
          :class="[
            'flex w-full items-center justify-center rounded-lg p-3.5 text-sm font-medium text-white shadow-theme-xs transition-colors',
            plan.highlight
              ? 'bg-brand-500 hover:bg-brand-600 dark:hover:bg-brand-600'
              : 'bg-gray-800 hover:bg-brand-500 dark:bg-white/10 dark:hover:bg-brand-600',
          ]"
        >
          {{ plan.cta }}
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const currentPageTitle = ref('Тарифы')
const byUnit = ref(true)

const plansByUnit = [
  {
    id: 'test-drive',
    name: 'Test Drive',
    price: '0 ₽',
    oldPrice: '150 ₽',
    period: '/ 1 презентация',
    description:
      'Бесплатно одна презентация в шаблоне #1 для каждой категории недвижимости.',
    features: [
      '1 презентация в шаблоне #1',
      'По одной в каждой категории',
      'Далее 150 ₽ за презентацию',
      'PDF-формат',
      '4 слайда',
    ],
    cta: 'Начать бесплатно',
    highlight: false,
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 'от 350 ₽',
    oldPrice: null,
    period: '/ презентация',
    description: 'Любой шаблон из каталога. Редактирование, PDF и ссылка.',
    features: [
      'Любой шаблон на выбор',
      'Неограниченно слайдов',
      'PDF и ссылка на презентацию',
      'Отключение лейбла платформы',
      'Все категории недвижимости',
    ],
    cta: 'Выбрать шаблон',
    highlight: true,
  },
  {
    id: 'exclusive',
    name: 'Exclusive',
    price: 'от 35 000 ₽',
    oldPrice: null,
    period: '/ шаблон',
    description: 'Эксклюзивный шаблон под ваш бренд. Минимум 5 000 ₽/мес.',
    features: [
      'Уникальный дизайн под заказ',
      'Все доступные шаблоны со скидкой 50%',
      'PDF и ссылка на презентацию',
      'Приоритетная поддержка',
      'Под вашу компанию',
    ],
    cta: 'Заказать шаблон',
    highlight: false,
  },
]

const plansPackages = [
  {
    id: 'mini-zen',
    name: 'mini Zen',
    price: '1 500 ₽',
    oldPrice: null,
    period: '/ 5 презентаций',
    description: 'Оптимально для профессионалов с 5–7 объектами в работе.',
    features: [
      '5 презентаций в пакете',
      'Любые шаблоны на выбор',
      'PDF и ссылка на презентацию',
      'Экономия при покупке пакета',
    ],
    cta: 'Оплатить пакет',
    highlight: false,
  },
  {
    id: 'zen',
    name: 'Zen',
    price: '2 500 ₽',
    oldPrice: null,
    period: '/ 10 презентаций',
    description: 'Для тех, кто активно работает с большим количеством объектов.',
    features: [
      '10 презентаций в пакете',
      'Любые шаблоны на выбор',
      'PDF и ссылка на презентацию',
      'Максимальная выгода',
    ],
    cta: 'Оплатить пакет',
    highlight: true,
  },
  {
    id: 'unlimited-pro',
    name: 'Unlimited Pro',
    price: '3 500 ₽',
    oldPrice: null,
    period: '/ месяц',
    description: 'Безлимитное создание презентаций с любым шаблоном.',
    features: [
      'Неограниченно презентаций',
      'Все шаблоны каталога',
      'PDF и ссылка на презентацию',
      'Без доплат в рамках подписки',
    ],
    cta: 'Подключить',
    highlight: false,
  },
  {
    id: 'realty-elite',
    name: 'Realty Elite',
    price: '15 000 ₽',
    oldPrice: null,
    period: '/ месяц',
    description: 'Премиум для лидеров: безлимит, приоритетная поддержка.',
    features: [
      'Безлимит презентаций и сайтов',
      'Эксклюзивные шаблоны и функции',
      'Персональный менеджер',
      'Приоритетная поддержка',
    ],
    cta: 'Подключить',
    highlight: false,
  },
]

const currentPlans = computed(() => (byUnit.value ? plansByUnit : plansPackages))
</script>
