<template>
  <div v-if="slides.length > 0" class="relative overflow-hidden rounded-2xl">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      :autoplay="{ delay: 5000, disableOnInteraction: false }"
      :pagination="{ clickable: true, el: '.home-slider-pagination' }"
      :navigation="{ nextEl: '.home-slider-next', prevEl: '.home-slider-prev' }"
      class="home-slider"
    >
      <SwiperSlide v-for="(slide, i) in slides" :key="i" class="relative min-h-[320px] md:min-h-[420px]">
        <!-- Фон: десктоп и мобильный -->
        <div class="absolute inset-0">
          <img
            v-if="slide.bgImageDesktop"
            :src="toAbsoluteUrl(slide.bgImageDesktop)"
            alt=""
            class="hidden md:block absolute inset-0 w-full h-full object-cover"
          />
          <img
            v-if="slide.bgImageMobile"
            :src="toAbsoluteUrl(slide.bgImageMobile)"
            alt=""
            class="md:hidden absolute inset-0 w-full h-full object-cover"
          />
          <img
            v-else-if="slide.bgImageDesktop"
            :src="toAbsoluteUrl(slide.bgImageDesktop)"
            alt=""
            class="md:hidden absolute inset-0 w-full h-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800"
          />
          <div class="absolute inset-0 bg-black/40" />
        </div>
        <!-- Контент слева -->
        <div class="relative flex flex-col justify-center px-6 py-12 md:px-12 md:py-16 max-w-2xl">
          <h2 class="text-2xl font-bold text-white md:text-4xl drop-shadow-lg">
            {{ slide.title || 'Заголовок' }}
          </h2>
          <p
            v-if="slide.description"
            class="mt-3 text-base text-white/90 md:text-lg drop-shadow"
          >
            {{ slide.description }}
          </p>
          <div v-if="slide.buttons?.length" class="mt-6 flex flex-wrap gap-3">
            <a
              v-for="(btn, bi) in slide.buttons"
              :key="bi"
              :href="btn.href"
              class="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-brand-600 shadow-lg transition hover:bg-brand-50"
            >
              {{ btn.text }}
            </a>
          </div>
        </div>
      </SwiperSlide>
      <div class="home-slider-pagination swiper-pagination" />
      <div class="home-slider-prev swiper-button-prev" />
      <div class="home-slider-next swiper-button-next" />
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { getApiBase } from '@/api/client'

export interface HomeSliderSlide {
  title: string
  description: string
  bgImageDesktop?: string | null
  bgImageMobile?: string | null
  buttons: { text: string; href: string }[]
}

defineProps<{
  slides: HomeSliderSlide[]
}>()

function toAbsoluteUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = getApiBase()
  if (base) return `${base}${path.startsWith('/') ? path : `/${path}`}`
  return path.startsWith('/') ? path : `/${path}`
}
</script>

<style scoped>
.home-slider :deep(.swiper-button-prev),
.home-slider :deep(.swiper-button-next) {
  color: white;
}
.home-slider :deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.6;
}
.home-slider :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
}
</style>
