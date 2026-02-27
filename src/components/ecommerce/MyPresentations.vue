<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
  >
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Мои презентации</h3>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink
          to="/dashboard/presentations"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Смотреть все
        </RouterLink>
      </div>
    </div>

    <div v-if="loading" class="py-8 text-center text-gray-500 dark:text-gray-400">
      Загрузка...
    </div>
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
      {{ error }}
    </div>
    <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Презентация</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Просмотры</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Статус</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Действия</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in presentations"
            :key="p.id"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="h-[50px] w-[70px] shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <img
                    v-if="p.coverImage"
                    :src="p.coverImage"
                    :alt="p.title"
                    class="h-full w-full object-cover"
                  />
                  <span v-else class="text-xl text-gray-400 dark:text-gray-500">
                    {{ (p.title || 'П').charAt(0) }}
                  </span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                    {{ p.title || 'Без названия' }}
                  </p>
                  <span class="text-gray-500 text-theme-xs dark:text-gray-400">
                    {{ p.shortId || p.id }}
                  </span>
                </div>
              </div>
            </td>
            <td class="py-3 whitespace-nowrap">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ p.viewsCount ?? 0 }}
              </p>
            </td>
            <td class="py-3 whitespace-nowrap">
              <span
                :class="{
                  'rounded-full px-2 py-0.5 text-theme-xs font-medium': true,
                  'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500':
                    statusKind(p) === 'published',
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400':
                    statusKind(p) === 'draft',
                  'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500':
                    statusKind(p) === 'deleted',
                }"
              >
                {{ statusLabel(p) }}
              </span>
            </td>
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <template v-if="statusKind(p) === 'deleted'">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 dark:text-gray-400 dark:hover:bg-green-950 dark:hover:text-green-400"
                    title="Восстановить"
                    @click="restore(p)"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </template>
                <template v-else>
                  <RouterLink
                    :to="`/dashboard/presentations/${p.id}/edit`"
                    class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title="Редактировать"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </RouterLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="Удалить"
                    @click="softDelete(p)"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="presentations.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400 text-theme-sm">
        Презентаций пока нет
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/api/client'
import type { PresentationListItem } from '@/api/client'

const presentations = ref<PresentationListItem[]>([])
const loading = ref(true)
const error = ref('')

function statusKind(p: PresentationListItem): 'published' | 'draft' | 'deleted' {
  if (p.deletedAt) return 'deleted'
  return p.status === 'published' ? 'published' : 'draft'
}

function statusLabel(p: PresentationListItem): string {
  if (p.deletedAt) return 'Удалено'
  return p.status === 'published' ? 'Опубликовано' : 'Черновик'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const list = await api.get<PresentationListItem[]>('/api/presentations?filter=all')
    presentations.value = list
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить список'
    presentations.value = []
  } finally {
    loading.value = false
  }
}

async function softDelete(p: PresentationListItem) {
  if (!window.confirm(`Удалить презентацию «${p.title || 'Без названия'}»? Её можно будет восстановить в течение месяца.`)) return
  try {
    await api.post('/api/presentations/delete', { id: p.id })
    presentations.value = presentations.value.map((item) =>
      item.id === p.id ? { ...item, deletedAt: new Date().toISOString() } : item
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить'
    load()
  }
}

async function restore(p: PresentationListItem) {
  try {
    await api.post(`/api/presentations/${p.id}/restore`)
    presentations.value = presentations.value.map((item) =>
      item.id === p.id ? { ...item, deletedAt: undefined } : item
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось восстановить'
    load()
  }
}

onMounted(() => load())
</script>
