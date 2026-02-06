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
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          @click="showCreateModal = true"
        >
          <PlusIcon />
          Создать презентацию
        </button>
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
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-2 text-brand-500 hover:text-brand-600"
          @click="showCreateModal = true"
        >
          <PlusIcon />
          Создать первую презентацию
        </button>
      </div>
    </div>

    <!-- Модальное окно: название и описание при создании презентации -->
    <Modal v-if="showCreateModal" :full-screen-backdrop="true" @close="showCreateModal = false">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
          @click.stop
        >
          <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Новая презентация
          </h3>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Название объекта <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createTitle"
                type="text"
                placeholder="Введите название"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Описание (по желанию)
              </label>
              <textarea
                v-model="createDescription"
                rows="2"
                placeholder="Краткое описание объекта"
                class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showCreateModal = false"
            >
              Отмена
            </button>
            <button
              type="button"
              :disabled="!createTitle.trim()"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="submitCreate"
            >
              Создать
            </button>
          </div>
          <button
            type="button"
            class="absolute right-4 top-4 rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Закрыть"
            @click="showCreateModal = false"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import Modal from '@/components/profile/Modal.vue'
import { api, hasApi, getToken } from '@/api/client'
import type { PresentationListItem } from '@/api/client'

const router = useRouter()
const currentPageTitle = ref('Презентации')

const showCreateModal = ref(false)
const createTitle = ref('')
const createDescription = ref('')

function genSlideId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const SLIDE_TYPES = [
  { type: 'cover', label: 'Обложка' },
  { type: 'description', label: 'Описание' },
  { type: 'infrastructure', label: 'Инфраструктура' },
  { type: 'description', label: 'Описание' },
  { type: 'location', label: 'Местоположение' },
  { type: 'image', label: 'Изображение' },
  { type: 'gallery', label: 'Галерея' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'layout', label: 'Планировка' },
  { type: 'grid', label: 'Сетка с изображениями' },
  { type: 'contacts', label: 'Контакты' },
]

function getDefaultDataForType(type: string, title: string, subtitle: string): Record<string, unknown> {
  switch (type) {
    case 'cover':
      return {
        title: title || 'Новая презентация',
        subtitle: subtitle || '',
        deal_type: 'Аренда',
        currency: 'RUB',
        price_value: 0,
        show_all_currencies: false,
      }
    case 'description':
      return { heading: '', text: '' }
    case 'infrastructure':
      return { heading: 'Инфраструктура', content: '', items: ['Пункт 1', 'Пункт 2', 'Пункт 3'] }
    case 'location':
      return {
        heading: 'Местоположение',
        address: '',
        lat: 55.755864,
        lng: 37.617698,
        show_metro: true,
        metro_stations: [],
      }
    case 'image':
      return { heading: '', imageUrl: '' }
    case 'gallery':
      return { heading: 'Галерея', images: [] as string[] }
    case 'characteristics':
      return {
        heading: 'Характеристики',
        items: [
          { label: 'Площадь', value: '—' },
          { label: 'Этажность', value: '—' },
          { label: 'Год', value: '—' },
          { label: 'Материал', value: '—' },
        ],
      }
    case 'layout':
      return { heading: 'Планировка' }
    case 'grid':
      return { heading: 'Сетка', images: [] as string[] }
    case 'contacts':
      return { heading: 'Контакты', phone: '', email: '', address: '' }
    default:
      return {}
  }
}

function buildDefaultSlides(title: string, subtitle: string) {
  return SLIDE_TYPES.map(({ type }) => ({
    id: genSlideId(),
    type,
    data: getDefaultDataForType(type, title, subtitle),
    hidden: false,
  }))
}

async function submitCreate() {
  const title = createTitle.value.trim()
  if (!title) return
  const subtitle = createDescription.value
  const slides = buildDefaultSlides(title, subtitle)
  const content = { slides }

  if (hasApi() && getToken()) {
    try {
      const created = await api.post<{ id: string }>('/api/presentations', {
        title,
        content,
      })
      showCreateModal.value = false
      createTitle.value = ''
      createDescription.value = ''
      router.push(`/dashboard/presentations/${created.id}/edit`)
      return
    } catch {
      error.value = 'Не удалось создать презентацию'
    }
  }

  const id = `pres-${Date.now()}`
  const listRaw = localStorage.getItem('presentations-list')
  const list = listRaw ? JSON.parse(listRaw) : []
  list.push({
    id,
    title,
    updatedAt: new Date().toISOString(),
  })
  localStorage.setItem('presentations-list', JSON.stringify(list))
  localStorage.setItem(`presentation-${id}`, JSON.stringify({ slides }))
  showCreateModal.value = false
  createTitle.value = ''
  createDescription.value = ''
  router.push(`/dashboard/presentations/${id}/edit`)
}

interface Presentation {
  id: string
  title: string
  coverImage?: string
  updatedAt: string
  status?: string
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

/** Оставляем только id презентации: при формате "1:1" (id:user_id) берём часть до двоеточия. */
function normalizePresentationId(id: string | number | undefined): string {
  if (id == null) return ''
  const s = String(id).trim()
  const part = s.includes(':') ? s.split(':')[0].trim() : s
  return part
}

async function loadFromApi() {
  loading.value = true
  error.value = ''
  try {
    const list = await api.get<PresentationListItem[]>('/api/presentations')
    presentations.value = list.map((p) => ({
      ...p,
      id: normalizePresentationId(p.id) || String(p.id ?? ''),
    }))
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
      const normalized = list.map((p) => ({ ...p, id: normalizePresentationId(p.id) || String(p.id ?? '') }))
      presentations.value = normalized.sort(
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
    const id = normalizePresentationId(presentation?.id)
    if (!id) {
      error.value = 'Не удалось определить id презентации'
      return
    }
    try {
      await api.delete(`/api/presentations/${id}`)
      presentations.value = presentations.value.filter((p) => p.id !== id)
      error.value = ''
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось удалить презентацию. Если в консоли есть «Tracking Prevention» — разрешите доступ к сайту в настройках браузера или войдите снова.'
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
