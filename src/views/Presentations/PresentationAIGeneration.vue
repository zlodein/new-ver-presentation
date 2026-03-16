<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="AI-генерация" />
    <div class="space-y-6 max-w-3xl">
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white/90">
          Создание макета презентации с помощью AI
        </h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Опишите объект или задачу для презентации. Мы сгенерируем структуру слайдов и откроем редактор с готовым макетом.
        </p>
        <div class="mt-4 space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Промпт для генерации макета
          </label>
          <textarea
            v-model="prompt"
            rows="5"
            class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            placeholder="Например: «Презентация бизнес-центра класса A в центре Москвы для арендаторов офисов, акцент на инфраструктуру и планировки этажей»"
          />
          <p v-if="validationError" class="text-sm text-red-600 dark:text-red-400">
            {{ validationError }}
          </p>
        </div>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="submitting || !canUseApi"
            @click="handleGenerate"
          >
            <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            <span>{{ submitting ? 'Генерация макета...' : 'Сгенерировать макет' }}</span>
          </button>
          <p v-if="!canUseApi" class="text-xs text-gray-500 dark:text-gray-400">
            API недоступен в текущей среде. Укажите <code>VITE_API_URL</code> и ключ GigaChat на сервере.
          </p>
        </div>
        <p v-if="errorMessage" class="mt-3 text-sm text-red-600 dark:text-red-400">
          {{ errorMessage }}
        </p>
        <p v-if="helperMessage && !errorMessage" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {{ helperMessage }}
        </p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api, hasApi, getToken } from '@/api/client'

const router = useRouter()

const prompt = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const validationError = ref('')

const canUseApi = computed(() => hasApi() && !!getToken())

const helperMessage = computed(() => {
  if (!canUseApi.value) {
    return 'Для работы AI-генерации нужно указать адрес API (VITE_API_URL) и авторизоваться.'
  }
  return 'Будет использован настроенный ключ GigaChat на сервере. После генерации откроется редактор с макетом.'
})

/** Преобразует страницы AI-макета в слайды редактора (type: 'custom', data с layoutMode, pageName, pageStyle, blocks). */
function buildSlidesFromAiPages(rawPages: unknown): unknown[] {
  if (!Array.isArray(rawPages)) return []
  return rawPages
    .filter((p) => p && typeof p === 'object')
    .map((page, i) => {
      const p = page as { id?: string; name?: string; style?: Record<string, unknown>; blocks?: unknown[] }
      const id = `slide-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`
      const blocks = Array.isArray(p.blocks)
        ? p.blocks.map((b, j) => {
            const block = b && typeof b === 'object' ? (b as Record<string, unknown>) : {}
            return {
              id: block.id ?? `b-${j}`,
              type: typeof block.type === 'string' ? block.type : 'text',
              content: block.content != null ? String(block.content) : '',
              items: Array.isArray(block.items) ? block.items.map((x) => String(x)) : undefined,
              columns: block.columns,
              style: block.style && typeof block.style === 'object' ? block.style : {},
            }
          })
        : []
      return {
        id,
        type: 'custom',
        hidden: false,
        data: {
          layoutMode: 'ai',
          pageName: typeof p.name === 'string' ? p.name : `Страница ${i + 1}`,
          pageStyle: p.style && typeof p.style === 'object' ? p.style : {},
          blocks,
        },
      }
    })
}

async function handleGenerate() {
  validationError.value = ''
  errorMessage.value = ''

  const trimmed = prompt.value.trim()
  if (!trimmed) {
    validationError.value = 'Введите промпт для генерации макета.'
    return
  }
  if (!canUseApi.value) {
    errorMessage.value = 'API недоступен. Проверьте настройки подключения и авторизацию.'
    return
  }

  submitting.value = true
  try {
    const aiResult = await api.post<{ title?: string; pages?: unknown[] }>('/api/generate_layout', {
      prompt: trimmed,
    })

    const slides = buildSlidesFromAiPages(aiResult?.pages)
    if (!slides.length) {
      throw new Error('Не удалось получить структуру макета от AI')
    }

    const finalTitle = (aiResult?.title && String(aiResult.title).trim()) || trimmed || 'Новая презентация'

    const created = await api.post<{ id: string }>('/api/presentations', {
      title: finalTitle,
      content: { slides },
    })

    router.push(`/dashboard/presentations/${created.id}/edit`)
  } catch (e) {
    if (e instanceof Error) {
      errorMessage.value = e.message || 'Ошибка при генерации макета'
    } else {
      errorMessage.value = 'Ошибка при генерации макета'
    }
  } finally {
    submitting.value = false
  }
}
</script>

