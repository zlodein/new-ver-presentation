<template>
  <FullScreenLayout>
    <div
      class="relative flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900"
    >
      <div class="w-full max-w-md mx-auto text-center">
        <router-link to="/" class="inline-block mb-8">
          <img
            class="h-10 mx-auto dark:hidden"
            :src="logoUrl('logo.svg')"
            alt="E-Presentation"
          />
          <img
            class="hidden h-10 mx-auto dark:block"
            :src="logoUrl('logo-dark.svg')"
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
        <div class="flex justify-center">
          <router-link
            to="/signin"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Войти
          </router-link>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { logoUrl } from '@/config/logos'
</script>
