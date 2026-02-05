<template>
  <FullScreenLayout>
    <div
      class="relative flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900"
    >
      <div class="w-full max-w-md mx-auto text-center">
        <router-link to="/" class="inline-block mb-8">
          <img
            class="h-10 mx-auto dark:hidden"
            src="/images/logo/logo.svg"
            alt="E-Presentation"
          />
          <img
            class="hidden h-10 mx-auto dark:block"
            src="/images/logo/logo-dark.svg"
            alt="E-Presentation"
          />
        </router-link>
        <h1
          class="mb-2 text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl"
        >
          E-Presentation
        </h1>
        <p class="mb-10 text-gray-500 dark:text-gray-400">
          Платформа для создания и управления презентациями
        </p>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <router-link
            to="/signin"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Войти
          </router-link>
          <router-link
            to="/dashboard"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Панель управления
          </router-link>
          <router-link
            to="/administration"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Администрирование
          </router-link>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
</script>
