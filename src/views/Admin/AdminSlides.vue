<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-6">
      <div v-if="loading" class="rounded-xl border border-gray-200 bg-white/60 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        Загрузка...
      </div>

      <div v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Выберите презентацию, чтобы открыть админский редактор с сеткой слайдов.
          </p>

          <div v-if="presentations.length > 0" class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="openEditor(presentations[0].id)"
            >
              Открыть (быстрый вход)
            </button>
          </div>
        </div>

        <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {{ error }}
        </div>

        <div v-if="presentations.length === 0" class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
          <p class="text-gray-500 dark:text-gray-400">Нет презентаций</p>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="p in presentations"
            :key="p.id"
            class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-brand-800"
          >
            <button
              type="button"
              class="flex flex-col text-left"
              @click="openEditor(p.id)"
            >
              <div class="aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  v-if="p.coverImage"
                  :src="p.coverImage"
                  :alt="p.title"
                  class="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span v-else class="text-4xl text-gray-400 dark:text-gray-500">
                  {{ p.title?.charAt(0) || 'П' }}
                </span>
              </div>
              <div class="flex flex-1 flex-col p-4">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-800 dark:text-white/90 line-clamp-1">
                    {{ p.title || 'Без названия' }}
                  </h3>
                  <span
                    v-if="p.status"
                    class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="p.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
                  >
                    {{ p.status === 'published' ? 'Опубликовано' : 'Черновик' }}
                  </span>
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Обновлено {{ formatApiDate(p.updatedAt) }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'
import { formatApiDate } from '@/composables/useApiDate'

interface AdminPresentation {
  id: string
  title: string
  coverImage?: string
  updatedAt: string
  status: string
  shortId?: string
}

const router = useRouter()
const route = useRoute()

const currentPageTitle = 'Слайды'

const loading = ref(false)
const error = ref('')
const presentations = ref<AdminPresentation[]>([])

const LAST_ID_LS_KEY = 'admin-slides-last-presentation-id'

function openEditor(id: string) {
  localStorage.setItem(LAST_ID_LS_KEY, id)
  router.push({ path: `/dashboard/admin/slides/${id}` })
}

async function loadPresentations() {
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
}

onMounted(async () => {
  await loadPresentations()

  const choose = route.query.choose === '1'
  if (choose) return

  if (!presentations.value.length) return

  const lastId = localStorage.getItem(LAST_ID_LS_KEY)
  const targetId = (lastId && presentations.value.some((p) => p.id === lastId) ? lastId : presentations.value[0]!.id) as string

  if (targetId) {
    openEditor(targetId)
  }
})
</script>

