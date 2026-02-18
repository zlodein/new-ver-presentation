<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-6">
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {{ error }}
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ loading ? 'Загрузка...' : 'Все презентации пользователей' }}
      </p>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="presentation in presentations"
          :key="presentation.id"
          class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-brand-800"
        >
          <router-link
            :to="`/dashboard/presentations/${presentation.id}/edit`"
            class="flex flex-1 flex-col"
          >
            <div class="flex flex-1 flex-col p-4">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-800 dark:text-white/90 line-clamp-1">
                  {{ presentation.title || 'Без названия' }}
                </h3>
                <span
                  v-if="presentation.status"
                  class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="presentation.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
                >
                  {{ presentation.status === 'published' ? 'Опубликовано' : 'Черновик' }}
                </span>
              </div>
              <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <span v-if="presentation.shortId" class="font-mono font-medium text-gray-700 dark:text-gray-300">ID={{ presentation.shortId }}</span>
                <span>{{ presentation.userName }} · {{ presentation.userEmail }}</span>
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Обновлено {{ formatApiDate(presentation.updatedAt) }}
              </p>
            </div>
          </router-link>
        </div>
      </div>

      <div
        v-if="!loading && presentations.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700"
      >
        <p class="text-gray-500 dark:text-gray-400">
          Презентаций пока нет
        </p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'
import { formatApiDate } from '@/composables/useApiDate'

interface AdminPresentation {
  id: string
  title: string
  shortId?: string
  userName: string
  userEmail: string
  updatedAt: string
  status: string
}

const currentPageTitle = ref('Презентации')
const presentations = ref<AdminPresentation[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const list = await api.get<AdminPresentation[]>('/api/admin/presentations')
    presentations.value = list ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить список презентаций'
    presentations.value = []
  } finally {
    loading.value = false
  }
})
</script>
