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
            <!-- 2. Описание (с блоком текста и сеткой 2 фото) -->
            <div v-else-if="slide.type === 'description'" class="booklet-content booklet-info">
              <div class="booklet-info__top-square" />
              <div class="booklet-info__bottom-square" />
              <div class="booklet-info__wrap">
                <div class="booklet-info__block booklet-info__content">
                  <h2 class="booklet-info__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ОПИСАНИЕ' }}</h2>
                  <div v-if="slide.data?.text || slide.data?.content" class="booklet-info__text" v-html="String(slide.data?.text ?? slide.data?.content ?? '').replace(/\n/g, '<br>')" />
                </div>
                <div class="booklet-info__grid">
                  <div v-for="(url, i) in viewSlideImages(slide, 2)" :key="i" class="booklet-info__block booklet-info__img">
                    <img v-if="url" :src="url" alt="">
                  </div>
                </div>
              </div>
            </div>
            <!-- 3. Инфраструктура -->
            <div v-else-if="slide.type === 'infrastructure'" class="booklet-content booklet-stroen">
              <div class="booklet-stroen__top-square" />
              <div class="booklet-stroen__bottom-square" />
              <div class="booklet-stroen__wrap">
                <div class="booklet-stroen__block booklet-stroen__content">
                  <h2 class="booklet-stroen__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ИНФРАСТРУКТУРА' }}</h2>
                  <div v-if="slide.data?.content || slide.data?.text" class="booklet-stroen__text" v-html="String(slide.data?.content ?? slide.data?.text ?? '').replace(/\n/g, '<br>')" />
                </div>
                <div class="booklet-stroen__grid">
                  <div v-for="(url, i) in viewSlideImages(slide, 2)" :key="i" class="booklet-stroen__block booklet-stroen__img">
                    <img v-if="url" :src="url" alt="">
                  </div>
                </div>
              </div>
            </div>
            <!-- 4. Местоположение -->
            <div v-else-if="slide.type === 'location'" class="booklet-content booklet-map overflow-visible">
              <div class="booklet-map__wrap">
                <h2 class="booklet-map__title">{{ slide.data?.heading ?? slide.data?.title ?? 'МЕСТОПОЛОЖЕНИЕ' }}</h2>
                <div class="booklet-map__img">
                  <LocationMap :lat="Number(slide.data?.lat)" :lng="Number(slide.data?.lng)" />
                </div>
                <div class="booklet-map__content">
                  <div class="booklet-map__top-square" />
                  <div class="booklet-map__bottom-square" />
                  <div class="booklet-map__info">
                    <p class="font-medium">{{ slide.data?.address ?? slide.data?.location_address }}</p>
                    <div v-if="(slide.data?.metro_stations as Array<unknown>)?.length" class="mt-2 text-sm text-gray-600">
                      <p class="font-medium text-gray-500">Ближайшие станции метро</p>
                      <ul class="mt-1 space-y-0.5">
                        <li v-for="(st, idx) in (slide.data.metro_stations as Array<{ name?: string; walk_time_text?: string }>)" :key="idx">
                          {{ st.name }}{{ st.walk_time_text ? ` — ${st.walk_time_text}` : '' }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 5. Изображение -->
            <div v-else-if="slide.type === 'image'" class="booklet-content booklet-img">
              <div class="booklet-img__top-square" />
              <div class="booklet-img__bottom-square" />
              <div class="booklet-img__wrap">
                <div v-if="slide.data?.imageUrl" class="booklet-img__img">
                  <img :src="String(slide.data.imageUrl)" alt="">
                </div>
              </div>
            </div>
            <!-- 6. Галерея 3 фото -->
            <div v-else-if="slide.type === 'gallery'" class="booklet-content booklet-galery">
              <div class="booklet-galery__top-square" />
              <div class="booklet-galery__bottom-square" />
              <div class="booklet-galery__wrap">
                <div v-for="(url, i) in viewSlideImages(slide, 3)" :key="i" class="booklet-galery__img">
                  <img v-if="url" :src="url" alt="">
                </div>
              </div>
            </div>
            <!-- 7. Характеристики -->
            <div v-else-if="slide.type === 'characteristics'" class="booklet-content booklet-char">
              <div class="booklet-char__wrap">
                <h2 class="booklet-char__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ХАРАКТЕРИСТИКИ' }}</h2>
                <div v-if="slide.data?.charImageUrl || slide.data?.image" class="booklet-char__img">
                  <div class="booklet-char__top-square" />
                  <div class="booklet-char__bottom-square" />
                  <img :src="String(slide.data?.charImageUrl ?? slide.data?.image)" alt="">
                </div>
                <div class="booklet-char__content">
                  <div v-if="Array.isArray(slide.data?.items)" class="booklet-char__table">
                    <div v-for="(item, i) in (slide.data.items as Array<{ label?: string; value?: string }>)" :key="i" class="booklet-char__row">
                      <div class="booklet-char__item text-gray-600">{{ item.label }}</div>
                      <div class="booklet-char__item font-medium">{{ item.value }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 8. Планировка -->
            <div v-else-if="slide.type === 'layout'" class="booklet-content booklet-layout">
              <div class="booklet-layout__wrap">
                <h2 class="booklet-layout__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ПЛАНИРОВКА' }}</h2>
                <div v-if="slide.data?.layoutImageUrl || slide.data?.image" class="booklet-layout__img">
                  <img :src="String(slide.data?.layoutImageUrl ?? slide.data?.image)" alt="">
                </div>
              </div>
            </div>
            <!-- 9. Сетка 4 фото -->
            <div v-else-if="slide.type === 'grid'" class="booklet-content booklet-grid">
              <div class="booklet-grid__top-square" />
              <div class="booklet-grid__bottom-square" />
              <div class="booklet-grid__wrap">
                <div v-for="(url, i) in viewSlideImages(slide, 4)" :key="i" class="booklet-grid__img">
                  <img v-if="url" :src="url" alt="">
                </div>
              </div>
            </div>
            <!-- 10. Контакты -->
            <div v-else-if="slide.type === 'contacts'" class="booklet-content booklet-contacts">
              <div class="booklet-contacts__wrap">
                <div class="booklet-contacts__block booklet-contacts__content">
                  <h2 class="mb-2 text-base font-semibold uppercase">{{ slide.data?.heading ?? slide.data?.contact_title ?? 'КОНТАКТЫ' }}</h2>
                  <p>{{ slide.data?.contact_name ?? slide.data?.phone }}</p>
                  <p>{{ slide.data?.phone ?? slide.data?.contact_phone }}</p>
                  <p>{{ slide.data?.email }}</p>
                  <p>{{ slide.data?.address ?? slide.data?.contact_address }}</p>
                </div>
                <div class="booklet-contacts__images-wrap">
                  <div class="booklet-contacts__top-square" />
                  <div class="booklet-contacts__bottom-square" />
                  <div class="booklet-contacts-grid">
                    <div v-for="(url, i) in viewSlideImages(slide, 2)" :key="i" class="booklet-contacts__block booklet-contacts__img">
                      <img v-if="url" :src="url" alt="">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Fallback: features и др. — упрощённо -->
            <div v-else class="booklet-content booklet-info p-6 overflow-auto">
              <h2 class="booklet-info__title mb-4">{{ slide.data?.heading ?? slide.data?.title ?? slide.type }}</h2>
              <div v-if="slide.data?.text" class="booklet-info__text" v-html="String(slide.data.text).replace(/\n/g, '<br>')" />
              <div v-else-if="slide.data?.content" class="booklet-info__text" v-html="String(slide.data.content).replace(/\n/g, '<br>')" />
              <div v-else-if="Array.isArray(slide.data?.items)" class="space-y-2">
                <div v-for="(item, i) in (slide.data.items as Array<{ text?: string; label?: string; value?: string }>)" :key="i" class="flex justify-between border-b border-gray-200 pb-1">
                  <span class="text-gray-600">{{ item.text ?? item.label }}</span>
                  <span v-if="item.value" class="font-medium">{{ item.value }}</span>
                </div>
              </div>
              <div v-if="Array.isArray(slide.data?.images) && (slide.data.images as unknown[]).length" class="mt-4 grid grid-cols-2 gap-2">
                <img v-for="(url, i) in viewSlideImages(slide, 4)" :key="i" :src="url" alt="" class="h-24 w-full object-cover rounded" v-show="url">
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

/** Нормализуем слайды: поддерживаем формат редактора { type, data }, плоский PHP { type, title, ... }, и определяем "заполненность" */
function normalizeSlideData(raw: Record<string, unknown>): Record<string, unknown> {
  const d = (raw.data as Record<string, unknown>) ?? raw
  const flat = d as Record<string, unknown>
  return {
    ...flat,
    coverImageUrl: flat.coverImageUrl ?? flat.background_image,
    title: flat.title ?? flat.heading,
    heading: flat.heading ?? flat.title,
    text: flat.text ?? flat.content,
    content: flat.content ?? flat.text,
    address: flat.address ?? flat.location_address,
    lat: flat.lat ?? flat.location_lat,
    lng: flat.lng ?? flat.location_lng,
    imageUrl: flat.imageUrl ?? flat.image,
    layoutImageUrl: flat.layoutImageUrl ?? flat.image,
    charImageUrl: flat.charImageUrl ?? flat.image,
    contactsImageUrl: flat.contactsImageUrl ?? (Array.isArray(flat.images) ? (flat.images as unknown[])[0] : undefined),
    images: flat.images ?? [],
  }
}

const visibleSlides = computed<ViewSlideItem[]>(() => {
  const slides = presentation.value?.content?.slides
  if (!Array.isArray(slides)) return []
  return slides
    .map((s: Record<string, unknown>) => {
      const type = String(s.type ?? '')
      const data = normalizeSlideData(s)
      const hidden = Boolean(s.hidden ?? (s.data as Record<string, unknown>)?.hidden)
      return { type, data, hidden } as ViewSlideItem
    })
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

/** Извлечь URL изображений из слайда (поддержка строк и { url }), limit — максимум штук */
function viewSlideImages(slide: ViewSlideItem, limit: number): string[] {
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return []
  const out: string[] = []
  for (let i = 0; i < Math.min(limit, arr.length); i++) {
    const v = arr[i]
    const u = typeof v === 'string' ? v : (v as { url?: string })?.url
    if (u) out.push(String(u))
    else out.push('')
  }
  while (out.length < limit) out.push('')
  return out.slice(0, limit)
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
