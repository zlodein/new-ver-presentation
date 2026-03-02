<template>
  <PublicLayout>
    <div class="space-y-8">
      <HomeSlider v-if="sliderSlides.length > 0" :slides="sliderSlides" />
      <div
        class="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-12 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-16"
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
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import HomeSlider from '@/components/home/HomeSlider.vue'
import { api, hasApi } from '@/api/client'
import type { HomeSliderSlide } from '@/components/home/HomeSlider.vue'

const sliderSlides = ref<HomeSliderSlide[]>([])

onMounted(async () => {
  if (!hasApi()) return
  try {
    const res = await api.get<{ settings: { slider?: { slides?: HomeSliderSlide[] } } }>('/api/site/pages/home')
    const s = res?.settings?.slider?.slides
    if (Array.isArray(s) && s.length > 0) {
      sliderSlides.value = s
    }
  } catch {
    // Игнорируем — показываем заглушку
  }
})
</script>
