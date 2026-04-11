<template>
  <PublicLayout>
    <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
      <h1 class="mb-1 text-left text-2xl font-semibold leading-tight text-gray-800 dark:text-white sm:text-3xl">
        Пользовательское<br class="sm:hidden" />
        соглашение
      </h1>
      <p class="mb-8 text-left text-sm text-gray-500 dark:text-gray-400">
        12 сентября 2023 · актуализация 29.04.2025
      </p>
      <div
        class="ua-prose prose prose-gray max-w-none text-left text-gray-700 dark:prose-invert dark:text-gray-300 prose-p:leading-relaxed prose-headings:text-left"
        v-html="bodyHtml"
      />
      <div class="mt-10 border-t border-gray-200 pt-6 dark:border-gray-800">
        <router-link
          to="/"
          class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Вернуться на главную
        </router-link>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'
import bodyHtml from './userAgreementBody.html?raw'
</script>

<style scoped>
:deep(.ua-doc p),
:deep(.ua-doc li) {
  font-size: 0.9375rem;
  line-height: 1.65;
}
:deep(.ua-doc ul) {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding-left: 1.25rem;
  list-style: disc;
}
:deep(.ua-doc strong) {
  font-weight: 600;
  color: inherit;
}
</style>
