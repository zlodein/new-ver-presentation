<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-6">
      <router-link
        to="/dashboard/admin/pages"
        class="inline-block text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        ← Назад к настройке страниц
      </router-link>

      <ComponentCard title="Шапка страницы «Презентации»">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Подзаголовок (категория)</label>
            <input
              v-model="kicker"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Каталог шаблонов"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Заголовок (HTML допускает &lt;br&gt;)</label>
            <textarea
              v-model="heroTitle"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Презентации для..."
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Подзаголовок абзацем</label>
            <textarea
              v-model="heroSubtitle"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка 1 — текст</label>
            <input v-model="primaryCta.label" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка 1 — ссылка</label>
            <input v-model="primaryCta.to" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="/tariffs" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка 2 — текст</label>
            <input v-model="secondaryCta.label" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кнопка 2 — ссылка</label>
            <input v-model="secondaryCta.to" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="/signup" />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Карточки каталога (PDF и публичная ссылка для превью)">
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Укажите прямой URL PDF (например <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/uploads/demo/city.pdf</code>) и публичный просмотр
          (<code class="rounded bg-gray-100 px-1 dark:bg-gray-800">/view/shortId/slug</code> или полный URL). На сайте откроются во всплывающем окне.
        </p>
        <div v-for="(item, idx) in catalog" :key="item.id" class="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-medium text-gray-800 dark:text-white">Карточка {{ idx + 1 }}</span>
            <button type="button" class="text-sm text-red-600 hover:text-red-700 dark:text-red-400" @click="catalog.splice(idx, 1)">
              Удалить
            </button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Категория</label>
              <select
                v-model="item.category"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="city">Городская</option>
                <option value="country">Загородная</option>
                <option value="commercial">Коммерческая</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">ID (технический)</label>
              <input v-model="item.id" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Заголовок</label>
              <input v-model="item.title" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Описание</label>
              <textarea v-model="item.blurb" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">URL PDF</label>
              <input v-model="item.pdfUrl" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="/uploads/..." />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Публичная ссылка просмотра</label>
              <input
                v-model="item.publicViewUrl"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="/view/..."
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          class="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-brand-500 hover:text-brand-600 dark:border-gray-700"
          @click="addCatalogItem"
        >
          + Добавить карточку
        </button>
      </ComponentCard>

      <ComponentCard title="FAQ">
        <div v-for="(row, fi) in faq" :key="fi" class="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div class="mb-2 flex justify-end">
            <button type="button" class="text-sm text-red-600 dark:text-red-400" @click="faq.splice(fi, 1)">Удалить</button>
          </div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Вопрос</label>
          <input v-model="row.q" type="text" class="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <label class="mb-1 block text-xs font-medium text-gray-600">Ответ</label>
          <textarea v-model="row.a" rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <button type="button" class="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400" @click="faq.push({ q: '', a: '' })">
          + Вопрос
        </button>
      </ComponentCard>

      <div class="flex flex-wrap gap-3">
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
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { api } from '@/api/client'
import type { DemoCatalogItem, PresentationsPageSettings } from '@/types/pageSettings'

const currentPageTitle = 'Страница «Презентации»'
const PAGE_ID = 'presentations'

const kicker = ref('')
const heroTitle = ref('')
const heroSubtitle = ref('')
const primaryCta = reactive({ label: '', to: '' })
const secondaryCta = reactive({ label: '', to: '' })
const catalog = ref<DemoCatalogItem[]>([])
const faq = ref<{ q: string; a: string }[]>([])

const saving = ref(false)
const saved = ref(false)
const error = ref('')

function addCatalogItem() {
  catalog.value.push({
    id: `c-${Date.now()}`,
    category: 'city',
    title: '',
    blurb: '',
    pdfUrl: '',
    publicViewUrl: '',
  })
}

function normalizeCatalog(raw: unknown): DemoCatalogItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((x, i) => {
    const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : {}
    const cat = o.category === 'country' || o.category === 'commercial' ? o.category : 'city'
    return {
      id: typeof o.id === 'string' && o.id ? o.id : `c-${i}`,
      category: cat,
      title: typeof o.title === 'string' ? o.title : '',
      blurb: typeof o.blurb === 'string' ? o.blurb : '',
      pdfUrl: typeof o.pdfUrl === 'string' ? o.pdfUrl : '',
      publicViewUrl: typeof o.publicViewUrl === 'string' ? o.publicViewUrl : '',
    }
  })
}

function normalizeFaq(raw: unknown): { q: string; a: string }[] {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => {
    const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : {}
    return {
      q: typeof o.q === 'string' ? o.q : '',
      a: typeof o.a === 'string' ? o.a : '',
    }
  })
}

async function load() {
  try {
    const res = await api.get<{ settings: PresentationsPageSettings }>(`/api/admin/pages/${PAGE_ID}`)
    const s = res?.settings ?? {}
    kicker.value = typeof s.kicker === 'string' ? s.kicker : ''
    heroTitle.value = typeof s.heroTitle === 'string' ? s.heroTitle : ''
    heroSubtitle.value = typeof s.heroSubtitle === 'string' ? s.heroSubtitle : ''
    if (s.primaryCta && typeof s.primaryCta === 'object') {
      const p = s.primaryCta as { label?: string; to?: string }
      primaryCta.label = typeof p.label === 'string' ? p.label : ''
      primaryCta.to = typeof p.to === 'string' ? p.to : ''
    }
    if (s.secondaryCta && typeof s.secondaryCta === 'object') {
      const p = s.secondaryCta as { label?: string; to?: string }
      secondaryCta.label = typeof p.label === 'string' ? p.label : ''
      secondaryCta.to = typeof p.to === 'string' ? p.to : ''
    }
    const cat = normalizeCatalog(s.catalog)
    catalog.value = cat.length > 0 ? cat : []
    faq.value = normalizeFaq(s.faq)
  } catch {
    error.value = ''
  }
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  const body: PresentationsPageSettings = {
    kicker: kicker.value.trim(),
    heroTitle: heroTitle.value.trim(),
    heroSubtitle: heroSubtitle.value.trim(),
    primaryCta: { label: primaryCta.label.trim(), to: primaryCta.to.trim() },
    secondaryCta: { label: secondaryCta.label.trim(), to: secondaryCta.to.trim() },
    catalog: catalog.value,
    faq: faq.value.filter((x) => x.q.trim() || x.a.trim()),
  }
  try {
    await api.put(`/api/admin/pages/${PAGE_ID}`, body)
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
