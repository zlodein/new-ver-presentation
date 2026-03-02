<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <router-link
          to="/dashboard/admin/pages"
          class="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          ← Назад к настройке страниц
        </router-link>
      </div>

      <ComponentCard title="Слайдер главной страницы">
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Загрузите фоновые изображения для десктопа и мобильной версии. Слева отображаются заголовок, описание и кнопки.
        </p>

        <div class="space-y-6">
          <div
            v-for="(slide, idx) in slides"
            :key="idx"
            class="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800 dark:text-white">Слайд {{ idx + 1 }}</h3>
              <button
                type="button"
                class="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                @click="removeSlide(idx)"
              >
                Удалить
              </button>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Заголовок</label>
                  <input
                    v-model="slide.title"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Заголовок слайда"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                  <textarea
                    v-model="slide.description"
                    rows="3"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Описание"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопки</label>
                  <div v-for="(btn, bi) in slide.buttons" :key="bi" class="mb-2 flex gap-2">
                    <input
                      v-model="btn.text"
                      type="text"
                      class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Текст"
                    />
                    <input
                      v-model="btn.href"
                      type="text"
                      class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Ссылка"
                    />
                    <button
                      type="button"
                      class="rounded-lg border border-red-200 px-2 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                      @click="slide.buttons.splice(bi, 1)"
                    >
                      ×
                    </button>
                  </div>
                  <button
                    type="button"
                    class="mt-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    @click="slide.buttons.push({ text: '', href: '' })"
                  >
                    + Добавить кнопку
                  </button>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Фон (десктоп)</label>
                  <div class="flex items-center gap-3">
                    <div
                      v-if="slide.bgImageDesktop"
                      class="relative h-24 w-40 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img :src="toImgUrl(slide.bgImageDesktop)" alt="" class="h-full w-full object-cover" />
                    </div>
                    <label class="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="(e) => onUpload(e, slide, 'bgImageDesktop')"
                      />
                      {{ slide.bgImageDesktop ? 'Заменить' : 'Загрузить' }}
                    </label>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Фон (мобильный)</label>
                  <div class="flex items-center gap-3">
                    <div
                      v-if="slide.bgImageMobile"
                      class="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img :src="toImgUrl(slide.bgImageMobile)" alt="" class="h-full w-full object-cover" />
                    </div>
                    <label class="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="(e) => onUpload(e, slide, 'bgImageMobile')"
                      />
                      {{ slide.bgImageMobile ? 'Заменить' : 'Загрузить' }}
                    </label>
                    <span class="text-xs text-gray-500">Если не задано — используется десктопное</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-gray-500 hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:hover:border-brand-600"
            @click="addSlide"
          >
            + Добавить слайд
          </button>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            :disabled="saving"
            class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="save"
          >
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <span v-if="saved" class="flex items-center text-sm text-green-600 dark:text-green-400">Сохранено</span>
          <span v-if="error" class="flex items-center text-sm text-red-600 dark:text-red-400">{{ error }}</span>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api, getApiBase } from '@/api/client'

const currentPageTitle = 'Главная страница'
const PAGE_ID = 'home'

interface Slide {
  title: string
  description: string
  bgImageDesktop?: string | null
  bgImageMobile?: string | null
  buttons: { text: string; href: string }[]
}

const slides = ref<Slide[]>([])
const saving = ref(false)
const saved = ref(false)
const error = ref('')

function toImgUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  const base = getApiBase()
  return base ? `${base}${path}` : path
}

async function load() {
  try {
    const res = await api.get<{ settings: { slider?: { slides?: Slide[] } } }>(`/api/admin/pages/${PAGE_ID}`)
    const s = res?.settings?.slider?.slides
    slides.value = Array.isArray(s) && s.length > 0
      ? s.map((x) => ({
          title: x.title ?? '',
          description: x.description ?? '',
          bgImageDesktop: x.bgImageDesktop ?? null,
          bgImageMobile: x.bgImageMobile ?? null,
          buttons: Array.isArray(x.buttons) ? x.buttons.map((b) => ({ text: b.text ?? '', href: b.href ?? '' })) : [],
        }))
      : [{ title: '', description: '', buttons: [] }]
  } catch (e) {
    slides.value = [{ title: '', description: '', buttons: [] }]
  }
}

function addSlide() {
  slides.value.push({ title: '', description: '', buttons: [] })
}

function removeSlide(idx: number) {
  slides.value.splice(idx, 1)
}

async function onUpload(
  e: Event,
  slide: Slide,
  field: 'bgImageDesktop' | 'bgImageMobile'
) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiBase() || ''}/api/upload/page-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      body: formData,
    })
    const data = await res.json()
    if (data.url) {
      slide[field] = data.url
    } else {
      error.value = data.error || 'Ошибка загрузки'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
  }
  input.value = ''
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await api.put(`/api/admin/pages/${PAGE_ID}`, {
      slider: { slides: slides.value },
    })
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
