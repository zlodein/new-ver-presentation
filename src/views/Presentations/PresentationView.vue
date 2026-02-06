<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <span class="text-gray-500">Загрузка...</span>
    </div>
    <div v-else-if="error" class="flex min-h-screen items-center justify-center p-4">
      <p class="text-red-600">{{ error }}</p>
    </div>
    <div v-else class="presentation-slider-wrap booklet-view mx-auto w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900">
      <Swiper
        :space-between="0"
        :allow-touch-move="true"
        class="presentation-swiper h-full"
      >
        <SwiperSlide v-for="(slide, index) in visibleSlides" :key="index" class="booklet-page h-full w-full overflow-hidden">
          <div class="booklet-page__inner">
            <!-- Обложка -->
            <div v-if="slide.type === 'cover'" class="booklet-content booklet-main">
              <div class="booklet-main__wrap">
                <div class="booklet-main__img">
                  <img v-if="coverImageUrl(slide)" :src="coverImageUrl(slide)!" alt="">
                </div>
                <div class="booklet-main__content">
                  <div class="booklet-main__top" v-html="(slide.data?.title || 'ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ').toString().replace(/\n/g, '<br>')" />
                  <div class="booklet-main__center" v-html="(slide.data?.subtitle || '').toString().replace(/\n/g, '<br>')" />
                  <div class="booklet-main__bottom">
                    <p class="text-sm font-medium text-gray-600">{{ slide.data?.deal_type || 'Аренда' }}</p>
                    <p class="text-lg font-semibold text-gray-800">
                      {{ formatPrice(Number(slide.data?.price_value) || 0) }} {{ currencySymbol(slide.data?.currency) }}
                      <span v-if="slide.data?.deal_type === 'Аренда'" class="text-sm font-normal">/ месяц</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Остальные типы слайдов — заголовок + контент (упрощённо) -->
            <div v-else class="booklet-content booklet-info p-6 overflow-auto">
              <h2 class="booklet-info__title mb-4">{{ slide.data?.heading ?? slide.data?.title ?? slide.type }}</h2>
              <div v-if="slide.data?.text" class="booklet-info__text" v-html="String(slide.data.text).replace(/\n/g, '<br>')" />
              <div v-else-if="slide.data?.content" class="booklet-info__text" v-html="String(slide.data.content).replace(/\n/g, '<br>')" />
              <div v-else-if="slide.type === 'characteristics' && Array.isArray(slide.data?.items)" class="space-y-2">
                <div v-for="(item, i) in (slide.data.items as Array<{ label?: string; value?: string }>)" :key="i" class="flex justify-between border-b border-gray-200 pb-1">
                  <span class="text-gray-600">{{ item.label }}</span>
                  <span class="font-medium">{{ item.value }}</span>
                </div>
              </div>
              <div v-else-if="slide.type === 'location'" class="booklet-map__info">
                <p class="font-medium">{{ slide.data?.address }}</p>
                <LocationMap :lat="Number(slide.data?.lat)" :lng="Number(slide.data?.lng)" />
              </div>
              <div v-else-if="slide.type === 'contacts'" class="space-y-1 text-sm">
                <p>{{ slide.data?.phone }}</p>
                <p>{{ slide.data?.email }}</p>
                <p>{{ slide.data?.address }}</p>
              </div>
              <!-- Изображения по типам -->
              <div v-if="slide.type === 'image' && slide.data?.imageUrl" class="mt-4">
                <img :src="String(slide.data.imageUrl)" alt="" class="max-h-64 w-full object-cover rounded-lg">
              </div>
              <div v-else-if="slide.type === 'gallery' && Array.isArray(slide.data?.images)" class="mt-4 grid grid-cols-3 gap-2">
                <img v-for="(url, i) in (slide.data.images as string[]).slice(0, 3)" :key="i" :src="typeof url === 'string' ? url : (url as { url?: string })?.url" alt="" class="h-24 w-full object-cover rounded">
              </div>
              <div v-else-if="slide.type === 'grid' && Array.isArray(slide.data?.images)" class="mt-4 grid grid-cols-2 gap-2">
                <img v-for="(url, i) in (slide.data.images as string[]).slice(0, 4)" :key="i" :src="typeof url === 'string' ? url : (url as { url?: string })?.url" alt="" class="h-32 w-full object-cover rounded">
              </div>
              <div v-else-if="slide.type === 'layout' && slide.data?.layoutImageUrl" class="mt-4">
                <img :src="String(slide.data.layoutImageUrl)" alt="" class="max-h-64 w-full object-contain rounded-lg">
              </div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import '@/assets/booklet-slides.css'
import LocationMap from '@/components/presentations/LocationMap.vue'
import { api, hasApi, getToken } from '@/api/client'

interface ViewSlideItem {
  type: string
  data?: Record<string, unknown>
  hidden?: boolean
}

const route = useRoute()
const loading = ref(true)
const error = ref('')
const presentation = ref<{ id: string; title: string; content: { slides: ViewSlideItem[] } } | null>(null)

/** Нормализуем слайды: поддерживаем и формат редактора { type, data }, и плоский из PHP { type, title, ... } */
const visibleSlides = computed<ViewSlideItem[]>(() => {
  const slides = presentation.value?.content?.slides
  if (!Array.isArray(slides)) return []
  return slides
    .map((s: Record<string, unknown>) => ({
      type: String(s.type ?? ''),
      data: (s.data as Record<string, unknown>) ?? s,
      hidden: Boolean(s.hidden),
    }))
    .filter((s) => !s.hidden)
})

function formatPrice(num: number): string {
  if (!num || num <= 0) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function currencySymbol(code: unknown): string {
  const map: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€', CNY: '¥', KZT: '₸' }
  return map[String(code || 'RUB')] ?? '₽'
}

/** Обложка: редактор хранит coverImageUrl, PHP — background_image */
function coverImageUrl(slide: ViewSlideItem): string | undefined {
  const url = slide.data?.coverImageUrl ?? slide.data?.background_image
  return url ? String(url) : undefined
}

onMounted(async () => {
  const hash = route.params.hash as string
  const id = route.params.id as string
  try {
    if (hash) {
      const data = await api.get<{ id: string; title: string; content: { slides: ViewSlideItem[] } }>(`/api/presentations/public/${hash}`)
      presentation.value = data
    } else if (id && hasApi() && getToken()) {
      const data = await api.get<{ id: string; title: string; content: { slides: ViewSlideItem[] } }>(`/api/presentations/${id}`)
      presentation.value = data
    } else {
      error.value = 'Презентация не найдена'
    }
  } catch {
    error.value = 'Презентация не найдена'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.presentation-slider-wrap {
  aspect-ratio: 4 / 3;
  max-height: min(90vh, 720px);
  width: 100%;
}
.presentation-swiper {
  height: 100%;
}
.presentation-swiper :deep(.swiper-slide) {
  height: 100%;
}
</style>
