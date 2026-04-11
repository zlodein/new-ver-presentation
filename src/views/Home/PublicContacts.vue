<template>
  <PublicLayout>
    <div class="space-y-8">
      <div
        class="rounded-2xl border border-gray-200 bg-white px-5 py-10 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8 sm:py-12"
      >
        <h1 class="mb-2 text-left text-2xl font-semibold text-gray-800 dark:text-white sm:text-3xl">
          {{ page.pageTitle }}
        </h1>
        <p class="mb-10 max-w-2xl whitespace-pre-line text-left text-sm text-gray-500 dark:text-gray-400">
          {{ page.intro }}
        </p>
        <dl class="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Юридический адрес
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
              {{ page.legalAddress }}
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Электронная почта
            </dt>
            <dd class="mt-2 text-sm">
              <a
                v-if="emailHref"
                class="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                :href="emailHref"
              >{{ page.email }}</a>
              <span v-else class="text-gray-800 dark:text-gray-200">{{ page.email }}</span>
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Телефон
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
              {{ page.phone }}
            </dd>
          </div>
          <div class="rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Режим работы поддержки
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
              {{ page.supportHours }}
            </dd>
          </div>
          <div class="sm:col-span-2 rounded-xl border border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Реквизиты для договора и оплаты
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {{ page.requisitesNote }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { api, hasApi } from '@/api/client'
import type { ContactsPageSettings } from '@/types/pageSettings'

const DEFAULT_PAGE: ContactsPageSettings = {
  pageTitle: 'Контакты',
  intro:
    'Реквизиты и контактные данные для деловой переписки. Актуальные значения можно изменить в панели администратора.',
  legalAddress: '[будет указан]',
  email: 'info@e-presentation.ru',
  phone: '[будет указан]',
  supportHours: '[будет указан]',
  requisitesNote:
    'Полный комплект реквизитов (ИНН, КПП, ОГРН, расчётный счёт) предоставляется по запросу на info@e-presentation.ru либо в личном кабинете после запуска соответствующего раздела.',
}

const page = ref<ContactsPageSettings>({ ...DEFAULT_PAGE })

const emailHref = computed(() => {
  const e = (page.value.email || '').trim()
  if (!e || e.startsWith('[')) return ''
  return `mailto:${e}`
})

function merge(raw: ContactsPageSettings | null | undefined) {
  const s = raw && typeof raw === 'object' ? raw : {}
  page.value = {
    pageTitle: typeof s.pageTitle === 'string' && s.pageTitle.trim() ? s.pageTitle : DEFAULT_PAGE.pageTitle,
    intro: typeof s.intro === 'string' && s.intro.trim() ? s.intro : DEFAULT_PAGE.intro,
    legalAddress:
      typeof s.legalAddress === 'string' && s.legalAddress.trim() ? s.legalAddress : DEFAULT_PAGE.legalAddress,
    email: typeof s.email === 'string' && s.email.trim() ? s.email : DEFAULT_PAGE.email,
    phone: typeof s.phone === 'string' && s.phone.trim() ? s.phone : DEFAULT_PAGE.phone,
    supportHours:
      typeof s.supportHours === 'string' && s.supportHours.trim() ? s.supportHours : DEFAULT_PAGE.supportHours,
    requisitesNote:
      typeof s.requisitesNote === 'string' && s.requisitesNote.trim()
        ? s.requisitesNote
        : DEFAULT_PAGE.requisitesNote,
  }
}

onMounted(async () => {
  if (!hasApi()) return
  try {
    const res = await api.get<{ settings: ContactsPageSettings }>('/api/site/pages/contacts')
    merge(res?.settings)
  } catch {
    merge(undefined)
  }
})
</script>
