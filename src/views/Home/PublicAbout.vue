<template>
  <PublicLayout>
    <div class="space-y-10 lg:space-y-14">
      <section
        class="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-500/10 via-white to-gray-50 px-6 py-12 dark:border-gray-800 dark:from-brand-500/15 dark:via-gray-900 dark:to-gray-950 sm:px-10 sm:py-16"
      >
        <p class="mb-1 text-sm font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
          E-Presentation
        </p>
        <p class="mb-4 text-sm">
          <a
            href="https://e-presentation.ru"
            class="text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
            rel="noopener noreferrer"
          >
            e-presentation.ru
          </a>
        </p>
        <h1 class="mb-4 max-w-3xl text-left text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Онлайн-сервис для профессионалов в недвижимости
        </h1>
        <p class="mb-8 max-w-2xl text-left text-base text-gray-600 dark:text-gray-400">
          За кулисами создания презентаций, которые помогают быстрее донести ценность объекта до клиента.
        </p>
        <div class="flex flex-wrap gap-3">
          <router-link
            to="/tariffs"
            class="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            Тарифы
          </router-link>
          <router-link
            to="/signup"
            class="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800"
          >
            Создать аккаунт
          </router-link>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white px-6 py-10 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8">
        <h2 class="mb-4 text-left text-xl font-semibold text-gray-900 dark:text-white">
          Миссия
        </h2>
        <p class="max-w-3xl text-left text-gray-600 dark:text-gray-400">
          Облегчаем продажу недвижимости через быстрые и понятные инструменты создания презентаций, сокращая время на
          подготовку и повышая шансы на успешную сделку.
        </p>
      </section>

      <section>
        <h2 class="mb-6 text-left text-xl font-semibold text-gray-900 dark:text-white">
          Ценности
        </h2>
        <p class="mb-8 max-w-3xl text-left text-sm text-gray-500 dark:text-gray-400">
          То, что движет нами вперёд.
        </p>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in values"
            :key="item.title"
            class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <h3 class="mb-2 text-left font-semibold text-gray-900 dark:text-white">
              {{ item.title }}
            </h3>
            <p class="text-left text-sm text-gray-600 dark:text-gray-400">
              {{ item.text }}
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white px-6 py-10 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8">
        <h2 class="mb-4 text-left text-xl font-semibold text-gray-900 dark:text-white">
          История создания проекта
        </h2>
        <p class="mb-6 max-w-3xl text-left text-gray-600 dark:text-gray-400">
          Сервис вырос из практической задачи: нужно было ускорить подготовку материалов по объектам и сделать их
          визуально сильными без команды дизайнеров. Так появился E-Presentation — с фокусом на рынок недвижимости и
          удобный редактор.
        </p>
        <details class="group rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40">
          <summary
            class="cursor-pointer list-none text-left text-sm font-medium text-brand-600 dark:text-brand-400 [&::-webkit-details-marker]:hidden"
          >
            Подробнее о пути проекта
          </summary>
          <div class="mt-4 space-y-3 text-left text-sm text-gray-600 dark:text-gray-400">
            <p>
              Мы совместно с дизайнерами и разработчиками собрали шаблоны под типовые сценарии: городская, загородная и
              коммерческая недвижимость. Затем упростили структуру, чтобы разобраться в интерфейсе можно было за пару
              минут.
            </p>
            <p>
              Регулярное тестирование и обратная связь пользователей помогают нам исправлять ошибки и улучшать сервис.
            </p>
          </div>
        </details>
      </section>

      <section>
        <h2 class="mb-6 text-left text-xl font-semibold text-gray-900 dark:text-white">
          Отзывы
        </h2>
        <div class="grid gap-5 md:grid-cols-2">
          <figure
            v-for="(q, i) in quotes"
            :key="i"
            class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <blockquote class="mb-4 text-left text-sm text-gray-600 dark:text-gray-400">
              «{{ q.text }}»
            </blockquote>
            <figcaption class="text-left">
              <span class="block text-sm font-medium text-gray-900 dark:text-white">{{ q.name }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ q.role }}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        class="flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-500/5 px-6 py-8 dark:border-brand-900/50 dark:bg-brand-500/10 sm:flex-row sm:items-center sm:px-8"
      >
        <div>
          <h2 class="mb-1 text-left text-lg font-semibold text-gray-900 dark:text-white">
            Попробовать сервис
          </h2>
          <p class="text-left text-sm text-gray-600 dark:text-gray-400">
            Выберите тариф или начните с бесплатного ознакомления.
          </p>
        </div>
        <router-link
          to="/tariffs"
          class="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Тарифы
        </router-link>
      </section>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'

const values = [
  {
    title: 'Простота',
    text: 'Сложные задачи — через понятный интерфейс: шаг за шагом, без лишней теории.',
  },
  {
    title: 'Эффективность',
    text: 'Меньше времени на вёрстку — больше на клиентов и сделки.',
  },
  {
    title: 'Качество',
    text: 'Аккуратная типографика и шаблоны, которые выглядят профессионально на любых экранах.',
  },
  {
    title: 'Доверие',
    text: 'Прозрачные правила использования сервиса и поддержка, если что-то пошло не так.',
  },
  {
    title: 'Партнёрство',
    text: 'Мы развиваем продукт вместе с пользователями и учитываем обратную связь.',
  },
]

const quotes = [
  {
    text: 'Очень удобно собрать презентацию за несколько минут: загрузил фото, заполнил поля — можно отправлять клиенту.',
    name: 'Елена П.',
    role: 'Эксперт по недвижимости',
  },
  {
    text: 'Шаблоны на любой вкус, поддержка отвечает быстро. Рекомендую коллегам из отдела продаж.',
    name: 'Алексей З.',
    role: 'Руководитель агентства',
  },
]
</script>
