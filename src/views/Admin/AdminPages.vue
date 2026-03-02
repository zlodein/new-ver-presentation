<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
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
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { PageIcon } from '@/icons'

const currentPageTitle = 'Настройка страниц'

const publicPages = [
  {
    name: 'Главная страница',
    description: 'Слайдер, блоки контента',
    path: '/dashboard/admin/pages/home',
    icon: PageIcon,
  },
]
</script>
