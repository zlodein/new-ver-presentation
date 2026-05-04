<template>
  <AdminLayout>
    <PageBreadcrumb page-title="Компании" />
    <div class="space-y-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Добавьте компанию или агентство — для каждой будет доступна единая библиотека ресурсов: логотипы, шрифты, цветовая палитра и иконки. Любой сотрудник сможет создавать презентации в едином фирменном стиле.
      </p>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {{ error }}
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <input
          v-model="newCompanyName"
          type="text"
          placeholder="Название компании"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          @keydown.enter="addCompany"
        />
        <button
          type="button"
          :disabled="adding"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          @click="addCompany"
        >
          <PlusIcon />
          Добавить компанию
        </button>
      </div>

      <div v-if="loading && companies.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Загрузка...
      </div>

      <div v-else-if="companies.length === 0" class="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400">
        У вас пока нет компаний. Добавьте первую — откроется блок «Единая библиотека ресурсов».
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="company in companies"
          :key="company.id"
          class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
            @click="toggleCompany(company.id)"
          >
            <span class="font-medium text-gray-800 dark:text-white/90">{{ company.name || 'Без названия' }}</span>
            <svg
              :class="['h-5 w-5 text-gray-500 transition-transform', expandedId === company.id && 'rotate-180']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedId === company.id" class="border-t border-gray-200 dark:border-gray-700">
            <div class="p-4 pt-2">
              <h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Единая библиотека ресурсов
              </h3>
              <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
                Хранилище утверждённых логотипов, шрифтов, цветовых палитр и иконок агентства для создания презентаций в едином фирменном стиле.
              </p>
              <div class="grid gap-6 sm:grid-cols-2">
                <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                  <h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Логотипы</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Загрузите утверждённые логотипы компании (в редакторе презентаций можно будет подставлять их в блок контактов).</p>
                  <div v-if="getResources(company).logos.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(url, i) in getResources(company).logos" :key="i" class="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700">{{ url }}</span>
                  </div>
                  <p v-else class="mt-1 text-xs italic text-gray-400">Пока не добавлено</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                  <h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Шрифты</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Укажите рекомендуемые шрифты для заголовков и текста.</p>
                  <div v-if="getResources(company).fonts.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(f, i) in getResources(company).fonts" :key="i" class="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700">{{ f }}</span>
                  </div>
                  <p v-else class="mt-1 text-xs italic text-gray-400">Пока не добавлено</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                  <h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Цветовая палитра</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Основной и дополнительные цвета фирменного стиля.</p>
                  <div v-if="Object.keys(getResources(company).palette).length" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="(hex, name) in getResources(company).palette"
                      :key="name"
                      class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs"
                      :style="{ backgroundColor: hex, color: contrastColor(hex) }"
                    >
                      {{ name }}: {{ hex }}
                    </span>
                  </div>
                  <p v-else class="mt-1 text-xs italic text-gray-400">Пока не добавлено</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                  <h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Иконки</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Утверждённые иконки для соцсетей и мессенджеров.</p>
                  <div v-if="getResources(company).icons.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(url, i) in getResources(company).icons" :key="i" class="rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700">{{ url }}</span>
                  </div>
                  <p v-else class="mt-1 text-xs italic text-gray-400">Пока не добавлено</p>
                </div>
              </div>
              <p class="mt-4 text-xs text-gray-400 dark:text-gray-500">
                Редактирование и загрузка файлов в библиотеку будут доступны в следующем обновлении. Сейчас отображаются сохранённые данные.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { api } from '@/api/client'

interface CompanyResources {
  logos: string[]
  fonts: string[]
  palette: Record<string, string>
  icons: string[]
}

interface Company {
  id: string
  name: string
  resources: CompanyResources
  createdAt?: string
  updatedAt?: string
}

const companies = ref<Company[]>([])
const loading = ref(true)
const error = ref('')
const adding = ref(false)
const newCompanyName = ref('')
const expandedId = ref<string | null>(null)

function getResources(company: Company): CompanyResources {
  return company.resources ?? { logos: [], fonts: [], palette: {}, icons: [] }
}

function toggleCompany(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function contrastColor(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#000'
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const l = 0.299 * r + 0.587 * g + 0.114 * b
  return l > 0.5 ? '#000000' : '#ffffff'
}

async function loadCompanies() {
  loading.value = true
  error.value = ''
  try {
    const list = await api.get<Company[]>('/api/companies')
    companies.value = list ?? []
    if (companies.value.length > 0 && !expandedId.value) expandedId.value = companies.value[0]!.id
  } catch {
    error.value = 'Не удалось загрузить список компаний'
    companies.value = []
  } finally {
    loading.value = false
  }
}

async function addCompany() {
  const name = newCompanyName.value.trim() || 'Моя компания'
  if (adding.value) return
  adding.value = true
  error.value = ''
  try {
    const created = await api.post<{ id: string; name: string }>('/api/companies', { name })
    companies.value = [{ id: created.id, name: created.name, resources: { logos: [], fonts: [], palette: {}, icons: [] } }, ...companies.value]
    expandedId.value = created.id
    newCompanyName.value = ''
  } catch {
    error.value = 'Не удалось создать компанию'
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadCompanies()
})
</script>
