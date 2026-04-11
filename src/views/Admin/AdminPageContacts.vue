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

      <ComponentCard title="Страница «Контакты»">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Заголовок страницы</label>
            <input
              v-model="pageTitle"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Контакты"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Вводный текст</label>
            <textarea
              v-model="intro"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Юридический адрес</label>
              <textarea v-model="legalAddress" rows="3" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Электронная почта</label>
              <input v-model="email" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Телефон</label>
              <input v-model="phone" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Режим работы поддержки</label>
              <input v-model="supportHours" type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Реквизиты / примечание</label>
            <textarea
              v-model="requisitesNote"
              rows="5"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm leading-relaxed dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
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
import { api } from '@/api/client'
import type { ContactsPageSettings } from '@/types/pageSettings'

const currentPageTitle = 'Страница «Контакты»'
const PAGE_ID = 'contacts'

const pageTitle = ref('')
const intro = ref('')
const legalAddress = ref('')
const email = ref('')
const phone = ref('')
const supportHours = ref('')
const requisitesNote = ref('')

const saving = ref(false)
const saved = ref(false)
const error = ref('')

async function load() {
  try {
    const res = await api.get<{ settings: ContactsPageSettings }>(`/api/admin/pages/${PAGE_ID}`)
    const s = res?.settings ?? {}
    pageTitle.value = typeof s.pageTitle === 'string' ? s.pageTitle : ''
    intro.value = typeof s.intro === 'string' ? s.intro : ''
    legalAddress.value = typeof s.legalAddress === 'string' ? s.legalAddress : ''
    email.value = typeof s.email === 'string' ? s.email : ''
    phone.value = typeof s.phone === 'string' ? s.phone : ''
    supportHours.value = typeof s.supportHours === 'string' ? s.supportHours : ''
    requisitesNote.value = typeof s.requisitesNote === 'string' ? s.requisitesNote : ''
  } catch {
    error.value = ''
  }
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  const body: ContactsPageSettings = {
    pageTitle: pageTitle.value.trim(),
    intro: intro.value.trim(),
    legalAddress: legalAddress.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    supportHours: supportHours.value.trim(),
    requisitesNote: requisitesNote.value.trim(),
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
