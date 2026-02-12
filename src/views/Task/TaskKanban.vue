<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <TaskHeader
        :selected-task-group="selectedTaskGroup"
        :task-counts="taskCounts"
        @update:selected-task-group="selectedTaskGroup = $event"
        @task-created="loadTasks"
      />
      <div
        class="grid grid-cols-1 border-t border-gray-200 divide-x divide-gray-200 dark:border-gray-800 mt-7 dark:divide-gray-800 sm:mt-0 sm:grid-cols-2 xl:grid-cols-3"
      >
        <template v-for="(column, columnIndex) in visibleColumns" :key="column.title">
          <div class="overflow-hidden">
            <div class="p-4 xl:p-6">
              <div class="flex items-center justify-between mb-1">
                <h3
                  class="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-white/90"
                >
                  {{ columnLabels[column.status] }}
                  <span :class="getColumnBadgeClass(column.status)">
                    {{ column.tasks.length }}
                  </span>
                </h3>
                <ColumnMenu :column-status="column.status" @clear-column="clearColumn(column.status)" />
              </div>
              <draggable
                v-model="column.tasks"
                :group="{ name: 'tasks', pull: true, put: true }"
                item-key="id"
                class="min-h-[200px] space-y-5 mt-5"
                @change="(evt) => onColumnChange(column.status, evt)"
              >
                <template #item="{ element }">
                  <TaskCard :task="mapTaskForCard(element)" />
                </template>
              </draggable>
            </div>
          </div>
        </template>
      </div>
      <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
        Загрузка задач...
      </div>
      <div
        v-else-if="!hasApi()"
        class="p-8 text-center text-gray-500 dark:text-gray-400"
      >
        Для работы с задачами требуется авторизация и подключение к базе данных.
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import TaskHeader from './TaskHeader.vue'
import TaskCard from './kanban/TaskCard.vue'
import ColumnMenu from './kanban/ColumnMenu.vue'
import { api, hasApi } from '@/api/client'

const currentPageTitle = ref('Задачи')
const selectedTaskGroup = ref('All')
const loading = ref(false)
const columns = ref<ColumnState>({
  todo: [],
  in_progress: [],
  completed: [],
})

interface ApiTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  tag?: string
  dueDate?: string
  createdAt?: string
  updatedAt?: string
}

interface ColumnState {
  todo: ApiTask[]
  in_progress: ApiTask[]
  completed: ApiTask[]
}

const columnLabels: Record<string, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  completed: 'Выполнено',
}

const taskCounts = computed(() => ({
  all: columns.value.todo.length + columns.value.in_progress.length + columns.value.completed.length,
  todo: columns.value.todo.length,
  inProgress: columns.value.in_progress.length,
  completed: columns.value.completed.length,
}))

const visibleColumns = computed(() => {
  const filter = selectedTaskGroup.value
  const all = [
    { status: 'todo' as const, tasks: columns.value.todo },
    { status: 'in_progress' as const, tasks: columns.value.in_progress },
    { status: 'completed' as const, tasks: columns.value.completed },
  ]
  if (filter === 'All') return all
  if (filter === 'Todo') return [all[0]]
  if (filter === 'InProgress') return [all[1]]
  if (filter === 'Completed') return [all[2]]
  return all
})

function getColumnBadgeClass(status: string) {
  const baseClasses = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium'
  switch (status) {
    case 'todo':
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-white/[0.03] dark:text-white/80`
    case 'in_progress':
      return `${baseClasses} bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400`
    case 'completed':
      return `${baseClasses} bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500`
    default:
      return baseClasses
  }
}

function mapTaskForCard(task: ApiTask) {
  const tagColor = task.tag === 'Маркетинг' ? 'brand' : task.tag === 'Разработка' ? 'orange' : task.tag === 'Шаблон' ? 'success' : 'gray'
  const dueDate = task.dueDate ? formatDueDate(task.dueDate) : ''
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    date: dueDate,
    tag: task.tag ? { text: task.tag, color: tagColor } : undefined,
    status: task.status,
  }
}

function formatDueDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const taskDay = new Date(d)
  taskDay.setHours(0, 0, 0, 0)
  if (taskDay.getTime() === today.getTime()) return 'Сегодня'
  if (taskDay.getTime() === tomorrow.getTime()) return 'Завтра'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadTasks() {
  if (!hasApi()) return
  loading.value = true
  try {
    const list = await api.get<ApiTask[]>('/api/tasks')
    columns.value = {
      todo: list.filter((t) => t.status === 'todo'),
      in_progress: list.filter((t) => t.status === 'in_progress'),
      completed: list.filter((t) => t.status === 'completed'),
    }
  } catch (err) {
    console.error('Ошибка загрузки задач:', err)
    columns.value = { todo: [], in_progress: [], completed: [] }
  } finally {
    loading.value = false
  }
}

function onColumnChange(targetStatus: 'todo' | 'in_progress' | 'completed', evt: { added?: { element: ApiTask }; removed?: { element: ApiTask }; moved?: { element: ApiTask } }) {
  const added = evt?.added?.element ?? evt?.moved?.element
  if (added && added.status !== targetStatus) {
    updateTaskStatus(added.id, targetStatus)
    added.status = targetStatus
  }
}

async function updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'completed') {
  if (!hasApi()) return
  try {
    await api.put(`/api/tasks/${taskId}`, { status })
  } catch (err) {
    console.error('Ошибка обновления задачи:', err)
    loadTasks()
  }
}

async function clearColumn(status: 'todo' | 'in_progress' | 'completed') {
  const col = columns.value[status]
  for (const t of col) {
    await updateTaskStatus(t.id, 'completed')
  }
  loadTasks()
}

onMounted(() => loadTasks())
</script>
