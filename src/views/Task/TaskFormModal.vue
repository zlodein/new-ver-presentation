<template>
  <Modal @close="$emit('close')">
    <template #body>
      <div
        class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-11"
      >
        <div class="px-2">
          <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ mode === 'edit' ? t.editTask : t.addNewTask }}
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {{ mode === 'edit' ? t.editTaskDescription : t.addTaskDescription }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="transition-color absolute right-5 top-5 z-999 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300 sm:h-11 sm:w-11"
        >
          <svg class="fill-current size-5 sm:size-6" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z" fill="" />
          </svg>
        </button>

        <form @submit.prevent="submitTask" class="flex flex-col">
          <div class="custom-scrollbar h-[450px] overflow-y-auto px-2">
            <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.taskTitle }}
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  required
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  :placeholder="t.taskTitlePlaceholder"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.dueDate }}
                </label>
                <div class="relative">
                  <flat-pickr
                    v-model="formData.dueDate"
                    :config="flatpickrConfig"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    :placeholder="t.selectDate"
                  />
                  <span class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66659 1.5415C7.0808 1.5415 7.41658 1.87729 7.41658 2.2915V2.99984H12.5833V2.2915C12.5833 1.87729 12.919 1.5415 13.3333 1.5415C13.7475 1.5415 14.0833 1.87729 14.0833 2.2915V2.99984L15.4166 2.99984C16.5212 2.99984 17.4166 3.89527 17.4166 4.99984V7.49984V15.8332C17.4166 16.9377 16.5212 17.8332 15.4166 17.8332H4.58325C3.47868 17.8332 2.58325 16.9377 2.58325 15.8332V7.49984V4.99984C2.58325 3.89527 3.47868 2.99984 4.58325 2.99984L5.91659 2.99984V2.2915C5.91659 1.87729 6.25237 1.5415 6.66659 1.5415ZM6.66659 4.49984H4.58325C4.30711 4.49984 4.08325 4.7237 4.08325 4.99984V6.74984H15.9166V4.99984C15.9166 4.7237 15.6927 4.49984 15.4166 4.49984H13.3333H6.66659ZM15.9166 8.24984H4.08325V15.8332C4.08325 16.1093 4.30711 16.3332 4.58325 16.3332H15.4166C15.6927 16.3332 15.9166 16.1093 15.9166 15.8332V8.24984Z" fill="" />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.status }}
                </label>
                <div class="relative z-20 bg-transparent dark:bg-form-input">
                  <select
                    v-model="formData.status"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="todo">{{ t.toDo }}</option>
                    <option value="in_progress">{{ t.inProgress }}</option>
                    <option value="completed">{{ t.completed }}</option>
                  </select>
                  <span class="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg class="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.tag }}
                </label>
                <input
                  v-model="formData.tag"
                  type="text"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  :placeholder="t.tagPlaceholder"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.recentTags }}
                </label>
                <div class="flex flex-wrap gap-2 min-h-[44px] items-center">
                  <template v-if="recentTags.length > 0">
                    <button
                      v-for="tag in recentTags"
                      :key="tag"
                      type="button"
                      @click="formData.tag = tag"
                      class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {{ tag }}
                    </button>
                  </template>
                  <span v-else class="text-sm text-gray-500 dark:text-gray-400">
                    {{ t.noRecentTags }}
                  </span>
                </div>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t.description }}
                </label>
                <textarea
                  v-model="formData.description"
                  rows="6"
                  class="dark:bg-dark-900 resize-none w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  :placeholder="t.descriptionPlaceholder"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-center gap-6 px-2 mt-6 sm:flex-row sm:justify-between">
            <div class="flex items-center w-full gap-3 sm:w-auto">
              <button
                @click="$emit('close')"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                {{ t.cancel }}
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
              >
                {{ loading ? t.saving : (mode === 'edit' ? t.saveChanges : t.createTask) }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import Modal from './Modal.vue'
import flatPickr from 'vue-flatpickr-component'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { api, hasApi } from '@/api/client'

interface ApiTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  tag?: string
  dueDate?: string
}

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    task?: ApiTask | null
    existingTags?: string[]
  }>(),
  { existingTags: () => [] }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const loading = ref(false)
const recentTags = computed(() => props.existingTags.slice(0, 5))
const formData = reactive({
  title: '',
  description: '',
  status: 'todo' as 'todo' | 'in_progress' | 'completed',
  tag: '',
  dueDate: '',
})

watch(
  () => props.task,
  (task) => {
    if (task) {
      formData.title = task.title
      formData.description = task.description ?? ''
      formData.status = task.status
      formData.tag = task.tag ?? ''
      formData.dueDate = task.dueDate ? task.dueDate.slice(0, 10) : ''
    } else {
      formData.title = ''
      formData.description = ''
      formData.status = 'todo'
      formData.tag = ''
      formData.dueDate = ''
    }
  },
  { immediate: true }
)

const t = {
  addNewTask: 'Добавить задачу',
  editTask: 'Редактировать задачу',
  addTaskDescription: 'Управляйте списком дел: добавьте новую задачу',
  editTaskDescription: 'Внесите изменения в задачу',
  taskTitle: 'Название задачи',
  taskTitlePlaceholder: 'Введите название',
  dueDate: 'Срок выполнения',
  selectDate: 'Выберите дату',
  status: 'Статус',
  toDo: 'К выполнению',
  inProgress: 'В работе',
  completed: 'Выполнено',
  tag: 'Тег',
  tagPlaceholder: 'Введите тег',
  recentTags: 'Последние теги',
  noRecentTags: 'Нет использованных тегов',
  description: 'Описание',
  descriptionPlaceholder: 'Опишите задачу',
  cancel: 'Отмена',
  createTask: 'Создать задачу',
  saveChanges: 'Сохранить изменения',
  saving: 'Сохранение...',
}

const flatpickrConfig = {
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'j F Y',
  locale: Russian,
  wrap: true,
}

async function submitTask() {
  if (!hasApi()) {
    alert('Для работы с задачами требуется авторизация')
    return
  }
  loading.value = true
  try {
    if (props.mode === 'edit' && props.task) {
      await api.put(`/api/tasks/${props.task.id}`, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        tag: formData.tag.trim() || undefined,
        dueDate: formData.dueDate || undefined,
      })
    } else {
      await api.post('/api/tasks', {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        tag: formData.tag.trim() || undefined,
        dueDate: formData.dueDate || undefined,
      })
    }
    emit('saved')
  } catch (err) {
    console.error(err)
    alert(props.mode === 'edit' ? 'Ошибка сохранения задачи' : 'Ошибка создания задачи')
  } finally {
    loading.value = false
  }
}
</script>
