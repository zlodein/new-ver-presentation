<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Доступ к сайту">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="font-medium text-gray-800 dark:text-white">
              Сайт отключён для всех, кроме администратора
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              При включении обычные пользователи увидят заглушку «Сайт в разработке». Вход и регистрация остаются доступны.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="siteDisabled"
            :disabled="savingSite"
            class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
            :class="siteDisabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'"
            @click="toggleSiteDisabled"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition"
              :class="siteDisabled ? 'translate-x-5' : 'translate-x-1'"
            />
          </button>
        </div>
        <p v-if="siteSaved" class="mt-3 text-sm text-green-600 dark:text-green-400">Настройки сохранены</p>
        <p v-if="siteError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ siteError }}</p>
      </ComponentCard>

      <ComponentCard title="Настройка страниц">
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Выберите публичную страницу для редактирования компонентов.
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <router-link
            v-for="page in publicPages"
            :key="page.path"
            :to="page.path"
            class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-brand-500 hover:bg-brand-50/50 dark:border-gray-800 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
          >
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <component :is="page.icon" class="h-6 w-6" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-white">{{ page.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ page.description }}</p>
            </div>
          </router-link>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { PageIcon } from '@/icons'
import { api } from '@/api/client'

const currentPageTitle = 'Настройка страниц'

const siteDisabled = ref(false)
const savingSite = ref(false)
const siteSaved = ref(false)
const siteError = ref('')

async function loadSiteSettings() {
  try {
    const res = await api.get<{ siteDisabled?: boolean }>('/api/admin/site/settings')
    siteDisabled.value = !!res?.siteDisabled
  } catch {
    siteDisabled.value = false
  }
}

async function toggleSiteDisabled() {
  savingSite.value = true
  siteError.value = ''
  siteSaved.value = false
  try {
    await api.put('/api/admin/site/settings', { siteDisabled: !siteDisabled.value })
    siteDisabled.value = !siteDisabled.value
    siteSaved.value = true
    setTimeout(() => (siteSaved.value = false), 2000)
  } catch (e) {
    siteError.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  } finally {
    savingSite.value = false
  }
}

const publicPages = [
  {
    name: 'Главная страница',
    description: 'Слайдер, блоки контента',
    path: '/dashboard/admin/pages/home',
    icon: PageIcon,
  },
]

onMounted(loadSiteSettings)
</script>
