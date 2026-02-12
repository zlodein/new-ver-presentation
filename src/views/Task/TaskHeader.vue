<template>
  <div>
    <div class="flex flex-col items-center px-4 py-5 xl:px-6 xl:py-6">
      <div class="flex flex-col w-full gap-5 sm:justify-between xl:flex-row xl:items-center">
        <div
          class="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900"
        >
          <button
            v-for="group in taskGroups"
            :key="group.name"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md group hover:text-gray-900 dark:hover:text-white"
            :class="
              selectedTaskGroup === group.name
                ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400'
            "
            @click="selectTaskGroup(group.name)"
          >
            {{ group.label }}
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal group-hover:bg-brand-50 group-hover:text-brand-500 dark:group-hover:bg-brand-500/15 dark:group-hover:text-brand-400"
              :class="
                selectedTaskGroup === group.name
                  ? 'text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15'
                  : 'bg-white dark:bg-white/[0.03]'
              "
            >
              {{ group.count }}
            </span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3 xl:justify-end">
          <button
            @click="openTaskModal"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            {{ t.addNewTask }}
            <svg
              class="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M9.2502 4.99951C9.2502 4.5853 9.58599 4.24951 10.0002 4.24951C10.4144 4.24951 10.7502 4.5853 10.7502 4.99951V9.24971H15.0006C15.4148 9.24971 15.7506 9.5855 15.7506 9.99971C15.7506 10.4139 15.4148 10.7497 15.0006 10.7497H10.7502V15.0001C10.7502 15.4143 10.4144 15.7501 10.0002 15.7501C9.58599 15.7501 9.2502 15.4143 9.2502 15.0001V10.7497H5C4.58579 10.7497 4.25 10.4139 4.25 9.99971C4.25 9.5855 4.58579 9.24971 5 9.24971H9.2502V4.99951Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <TaskFormModal
      v-if="isTaskModalOpen"
      mode="create"
      :existing-tags="existingTags"
      @close="closeTaskModal"
      @saved="onTaskSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaskFormModal from './TaskFormModal.vue'

const emit = defineEmits<{
  (e: 'update:selectedTaskGroup', value: string): void
  (e: 'taskCreated'): void
}>()

const props = withDefaults(
  defineProps<{
    selectedTaskGroup?: string
    taskCounts?: { all: number; todo: number; inProgress: number; completed: number }
    existingTags?: string[]
  }>(),
  {
    selectedTaskGroup: 'All',
    taskCounts: () => ({ all: 0, todo: 0, inProgress: 0, completed: 0 }),
    existingTags: () => [],
  }
)

const isTaskModalOpen = ref(false)

const t = {
  addNewTask: 'Добавить задачу',
}

const taskGroups = computed(() => [
  { name: 'All', label: 'Все задачи', count: props.taskCounts?.all ?? 0 },
  { name: 'Todo', label: 'К выполнению', count: props.taskCounts?.todo ?? 0 },
  { name: 'InProgress', label: 'В работе', count: props.taskCounts?.inProgress ?? 0 },
  { name: 'Completed', label: 'Выполнено', count: props.taskCounts?.completed ?? 0 },
])

function selectTaskGroup(name: string) {
  emit('update:selectedTaskGroup', name)
}

const openTaskModal = () => (isTaskModalOpen.value = true)
const closeTaskModal = () => (isTaskModalOpen.value = false)

function onTaskSaved() {
  closeTaskModal()
  emit('taskCreated')
}
</script>
