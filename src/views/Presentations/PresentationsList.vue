<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-6">
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {{ error }}
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ loading ? 'Загрузка...' : 'Создавайте и редактируйте презентации' }}
        </p>
        <router-link
          to="/dashboard/presentations/new"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <PlusIcon />
          Создать презентацию
        </router-link>
      </div>

      <div
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="presentation in presentations"
          :key="presentation.id"
          class="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-brand-800"
        >
          <router-link
            :to="`/dashboard/presentations/${presentation.id}/edit`"
            class="flex flex-1 flex-col"
          >
            <div
              class="aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="presentation.coverImage"
                :src="presentation.coverImage"
                :alt="presentation.title"
                class="h-full w-full object-cover transition group-hover:scale-105"
              />
              <span
                v-else
                class="text-4xl text-gray-400 dark:text-gray-500"
              >
                {{ presentation.title?.charAt(0) || 'П' }}
              </span>
            </div>
            <div class="flex flex-1 flex-col p-4">
              <h3 class="font-semibold text-gray-800 dark:text-white/90 line-clamp-1">
                {{ presentation.title || 'Без названия' }}
              </h3>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Обновлено {{ formatDate(presentation.updatedAt) }}
              </p>
            </div>
          </router-link>
          <button
            type="button"
            class="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            title="Удалить презентацию"
            @click.stop="confirmDelete(presentation)"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div
        v-if="presentations.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700"
      >
        <p class="text-gray-500 dark:text-gray-400">
          Презентаций пока нет
        </p>
        <router-link
          to="/dashboard/presentations/new"
          class="mt-4 inline-flex items-center gap-2 text-brand-500 hover:text-brand-600"
        >
          <PlusIcon />
          Создать первую презентацию
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { api, hasApi, getToken } from '@/api/client'
import type { PresentationListItem } from '@/api/client'

const currentPageTitle = ref('Презентации')

interface Presentation {
  id: string
  title: string
  coverImage?: string
  updatedAt: string
}

const presentations = ref<Presentation[]>([])
const loading = ref(false)
const error = ref('')

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function loadFromApi() {
  loading.value = true
  error.value = ''
  try {
    const list = await api.get<PresentationListItem[]>('/api/presentations')
    presentations.value = list
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить список'
    presentations.value = []
  } finally {
    loading.value = false
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('presentations-list')
    if (raw) {
      const list: Presentation[] = JSON.parse(raw)
      presentations.value = list.sort(
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
  if (hasApi() && getToken()) {
    loadFromApi()
  } else {
    loadFromLocalStorage()
  }
}

async function confirmDelete(presentation: Presentation) {
  if (!window.confirm(`Удалить презентацию «${presentation.title || 'Без названия'}»?`)) {
    return
  }
  if (hasApi() && getToken()) {
    try {
      await api.delete(`/api/presentations/${presentation.id}`)
      presentations.value = presentations.value.filter((p) => p.id !== presentation.id)
    } catch {
      loadPresentations()
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

onMounted(loadPresentations)
</script>
