<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
        Задачи
      </h3>
      <router-link
        to="/dashboard/tasks"
        class="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
      >
        Подробнее
      </router-link>
    </div>

    <div v-if="loading" class="mt-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Загрузка...
    </div>

    <div
      v-else-if="!hasApi()"
      class="mt-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Для работы с задачами требуется авторизация.
    </div>

    <div
      v-else-if="!tasks.length"
      class="mt-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Нет задач
    </div>

    <ul v-else class="mt-4 space-y-3">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 rounded-lg border border-gray-100 py-2.5 px-3 dark:border-gray-800"
      >
        <span
          class="inline-flex h-2 w-2 shrink-0 rounded-full"
          :class="getStatusDotClass(task.status)"
        />
        <router-link
          :to="`/dashboard/tasks`"
          class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400"
        >
          {{ task.title }}
        </router-link>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          :class="getStatusBadgeClass(task.status)"
        >
          {{ statusLabel(task.status) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, hasApi } from '@/api/client'

const loading = ref(false)
const tasks = ref([])

const statusLabels = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  completed: 'Выполнено',
}

function statusLabel(status) {
  return statusLabels[status] ?? status
}

function getStatusDotClass(status) {
  switch (status) {
    case 'todo':
      return 'bg-gray-400 dark:bg-gray-500'
    case 'in_progress':
      return 'bg-warning-500 dark:bg-warning-400'
    case 'completed':
      return 'bg-success-500 dark:bg-success-400'
    default:
      return 'bg-gray-400'
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80'
    case 'in_progress':
      return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400'
    case 'completed':
      return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-white/[0.03]'
  }
}

async function loadTasks() {
  if (!hasApi()) {
    tasks.value = []
    return
  }
  loading.value = true
  try {
    const list = await api.get('/api/tasks')
    tasks.value = list.slice(0, 6)
  } catch (err) {
    console.error('Ошибка загрузки задач:', err)
    tasks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadTasks)
</script>
