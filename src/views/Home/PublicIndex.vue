<template>
  <PublicLayout>
    <div
      class="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-12 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-16"
    >
      <div class="mx-auto w-full max-w-[630px] text-center">
        <h1
          class="mb-4 text-2xl font-semibold text-gray-800 dark:text-white sm:text-3xl"
        >
          Сайт в разработке
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Мы работаем над улучшением сервиса. Скоро здесь появится новый контент.
        </p>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'
</script>
