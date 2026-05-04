<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <h1 class="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
        Результаты поиска
      </h1>
      <p v-if="searchQuery" class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Запрос: «{{ searchQuery }}»
      </p>

      <div v-if="loading" class="py-8 text-center text-gray-500 dark:text-gray-400">
        Поиск...
      </div>
      <div v-else-if="error" class="py-8 text-center text-red-600 dark:text-red-400">
        {{ error }}
      </div>
      <div v-else-if="!hasAnyResults" class="py-8 text-center text-gray-500 dark:text-gray-400">
        <template v-if="searchQuery">
          Ничего не найдено. Измените запрос или перейдите в нужный раздел.
        </template>
        <template v-else>
          Введите запрос в строке поиска в шапке и нажмите «ок».
        </template>
      </div>
      <div v-else class="space-y-8">
        <section v-if="results.presentations.length" class="border-b border-gray-200 pb-6 last:border-b-0 dark:border-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Презентации
          </h2>
          <ul class="space-y-2">
            <li v-for="item in results.presentations" :key="item.id">
              <RouterLink
                :to="item.link"
                class="flex flex-col rounded-lg border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-500/5 dark:border-gray-800 dark:hover:border-brand-700 dark:hover:bg-brand-500/10"
              >
                <span class="font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                <span v-if="item.subtitle" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.subtitle }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section v-if="results.calendar.length" class="border-b border-gray-200 pb-6 last:border-b-0 dark:border-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Календарь
          </h2>
          <ul class="space-y-2">
            <li v-for="item in results.calendar" :key="item.id">
              <RouterLink
                :to="item.link"
                class="flex flex-col rounded-lg border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-500/5 dark:border-gray-800 dark:hover:border-brand-700 dark:hover:bg-brand-500/10"
              >
                <span class="font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                <span v-if="item.subtitle" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.subtitle }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section v-if="results.tasks.length" class="border-b border-gray-200 pb-6 last:border-b-0 dark:border-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Задачи
          </h2>
          <ul class="space-y-2">
            <li v-for="item in results.tasks" :key="item.id">
              <RouterLink
                :to="item.link"
                class="flex flex-col rounded-lg border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-500/5 dark:border-gray-800 dark:hover:border-brand-700 dark:hover:bg-brand-500/10"
              >
                <span class="font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                <span v-if="item.subtitle" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.subtitle }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section v-if="results.documentation.length">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Документация
          </h2>
          <ul class="space-y-2">
            <li v-for="item in results.documentation" :key="item.id">
              <RouterLink
                :to="item.link"
                class="flex flex-col rounded-lg border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-500/5 dark:border-gray-800 dark:hover:border-brand-700 dark:hover:bg-brand-500/10"
              >
                <span class="font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                <span v-if="item.subtitle" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.subtitle }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import type { GlobalSearchResults } from '@/composables/useGlobalSearch'

const route = useRoute()
const { search, loading, error } = useGlobalSearch()

const currentPageTitle = ref('Поиск')
const results = ref<GlobalSearchResults>({
  presentations: [],
  calendar: [],
  tasks: [],
  documentation: [],
})

const searchQuery = computed(() => (route.query.q as string) || '')

const hasAnyResults = computed(() => {
  const r = results.value
  return (
    r.presentations.length > 0 ||
    r.calendar.length > 0 ||
    r.tasks.length > 0 ||
    r.documentation.length > 0
  )
})

async function runSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    results.value = {
      presentations: [],
      calendar: [],
      tasks: [],
      documentation: [],
    }
    return
  }
  results.value = await search(q)
}

watch(
  () => route.query.q,
  async (q) => {
    await runSearch()
  },
  { immediate: true }
)
</script>
