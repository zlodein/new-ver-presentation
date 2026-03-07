<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <span class="text-gray-500">Загрузка...</span>
    </div>
    <div v-else-if="error" class="flex min-h-screen items-center justify-center p-4">
      <p class="text-red-600">{{ error }}</p>
    </div>
    <div
      v-else
      class="w-full pt-0 px-4 pb-20 md:mx-auto md:max-w-(--breakpoint-2xl) md:pt-0 md:px-6 md:pb-6"
    >
      <!-- Навигационная шапка по блокам (та же ширина, что и контент) -->
      <div
        v-if="visibleSlides.length"
        class="sticky top-0 z-10 mx-auto w-[1123px] max-w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
      >
        <nav class="flex flex-wrap items-center justify-center gap-2 px-4 py-2">
          <a
            v-for="(slide, index) in visibleSlides"
            :key="index"
            :href="'#block-' + index"
            class="rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            @click.prevent="goToBlock(index)"
          >
            {{ getBlockName(slide, index) }}
          </a>
        </nav>
      </div>
      <div
        class="presentation-view-fixed presentation-view-wrap presentation-slider-wrap booklet-view mx-auto w-[1123px] max-w-full rounded-xl bg-white shadow-lg dark:bg-gray-900"
        :style="presentationStyle"
        :data-image-frame="(presentation?.content?.settings as Record<string, string> | undefined)?.imageFrame ?? 'none'"
      >
      <div
        v-for="(slide, index) in visibleSlides"
        :key="index"
        :id="'block-' + index"
        class="booklet-page booklet-page--stacked"
      >
        <div class="booklet-page__inner">
          <div class="booklet-scale-root w-full h-full">
            <!-- Обложка -->
            <div v-if="slide.type === 'cover'" class="booklet-content booklet-main">
              <div class="booklet-main__wrap">
                <div class="booklet-main__img">
                  <img
                    v-if="coverImageUrl(slide)"
                    :src="coverImageUrl(slide)!"
                    alt=""
                    class="cursor-pointer"
                    @click="openGallery(getGalleryGlobalIndex(index, 0))"
                  >
                </div>
                <div class="booklet-main__content">
                  <div v-if="(slide.data?.title || '').toString().trim()" class="booklet-main__top" v-html="(slide.data?.title || '').toString().trim().replace(/\n/g, '<br>')" />
                  <div v-if="(slide.data?.subtitle || '').toString().trim()" class="booklet-main__center" v-html="(slide.data?.subtitle || '').toString().trim().replace(/\n/g, '<br>')" />
                  <div class="booklet-main__bottom booklet-main__bottom--view text-right">
                    <div class="booklet-main__deal-type booklet-main__bottom-line">{{ slide.data?.deal_type || 'Аренда' }}</div>
                    <div class="booklet-main__price booklet-main__bottom-line font-semibold text-gray-800">
                      {{ formatPrice(Number(slide.data?.price_value) || 0) }}
                      {{ currencySymbol(slide.data?.currency) }}
                      <span v-if="slide.data?.deal_type === 'Аренда'" class="booklet-main__price-suffix font-normal">/ месяц</span>
                    </div>
                    <div v-if="slide.data?.show_all_currencies" class="booklet-main__bottom-line booklet-main__currencies-grid mt-2 inline-grid grid-cols-2 gap-x-4 gap-y-1 justify-items-end text-sm text-gray-600">
                      <span v-for="line in coverConvertedPrices(slide)" :key="line" v-text="line" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 2. Описание (с блоком текста и сеткой 2 фото) -->
            <div v-else-if="slide.type === 'description'" class="booklet-content booklet-info">
              <div class="booklet-info__wrap" :data-block-layout="getBlockLayout(slide)">
                <div class="booklet-info__block booklet-info__content">
                  <h2 class="booklet-info__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ОПИСАНИЕ' }}</h2>
                  <div v-if="slide.data?.text || slide.data?.content" class="booklet-info__text booklet-info__text--formatted" v-html="formatDescriptionHtml(String(slide.data?.text ?? slide.data?.content ?? ''))" />
                </div>
                <div class="booklet-info__grid image-grid-bound" :data-image-grid="getEffectiveImageGrid(slide)">
                  <div v-for="(url, i) in viewSlideImages(slide, getEffectiveViewImageLimit(slide))" :key="i" class="booklet-info__block booklet-info__img">
                    <img v-if="url" :src="url" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, i))">
                  </div>
                </div>
              </div>
            </div>
            <!-- 3. Инфраструктура -->
            <div v-else-if="slide.type === 'infrastructure'" class="booklet-content booklet-stroen">
              <div class="booklet-stroen__wrap" :data-block-layout="getBlockLayout(slide)">
                <div class="booklet-stroen__block booklet-stroen__content">
                  <h2 class="booklet-stroen__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ИНФРАСТРУКТУРА' }}</h2>
                  <div v-if="slide.data?.content || slide.data?.text" class="booklet-stroen__text booklet-info__text--formatted" v-html="formatDescriptionHtml(String(slide.data?.content ?? slide.data?.text ?? ''))" />
                </div>
                <div class="booklet-stroen__grid image-grid-bound" :data-image-grid="getEffectiveImageGrid(slide)">
                  <div v-for="(url, i) in viewSlideImages(slide, getEffectiveViewImageLimit(slide))" :key="i" class="booklet-stroen__block booklet-stroen__img">
                    <img v-if="url" :src="url" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, i))">
                  </div>
                </div>
              </div>
            </div>
            <!-- 4. Местоположение: слева карта (__left), справа адрес/метро + фото (__content) -->
            <div v-else-if="slide.type === 'location'" class="booklet-content booklet-map overflow-visible">
              <div class="booklet-map__wrap">
                <h2 class="booklet-map__title">{{ slide.data?.heading ?? slide.data?.title ?? 'МЕСТОПОЛОЖЕНИЕ' }}</h2>
                <div class="booklet-map__left">
                  <div class="booklet-map__img">
                    <LocationMap :lat="Number(slide.data?.lat)" :lng="Number(slide.data?.lng)" />
                  </div>
                </div>
                <div class="booklet-map__content">
                  <div class="booklet-map__info">
                    <p v-if="slide.data?.location_name" class="font-medium">{{ slide.data.location_name }}</p>
                    <p class="font-medium">{{ slide.data?.address ?? slide.data?.location_address }}</p>
                    <div v-if="(slide.data?.metro_stations as Array<unknown>)?.length" class="booklet-map__metro-block mt-2">
                      <p class="booklet-map__metro-label font-medium">Ближайшие станции метро</p>
                      <ul class="booklet-map__metro-list mt-1 space-y-0.5">
                        <li v-for="(st, idx) in (slide.data?.metro_stations as Array<{ name?: string; walk_time_text?: string }>)" :key="idx" class="flex items-center gap-2">
                          <span
                            class="h-2.5 w-2.5 shrink-0 rounded-full"
                            :style="{ backgroundColor: metroLineColor(st.name) }"
                          />
                          <span>{{ st.name }}{{ st.walk_time_text ? ` — ${st.walk_time_text}` : '' }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="booklet-map__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                    <div v-for="(url, i) in viewSlideImages(slide, getViewImageLimit(slide))" :key="i" class="booklet-map__grid-img">
                      <img v-if="url" :src="url" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, i))">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 5. Изображение: 100% по ширине и высоте -->
            <div v-else-if="slide.type === 'image'" class="booklet-content booklet-img">
              <div class="booklet-img__wrap">
                <h2 v-if="slide.data?.heading ?? slide.data?.title" class="booklet-img__title mb-2">{{ slide.data?.heading ?? slide.data?.title }}</h2>
                <div v-if="slide.data?.imageUrl ?? slide.data?.image" class="booklet-img__img">
                  <img :src="String(slide.data?.imageUrl ?? slide.data?.image)" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, 0))">
                </div>
              </div>
            </div>
            <!-- 6. Галерея 3 фото -->
            <div v-else-if="slide.type === 'gallery'" class="booklet-content booklet-galery">
              <div class="booklet-galery__wrap">
                <h2 class="booklet-galery__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ГАЛЕРЕЯ' }}</h2>
                <div class="booklet-galery__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                  <div v-for="(url, i) in viewSlideImages(slide, getViewImageLimit(slide))" :key="i" class="booklet-galery__img">
                    <img v-if="url" :src="url" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, i))">
                  </div>
                </div>
              </div>
            </div>
            <!-- 7. Характеристики -->
            <div v-else-if="slide.type === 'characteristics'" class="booklet-content booklet-char">
              <div class="booklet-char__wrap">
                <h2 class="booklet-char__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ХАРАКТЕРИСТИКИ' }}</h2>
                <div v-if="slide.data?.charImageUrl || slide.data?.image" class="booklet-char__img">
                  <img :src="String(slide.data?.charImageUrl ?? slide.data?.image)" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, 0))">
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
            <!-- 8. Планировка: сетка изображений -->
            <div v-else-if="slide.type === 'layout'" class="booklet-content booklet-layout">
              <div class="booklet-layout__wrap">
                <h2 class="booklet-layout__title">{{ slide.data?.heading ?? slide.data?.title ?? 'ПЛАНИРОВКА' }}</h2>
                <div class="booklet-layout__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                  <div v-for="(url, i) in viewLayoutImages(slide)" :key="i" class="booklet-layout__img">
                    <img v-if="url" :src="url" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, i))">
                  </div>
                </div>
              </div>
            </div>
            <!-- 9. Контакты: лого/аватар слева по центру, справа ФИО и телефон; соцсети, email, адрес, доп. текст, сайт. Пустые поля не выводим. -->
            <div v-else-if="slide.type === 'contacts'" class="booklet-content booklet-contacts">
              <div class="booklet-contacts__wrap">
                <div class="booklet-contacts__left flex flex-col gap-4">
                  <h2 class="booklet-contacts__title mb-0">{{ slide.data?.heading ?? slide.data?.contact_title ?? 'Контакты' }}</h2>
                  <div v-if="resolveImageUrl(contactsAvatarOrLogoUrl(slide)) || (slide.data?.contactName ?? slide.data?.contact_name) || (slide.data?.phone ?? slide.data?.contact_phone)" class="booklet-contacts__top row flex items-start gap-4">
                    <div v-if="resolveImageUrl(contactsAvatarOrLogoUrl(slide))" class="booklet-contacts__avatar-wrap shrink-0 flex justify-center">
                      <div class="booklet-contacts__avatar flex h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                        <img :src="resolveImageUrl(contactsAvatarOrLogoUrl(slide))" alt="" class="h-full w-full object-cover">
                      </div>
                    </div>
                    <div class="booklet-contacts__name-phone min-w-0 flex-1 flex flex-col gap-1">
                      <h4 v-if="slide.data?.contactName ?? slide.data?.contact_name" class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ slide.data?.contactName ?? slide.data?.contact_name }}</h4>
                      <p v-if="slide.data?.phone ?? slide.data?.contact_phone" class="text-gray-700 dark:text-gray-300">{{ slide.data?.phone ?? slide.data?.contact_phone }}</p>
                    </div>
                  </div>
                  <div v-if="slide.data?.messengers && typeof slide.data.messengers === 'object' && Object.keys(slide.data.messengers as object).length" class="booklet-contacts__messengers w-full">
                    <MessengerIcons :messengers="(slide.data.messengers as Record<string, string>) || undefined" compact />
                  </div>
                  <div v-if="(slide.data?.email ?? slide.data?.contact_email)" class="booklet-contacts__block booklet-contacts__content w-full">
                    <p>{{ slide.data?.email ?? slide.data?.contact_email }}</p>
                  </div>
                  <div v-if="(slide.data?.address ?? slide.data?.contact_address)" class="booklet-contacts__block booklet-contacts__content w-full">
                    <p>{{ slide.data?.address ?? slide.data?.contact_address }}</p>
                  </div>
                  <div v-if="aboutText(slide)" class="booklet-contacts__block w-full">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">О себе / о компании</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ aboutText(slide) }}</p>
                  </div>
                  <div v-if="slide.data?.websiteUrl && String(slide.data.websiteUrl).trim()" class="booklet-contacts__block w-full">
                    <a :href="String(slide.data.websiteUrl).trim()" target="_blank" rel="noopener noreferrer" class="text-brand-600 hover:underline dark:text-brand-400">{{ slide.data.websiteUrl }}</a>
                  </div>
                </div>
                <div v-if="contactImageUrl(slide)" class="booklet-contacts__block booklet-contacts__img">
                  <img :src="resolveImageUrl(contactImageUrl(slide))" alt="" class="cursor-pointer" @click="openGallery(getGalleryGlobalIndex(index, 0))">
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
                <img v-for="(url, i) in viewSlideImages(slide, 4)" :key="i" :src="url" alt="" class="h-24 w-full cursor-pointer object-cover rounded" v-show="url" @click="url && openGallery(getGalleryGlobalIndex(index, i))">
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      <!-- Галерея изображений по клику -->
      <Teleport to="body">
        <div
          v-if="galleryOpen && allImageUrls.length"
          class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4"
          @click.self="galleryOpen = false"
        >
          <button type="button" class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 disabled:opacity-30" :disabled="galleryIndex <= 0" aria-label="Предыдущее" @click.stop="galleryPrev">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <img :src="allImageUrls[galleryIndex]" alt="" class="max-h-full max-w-full object-contain" @click.stop>
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 disabled:opacity-30" :disabled="galleryIndex >= allImageUrls.length - 1" aria-label="Следующее" @click.stop="galleryNext">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button type="button" class="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" aria-label="Закрыть" @click.stop="galleryOpen = false">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <span class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-3 py-1 text-sm text-white">{{ galleryIndex + 1 }} / {{ allImageUrls.length }}</span>
        </div>
      </Teleport>
      <!-- Подвал: копирайт и ссылки (режим просмотра и публичная ссылка) -->
      <footer class="mt-6 border-t border-gray-200 py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <p class="mb-2">© 2026 E-Presentation. Все права защищены.</p>
        <p class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href="/privacy" class="hover:text-gray-700 dark:hover:text-gray-300">Политика конфиденциальности</a>
          <a href="/terms" class="hover:text-gray-700 dark:hover:text-gray-300">Правила и условия</a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import '@/assets/booklet-slides.css'
import LocationMap from '@/components/presentations/LocationMap.vue'
import MessengerIcons from '@/components/profile/MessengerIcons.vue'
import { api, hasApi, getToken, getApiBase } from '@/api/client'
import { metroLineColor } from '@/data/metroLineColors'
interface ViewSlideItem {
  type: string
  data?: Record<string, unknown>
  hidden?: boolean
}

const route = useRoute()
const loading = ref(true)
const error = ref('')
const presentation = ref<{
  id: string
  title: string
  coverImage?: string
  content: { slides: ViewSlideItem[]; settings?: { fontFamily?: string; imageBorderRadius?: string; imageFrame?: string } }
} | null>(null)

/** Стили отображения (шрифт, скругления, размеры шрифтов) из настроек презентации */
const presentationStyle = computed<Record<string, string>>(() => {
  const s = presentation.value?.content?.settings as Record<string, string> | undefined
  if (!s) return {}
  return {
    ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
    ...(s.imageBorderRadius != null ? { '--booklet-image-radius': s.imageBorderRadius } : {}),
    ...(s.themeColor ? { '--theme-color': s.themeColor } : {}),
    ...(s.fontSizePresentationTitle != null ? { '--booklet-font-size-presentation-title': s.fontSizePresentationTitle } : {}),
    ...(s.fontSizeHeading != null ? { '--booklet-font-size-heading': s.fontSizeHeading } : {}),
    ...(s.fontSizeText != null ? { '--booklet-font-size-text': s.fontSizeText } : {}),
    ...(s.fontSizePrice != null ? { '--booklet-font-size-price': s.fontSizePrice } : {}),
  }
})

/** Размер шрифта для строки «тип сделки и цена» — задаём инлайном, чтобы гарантированно перекрыть другие стили */
const priceLineStyle = computed<{ fontSize: string } | undefined>(() => {
  const size = (presentation.value?.content?.settings as Record<string, string> | undefined)?.fontSizePrice
  return size ? { fontSize: size } : undefined
})

/** Нормализуем слайды: сохраняем все поля, добавляем алиасы для совместимости редактора и PHP */
function normalizeSlideData(raw: Record<string, unknown>, type: string, topCoverImage?: string): Record<string, unknown> {
  const d = (raw.data as Record<string, unknown>) ?? raw
  const flat = { ...(d as Record<string, unknown>) }
  const out: Record<string, unknown> = { ...flat }
  if (out.coverImageUrl == null && flat.background_image != null) out.coverImageUrl = flat.background_image
  if (out.coverImageUrl == null && out.background_image == null && type === 'cover' && topCoverImage) out.coverImageUrl = topCoverImage
  if (out.background_image == null && flat.coverImageUrl != null) out.background_image = flat.coverImageUrl
  if (out.title == null && flat.heading != null) out.title = flat.heading
  if (out.heading == null && flat.title != null) out.heading = flat.title
  if (out.text == null && flat.content != null) out.text = flat.content
  if (out.content == null && flat.text != null) out.content = flat.text
  if (out.address == null && flat.location_address != null) out.address = flat.location_address
  if (out.location_address == null && flat.address != null) out.location_address = flat.address
  if (out.lat == null && flat.location_lat != null) out.lat = flat.location_lat
  if (out.lng == null && flat.location_lng != null) out.lng = flat.location_lng
  if (out.imageUrl == null && flat.image != null) out.imageUrl = flat.image
  if (out.image == null && flat.imageUrl != null) out.image = flat.imageUrl
  if (out.layoutImageUrl == null && flat.image != null && type === 'layout') out.layoutImageUrl = flat.image
  if (out.charImageUrl == null && flat.image != null && type === 'characteristics') out.charImageUrl = flat.image
  const contactImg = flat.contactsImageUrl ?? (Array.isArray(flat.images) ? (flat.images as unknown[])[0] : undefined)
  if (out.contactsImageUrl == null && contactImg != null) out.contactsImageUrl = contactImg
  const imgs = Array.isArray(flat.images) ? flat.images : []
  if (imgs.length === 0 && (flat.contactsImageUrl ?? flat.image) != null && type === 'contacts') {
    out.images = [flat.contactsImageUrl ?? flat.image]
  } else if (out.images == null || (Array.isArray(out.images) && out.images.length === 0 && imgs.length > 0)) {
    out.images = imgs
  }
  if (out.phone == null && flat.contact_phone != null) out.phone = flat.contact_phone
  if (out.contact_phone == null && flat.phone != null) out.contact_phone = flat.phone
  if (out.email == null && flat.contact_email != null) out.email = flat.contact_email
  if (out.contact_email == null && flat.email != null) out.contact_email = flat.email
  if (out.contact_name == null && flat.contact_title != null) out.contact_name = flat.contact_title
  if (out.imageGrid == null && flat.image_grid != null) out.imageGrid = flat.image_grid
  if (out.blockLayout == null && flat.block_layout != null) out.blockLayout = flat.block_layout
  return out
}

const visibleSlides = computed<ViewSlideItem[]>(() => {
  const slides = presentation.value?.content?.slides
  const topCoverImage = presentation.value?.coverImage
  if (!Array.isArray(slides)) return []
  return slides
    .map((s: Record<string, unknown>) => {
      const type = String(s.type ?? '')
      const data = normalizeSlideData(s, type, topCoverImage)
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

const EXCHANGE_RATES: Record<string, number> = {
  RUB: 1,
  USD: 0.011,
  EUR: 0.01,
  CNY: 0.078,
  KZT: 4.9,
}

function coverConvertedPrices(slide: ViewSlideItem): string[] {
  const price = Number(slide.data?.price_value) || 0
  const baseCurrency = String(slide.data?.currency || 'RUB')
  const baseRate = EXCHANGE_RATES[baseCurrency] ?? 1
  if (!price || baseRate <= 0) return []
  const CURRENCIES = [
    { code: 'RUB', symbol: '₽' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'CNY', symbol: '¥' },
    { code: 'KZT', symbol: '₸' },
  ]
  return CURRENCIES.filter((c) => c.code !== baseCurrency).map((c) => {
    const rate = EXCHANGE_RATES[c.code] ?? 1
    const priceInRUB = price / baseRate
    const converted = Math.round(priceInRUB * rate)
    return `${c.symbol} ${formatPrice(converted)}`
  })
}

/** Название блока для навигации: первый пункт всегда «Обложка», остальные — из заголовка слайда или тип по умолчанию */
function getBlockName(slide: ViewSlideItem, index: number): string {
  if (index === 0) return 'Обложка'
  const byType: Record<string, string> = {
    cover: 'Обложка',
    description: 'Описание',
    infrastructure: 'Инфраструктура',
    location: 'Местоположение',
    image: 'Изображение',
    gallery: 'Галерея',
    characteristics: 'Характеристики',
    layout: 'Планировка',
    contacts: 'Контакты',
  }
  const heading = slide.data?.heading ?? slide.data?.title ?? slide.data?.contact_title
  if (heading && String(heading).trim()) return String(heading).trim()
  return byType[slide.type] ?? (slide.type || String(index + 1))
}

/** Обложка: редактор хранит coverImageUrl, PHP — background_image */
function coverImageUrl(slide: ViewSlideItem): string | undefined {
  const url = slide.data?.coverImageUrl ?? slide.data?.background_image
  return url ? String(url) : undefined
}

const DEFAULT_IMAGE_GRID_BY_TYPE: Record<string, string> = {
  description: '1x2',
  infrastructure: '1x2',
  gallery: '3x1',
  layout: '1x1',
  location: '1x2',
  contacts: '1x2',
}

function getImageGrid(slide: ViewSlideItem): string {
  const v = slide.data?.imageGrid
  if (typeof v === 'string' && v) return v
  return DEFAULT_IMAGE_GRID_BY_TYPE[slide.type] ?? '2x2'
}

const BLOCK_LAYOUT_VALUES = ['text-left', 'text-right', 'text-top', 'text-bottom'] as const
function getBlockLayout(slide: ViewSlideItem): string {
  const v = slide.data?.blockLayout
  if (typeof v === 'string' && BLOCK_LAYOUT_VALUES.includes(v as (typeof BLOCK_LAYOUT_VALUES)[number])) return v
  return 'text-left'
}

/** Количество слотов по сетке (cols×rows) */
function getViewImageLimit(slide: ViewSlideItem): number {
  const grid = getImageGrid(slide)
  const [c, r] = grid.split('x').map(Number)
  return (c || 2) * (r || 2)
}

/** Для инфраструктуры/описания: если выбрана сетка 1x2, но заполнено только одно изображение — показываем один блок (1x1), без пустого слота */
function getEffectiveImageGrid(slide: ViewSlideItem): string {
  const grid = getImageGrid(slide)
  if (slide.type !== 'infrastructure' && slide.type !== 'description') return grid
  if (grid !== '1x2') return grid
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return grid
  const filled = arr.filter((v) => {
    const u = typeof v === 'string' ? v : (v as { url?: string })?.url
    return u && String(u).trim()
  })
  return filled.length <= 1 ? '1x1' : grid
}

function getEffectiveViewImageLimit(slide: ViewSlideItem): number {
  const grid = getEffectiveImageGrid(slide)
  const [c, r] = grid.split('x').map(Number)
  return (c || 1) * (r || 1)
}

/** Текст описания/инфраструктуры: абзацы (\n\n) в HTML для просмотра и PDF */
function formatDescriptionHtml(text: string): string {
  if (!text || !String(text).trim()) return ''
  const raw = String(text)
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const paragraphs = raw.split(/\n\n+/)
  return paragraphs
    .map((p) => {
      const escaped = escape(p.trim())
      const withBr = escaped.replace(/\n/g, '<br>')
      return `<p class="booklet-info__paragraph">${withBr}</p>`
    })
    .join('')
}

/** Текст «О компании» / «Обо мне» (aboutText или about_text из API) */
function aboutText(slide: ViewSlideItem): string {
  const v = slide.data?.aboutText ?? slide.data?.about_text
  return v != null ? String(v).trim() : ''
}

/** Контакты: одно изображение справа (contactImageUrl или images[0]) */
function contactImageUrl(slide: ViewSlideItem): string | undefined {
  const url = slide.data?.contactImageUrl
  if (url) return String(url)
  const images = slide.data?.images
  if (Array.isArray(images) && images[0]) return String(images[0])
  return undefined
}

/** Значение avatarUrl или logoUrl из слайда контактов (тип для resolveImageUrl) */
function contactsAvatarOrLogoUrl(slide: ViewSlideItem): string | null | undefined {
  const v = slide.data?.avatarUrl ?? slide.data?.logoUrl
  if (v == null) return undefined
  return typeof v === 'string' ? v : String(v)
}

/** URL для отображения изображения: относительные пути дополняются базовым URL API при необходимости */
function resolveImageUrl(url: string | null | undefined): string {
  if (!url || !String(url).trim()) return ''
  const s = String(url).trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  const base = getApiBase()
  const path = s.startsWith('/') ? s : `/${s}`
  return base ? `${base.replace(/\/$/, '')}${path}` : path
}

/** Изображения планировки: images[] или обратная совместимость с layoutImageUrl */
function viewLayoutImages(slide: ViewSlideItem): string[] {
  const limit = getViewImageLimit(slide)
  const arr = slide.data?.images
  if (Array.isArray(arr)) {
    const out: string[] = []
    for (let i = 0; i < limit; i++) {
      const v = arr[i]
      const u = typeof v === 'string' ? v : (v as { url?: string })?.url
      out.push(u ? String(u) : '')
    }
    return out.slice(0, limit)
  }
  const single = slide.data?.layoutImageUrl ?? slide.data?.image
  if (single) {
    const out = [String(single)]
    while (out.length < limit) out.push('')
    return out.slice(0, limit)
  }
  return Array(limit).fill('')
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

/** URL всех изображений презентации по порядку слайдов (для галереи по клику) */
function getSlideImageUrls(slide: ViewSlideItem): string[] {
  switch (slide.type) {
    case 'cover': {
      const u = coverImageUrl(slide)
      return u ? [u] : []
    }
    case 'description':
    case 'infrastructure':
    case 'location':
    case 'gallery':
      return viewSlideImages(slide, getViewImageLimit(slide)).filter(Boolean)
    case 'image': {
      const u = slide.data?.imageUrl ?? slide.data?.image
      return u ? [String(u)] : []
    }
    case 'characteristics': {
      const u = slide.data?.charImageUrl ?? slide.data?.image
      return u ? [String(u)] : []
    }
    case 'layout':
      return viewLayoutImages(slide).filter(Boolean)
    case 'contacts': {
      const u = contactImageUrl(slide)
      return u ? [String(u)] : []
    }
    default:
      return viewSlideImages(slide, 4).filter(Boolean)
  }
}

const allImageUrls = computed<string[]>(() => {
  const slides = visibleSlides.value
  return slides.flatMap((s) => getSlideImageUrls(s))
})

/** Стартовый индекс в allImageUrls для каждого слайда (для галереи по клику) */
const galleryStartIndexBySlide = computed<number[]>(() => {
  const slides = visibleSlides.value
  const out: number[] = []
  let acc = 0
  for (let i = 0; i < slides.length; i++) {
    out.push(acc)
    acc += getSlideImageUrls(slides[i]).length
  }
  return out
})

function getGalleryGlobalIndex(slideIndex: number, imageIndexInSlide: number): number {
  const starts = galleryStartIndexBySlide.value
  return (starts[slideIndex] ?? 0) + imageIndexInSlide
}

/** Прокрутка к блоку по индексу: всегда через scrollIntoView (скроллится окно, т.к. контейнер без max-height) */
function goToBlock(index: number) {
  const safeIndex = Math.max(0, Math.min(index, visibleSlides.value.length - 1))
  const id = `block-${safeIndex}`
  const newHash = `#${id}`
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash)
  }
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/** Прокрутка к якорю по текущему hash (#block-N) */
function scrollToHash() {
  const hash = window.location.hash || route.hash
  if (!hash || !hash.startsWith('#block-')) return
  const id = hash.slice(1)
  const index = parseInt(id.replace('block-', ''), 10)
  if (Number.isNaN(index) || index < 0) return
  if (index >= visibleSlides.value.length) return
  goToBlock(index)
}

/** Запланировать прокрутку к якорю после появления DOM (несколько попыток для надёжности) */
function scheduleScrollToHash() {
  scrollToHash()
  nextTick(scrollToHash)
  requestAnimationFrame(() => {
    scrollToHash()
    requestAnimationFrame(scrollToHash)
  })
  setTimeout(scrollToHash, 100)
  setTimeout(scrollToHash, 350)
}

const galleryOpen = ref(false)
const galleryIndex = ref(0)

function openGallery(globalIndex: number) {
  const urls = allImageUrls.value
  if (globalIndex < 0 || globalIndex >= urls.length) return
  galleryIndex.value = globalIndex
  galleryOpen.value = true
}

function galleryPrev() {
  if (galleryIndex.value > 0) galleryIndex.value--
}

function galleryNext() {
  if (galleryIndex.value < allImageUrls.value.length - 1) galleryIndex.value++
}

onMounted(async () => {
  const shortId = route.params.shortId as string
  const slug = route.params.slug as string
  const hash = route.params.hash as string
  const id = route.params.id as string
  try {
    if (shortId && slug) {
      const data = await api.get<{ id: string; title: string; content: { slides: ViewSlideItem[] } }>(`/api/presentations/public/${shortId}/${slug}`)
      presentation.value = data
    } else if (hash) {
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
    /* Прокрутка к якорю выполнится в watch при появлении visibleSlides */
  }
})

function onHashChange() {
  scrollToHash()
}

/* Когда слайды загрузились и в URL есть якорь — прокручиваем (режим просмотра и публичная ссылка) */
watch(
  () => [visibleSlides.value.length, String(route.hash ?? '')] as [number, string],
  ([len, hash]) => {
    if (len > 0 && (hash.startsWith('#block-') || window.location.hash.startsWith('#block-'))) {
      scheduleScrollToHash()
    }
  },
  { immediate: false }
)

onMounted(() => {
  window.addEventListener('hashchange', onHashChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashChange)
})
</script>

<style scoped>
/* Режим просмотра: фиксированная ширина как в PDF (1123px), горизонтальный формат */
.presentation-view-wrap.presentation-slider-wrap {
  overflow: visible;
  width: 1123px;
  max-width: 100%;
}
/* Слайды в пропорции А4 альбом 1123×794; отступ при скролле к якорю, чтобы не уходить под шапку */
.booklet-page--stacked {
  aspect-ratio: 1123 / 794;
  width: 100%;
  min-height: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  scroll-margin-top: 4rem; /* отступ при scrollIntoView, чтобы блок не уходил под sticky-навигацию */
}
.booklet-page--stacked .booklet-page__inner {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
}
.booklet-page--stacked .booklet-content {
  min-height: 0;
}
.booklet-page--stacked:last-child {
  border-bottom: none;
}
/* Контейнер: скролл на мобильных (scale задаётся в booklet-slides.css) */
.presentation-view-fixed {
  max-width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.presentation-view-fixed .presentation-slider-wrap {
  min-width: 320px;
}
</style>
