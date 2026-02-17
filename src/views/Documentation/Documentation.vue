<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Боковая навигация (как на tailadmin.com/docs) -->
      <aside
        class="lg:sticky lg:top-24 lg:order-1 lg:w-64 lg:shrink-0 lg:self-start"
      >
        <nav
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              На этой странице
            </span>
          </div>
          <ul class="max-h-[calc(100vh-12rem)] overflow-y-auto py-2">
            <li v-for="section in docSections" :key="section.id">
              <a
                :href="`#${section.id}`"
                :class="[
                  'block border-l-2 px-4 py-2 text-sm transition',
                  activeSection === section.id
                    ? 'border-brand-500 text-brand-600 dark:border-brand-500 dark:text-brand-400'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-white/90',
                ]"
                @click.prevent="scrollTo(section.id)"
              >
                {{ section.title }}
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Основной контент -->
      <main class="min-w-0 flex-1 lg:order-2">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="border-b border-gray-200 px-6 py-6 dark:border-gray-800">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Текущая версия — {{ appVersion }}
            </p>
            <h1 class="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
              Введение
            </h1>
            <p class="mt-4 text-gray-600 dark:text-gray-300">
              В этом руководстве вы узнаете, как пользоваться платформой E-Presentation:
              создавать и редактировать презентации, управлять задачами, календарём и обращаться в поддержку.
            </p>
            <p class="mt-3 text-gray-600 dark:text-gray-300">
              <strong>E-Presentation</strong> — это современная платформа для создания и управления презентациями,
              построенная на Vue 3 и Tailwind CSS (шаблон TailAdmin). Она позволяет быстро создавать
              профессиональные презентации, планировать события в календаре и вести задачи.
            </p>
            <div class="mt-6">
              <a
                href="#panel"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                Начать с панели управления
                <ChevronRightIcon class="h-4 w-4" />
              </a>
            </div>
          </div>

          <div class="doc-content px-6 py-6">
            <section
              v-for="section in docSections"
              :id="section.id"
              class="scroll-mt-28 border-b border-gray-200 py-8 last:border-b-0 dark:border-gray-800"
            >
              <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">
                {{ section.title }}
              </h2>
              <div
                class="doc-body mt-4 space-y-3 text-gray-600 dark:text-gray-300"
                v-html="section.content"
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ChevronRightIcon from '@/icons/ChevronRightIcon.vue'

const currentPageTitle = ref('Документация')
const appVersion = '2.0.x'
const activeSection = ref('introduction')

const docSections = [
  {
    id: 'introduction',
    title: 'Введение',
    content: `
      <p>Платформа E-Presentation предоставляет единый интерфейс для работы с презентациями, календарём и задачами. После входа в систему вы попадаете на <strong>Панель управления</strong>.</p>
    `,
  },
  {
    id: 'panel',
    title: 'Панель управления',
    content: `
      <p>Главная страница дашборда с обзором метрик, целей и последних активностей. Здесь отображаются ключевые показатели и быстрый доступ к основным разделам.</p>
    `,
  },
  {
    id: 'presentations',
    title: 'Презентации',
    content: `
      <p><strong>Список презентаций</strong> — все ваши презентации в виде карточек. Можно создать новую презентацию или открыть существующую для редактирования.</p>
      <p><strong>Редактор</strong> — добавление слайдов, текста, изображений и настройка внешнего вида. Презентации можно сохранять как черновик или публиковать и делиться ссылкой для просмотра.</p>
      <p><strong>Просмотр</strong> — режим просмотра презентации (для себя или по публичной ссылке <code class="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">/view/:hash</code>).</p>
    `,
  },
  {
    id: 'calendar',
    title: 'Календарь',
    content: `
      <p>Раздел <strong>Календарь</strong> позволяет планировать события по дням, неделям и месяцам. События можно создавать, редактировать и удалять.</p>
    `,
  },
  {
    id: 'tasks',
    title: 'Задачи',
    content: `
      <p><strong>Задачи</strong> представлены в виде канбан-доски: колонки по статусам (например, «К выполнению», «В работе», «Готово»). Карточки можно перетаскивать между колонками.</p>
    `,
  },
  {
    id: 'profile',
    title: 'Профиль пользователя',
    content: `
      <p>В разделе <strong>Профиль</strong> можно изменить личные данные, аватар, контакты и настройки учётной записи.</p>
    `,
  },
  {
    id: 'support',
    title: 'Поддержка',
    content: `
      <p>Раздел <strong>Поддержка</strong> — создание и просмотр обращений в техподдержку. Каждое обращение имеет тему, сообщение и статус (в ожидании, в работе, решён). Ответы приходят в интерфейсе тикета.</p>
    `,
  },
  {
    id: 'admin',
    title: 'Админ-панель',
    content: `
      <p>Доступна только пользователям с ролью администратора. Включает:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li><strong>Пользователи</strong> — управление учётными записями</li>
        <li><strong>Запросы</strong> — просмотр и обработка запросов пользователей</li>
        <li><strong>Тарифы</strong> — настройка тарифных планов</li>
        <li><strong>Платежи</strong> — история платежей</li>
      </ul>
    `,
  },
]

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function updateActiveSection() {
  const offset = 140
  for (let i = docSections.length - 1; i >= 0; i--) {
    const el = document.getElementById(docSections[i].id)
    if (el && el.getBoundingClientRect().top <= offset) {
      activeSection.value = docSections[i].id
      return
    }
  }
  activeSection.value = docSections[0].id
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  updateActiveSection()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
})
</script>

<style scoped>
.doc-body :deep(p) {
  color: var(--tw-prose-body, #4b5563);
}
.dark .doc-body :deep(p) {
  color: #d1d5db;
}
.doc-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}
.doc-body :deep(ul li) {
  margin-bottom: 0.25rem;
}
.doc-body :deep(code) {
  border-radius: 0.25rem;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
}
.dark .doc-body :deep(code) {
  background: #1f2937;
  color: #e5e7eb;
}
.doc-body :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}
.dark .doc-body :deep(strong) {
  color: rgba(255, 255, 255, 0.9);
}
</style>
