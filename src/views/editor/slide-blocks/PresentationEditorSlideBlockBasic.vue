<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import type { SlideItem } from '@/types/presentationSlide'
import LocationMap from '@/components/presentations/LocationMap.vue'
import MessengerIcons from '@/components/profile/MessengerIcons.vue'
import { metroLineColor } from '@/data/metroLineColors'
import { PRESENTATION_EDITOR_SLIDE_KEY, type PresentationEditorSlideInject } from '../presentationEditorSlideKey'

const { slide } = defineProps<{ slide: SlideItem }>()

const peInjected = inject(PRESENTATION_EDITOR_SLIDE_KEY)
if (!peInjected) {
  throw new Error('PresentationEditorSlideBlock: отсутствует контекст редактора')
}
const pe: PresentationEditorSlideInject = peInjected

// Цена на обложке в редакторе: не перемещается, но всегда выше остальных слоёв.
const coverRootRef = ref<HTMLDivElement | null>(null)
const priceBottomRef = ref<HTMLDivElement | null>(null)
const priceZIndex = ref<number>(20)
type CharacteristicItemView = { id: string; label: string; value: string }

function zNum(v: string): number | null {
  if (!v || v === 'auto') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function computeMaxZ(container: Element): number {
  let max = 0
  const els = container.querySelectorAll<HTMLElement>('*')
  for (const el of els) {
    // Не учитываем z-index элементов внутри самого блока цены.
    if (priceBottomRef.value && priceBottomRef.value.contains(el)) continue
    const z = zNum(getComputedStyle(el).zIndex)
    if (z != null) max = Math.max(max, z)
  }
  return max
}

const coverTopInputRef = ref<HTMLTextAreaElement | null>(null)
const coverCenterInputRef = ref<HTMLTextAreaElement | null>(null)
const isDealTypeSelectFocused = ref(false)
const isCurrencySelectFocused = ref(false)

function handleDealTypePointerDown(event: MouseEvent) {
  if (!isDealTypeSelectFocused.value) return
  event.preventDefault()
  ;(event.currentTarget as HTMLSelectElement | null)?.blur()
  isDealTypeSelectFocused.value = false
}

function handleCurrencyPointerDown(event: MouseEvent) {
  if (!isCurrencySelectFocused.value) return
  event.preventDefault()
  ;(event.currentTarget as HTMLSelectElement | null)?.blur()
  isCurrencySelectFocused.value = false
}

function ensureCharacteristicItems() {
  if (slide.type !== 'characteristics') return
  // Инициализируем один раз через контекст редактора, но не во время рендера.
  pe.charItems(slide)
}

const characteristicItems = computed(() => {
  if (slide.type !== 'characteristics') return [] as CharacteristicItemView[]
  return Array.isArray(slide.data?.items) ? (slide.data.items as CharacteristicItemView[]) : ([] as CharacteristicItemView[])
})

function autosizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, 1)}px`
}

onMounted(() => {
  ensureCharacteristicItems()
  if (coverRootRef.value && priceBottomRef.value) {
    const zContainer =
      coverRootRef.value.closest('.booklet-scale-root') ??
      coverRootRef.value.closest('.booklet-page') ??
      coverRootRef.value.parentElement

    if (zContainer) {
      const maxZ = computeMaxZ(zContainer)
      priceZIndex.value = maxZ + 1
    }
  }

  if (slide.type === 'cover') {
    nextTick(() => {
      autosizeTextarea(coverTopInputRef.value)
      autosizeTextarea(coverCenterInputRef.value)
    })
  }
})

watch(
  () => slide.type,
  () => {
    ensureCharacteristicItems()
  }
)

// Динамически поддерживаем "всегда сверху":
// если пользователь двигает слои фигур (z-index), пересчитаем maxZ и цену как max + 1.
watch(
  () => (slide.data as any)?.figures,
  () => {
    if (!coverRootRef.value || !priceBottomRef.value) return
    const zContainer =
      coverRootRef.value.closest('.booklet-scale-root') ??
      coverRootRef.value.closest('.booklet-page') ??
      coverRootRef.value.parentElement
    if (!zContainer) return
    const maxZ = computeMaxZ(zContainer)
    priceZIndex.value = maxZ + 1
  },
  { deep: true }
)

watch(
  () => [slide.data?.title, slide.data?.subtitle],
  () => {
    if (slide.type !== 'cover') return
    nextTick(() => {
      autosizeTextarea(coverTopInputRef.value)
      autosizeTextarea(coverCenterInputRef.value)
    })
  }
)
</script>

<template>
<!-- 1. Обложка -->
                    <div
                      v-if="slide.type === 'cover'"
                      ref="coverRootRef"
                      class="booklet-content booklet-main relative"
                      data-editor-block="slide"
                    >
                      <div class="booklet-main__wrap">
                        <div class="booklet-main__img relative z-0">
                          <div class="booklet-main__img-upload-surface">
                            <template v-if="pe.canEditImages">
                              <label class="booklet-upload-btn cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  class="hidden"
                                  @change="pe.onSingleImageUpload(slide, $event, 'coverImageUrl')"
                                />
                              </label>
                            </template>
                            <img v-if="slide.data?.coverImageUrl" :src="String(slide.data.coverImageUrl)" alt="">
                          </div>
                        </div>
                        <div class="booklet-main__content relative z-[2]">
                          <div class="booklet-main__top">
                            <textarea
                              ref="coverTopInputRef"
                              :value="String(slide.data?.title ?? '')"
                              rows="1"
                              placeholder="ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ"
                              class="booklet-main__top-input w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                              @input="(e) => {
                                (slide.data as Record<string, string>).title = (e.target as HTMLTextAreaElement).value
                                autosizeTextarea(e.target as HTMLTextAreaElement)
                              }"
                            />
                          </div>
                          <div class="booklet-main__center">
                            <textarea
                              ref="coverCenterInputRef"
                              :value="String(slide.data?.subtitle ?? '')"
                              rows="1"
                              placeholder="АБСОЛЮТНО НОВЫЙ ТАУНХАУС НА ПЕРВОЙ ЛИНИИ"
                              class="booklet-main__center-input w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                              @input="(e) => {
                                (slide.data as Record<string, string>).subtitle = (e.target as HTMLTextAreaElement).value
                                autosizeTextarea(e.target as HTMLTextAreaElement)
                              }"
                            />
                          </div>
                          <div
                            ref="priceBottomRef"
                            class="booklet-main__bottom relative"
                            :style="{ zIndex: priceZIndex }"
                          >
                            <div class="booklet-main__price-block flex h-11 flex-nowrap items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                              <div class="relative z-20 flex shrink-0 items-center border-r border-gray-200 bg-transparent dark:border-gray-800">
                                <select
                                  v-model="slide.data.deal_type"
                                  class="focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 min-w-0 appearance-none border-0 bg-transparent bg-none py-3 pl-3.5 pr-8 text-sm leading-tight text-gray-700 focus:ring-3 focus:outline-hidden dark:text-gray-300"
                                  @mousedown="handleDealTypePointerDown"
                                  @focus="isDealTypeSelectFocused = true"
                                  @blur="isDealTypeSelectFocused = false"
                                  @change="isDealTypeSelectFocused = false"
                                >
                                  <option value="Аренда">Аренда</option>
                                  <option value="Продажа">Продажа</option>
                                </select>
                                <span class="pointer-events-none absolute inset-y-0 right-2 z-30 flex items-center text-gray-700 dark:text-gray-400">
                                  <svg
                                    class="h-4 w-4 stroke-current transition-transform duration-150"
                                    :class="isDealTypeSelectFocused ? 'rotate-180' : ''"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                  >
                                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              </div>
                              <div class="booklet-main__price flex-1 min-w-0">
                                <input
                                  :value="pe.coverPriceValue(slide)"
                                  type="text"
                                  :placeholder="pe.coverPricePlaceholder(slide)"
                                  class="dark:bg-dark-900 h-11 w-full border-0 bg-transparent px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                                  @input="pe.onCoverPriceInput(slide, ($event.target as HTMLInputElement).value)"
                                />
                              </div>
                              <div class="relative z-20 flex shrink-0 items-center border-l border-gray-200 bg-transparent dark:border-gray-800">
                                <select
                                  :value="slide.data.currency"
                                  class="focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 min-w-0 appearance-none border-0 bg-transparent bg-none py-3 pl-2.5 pr-8 text-sm leading-tight text-gray-700 focus:ring-3 focus:outline-hidden dark:text-gray-300"
                                  @mousedown="handleCurrencyPointerDown"
                                  @focus="isCurrencySelectFocused = true"
                                  @blur="isCurrencySelectFocused = false"
                                  @change="(e) => { isCurrencySelectFocused = false; pe.onCoverCurrencyChange(slide, e) }"
                                >
                                  <option v-for="c in pe.CURRENCIES" :key="c.code" :value="c.code" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ c.symbol }}</option>
                                </select>
                                <span class="pointer-events-none absolute inset-y-0 right-2 z-30 flex items-center text-gray-700 dark:text-gray-400">
                                  <svg
                                    class="h-4 w-4 stroke-current transition-transform duration-150"
                                    :class="isCurrencySelectFocused ? 'rotate-180' : ''"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                  >
                                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                            <label class="mt-3 inline-flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400" data-no-drag="1">
                              <div class="relative">
                                <input v-model="slide.data.show_all_currencies" type="checkbox" class="sr-only" />
                                <div
                                  :class="slide.data.show_all_currencies ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'"
                                  class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] hover:border-brand-500 dark:hover:border-brand-500"
                                >
                                  <span :class="slide.data.show_all_currencies ? '' : 'opacity-0'">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="1.94437" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                  </span>
                                </div>
                              </div>
                              Показывать все валюты
                            </label>
                            <div v-if="slide.data?.show_all_currencies" class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span v-for="line in pe.coverConvertedPrices(slide)" :key="line" v-text="line" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  <!-- 2. Описание (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'description'"
                    class="booklet-content booklet-info relative"
                  >
                    <div class="booklet-info__shell">
                      <div class="booklet-info__title-col flex flex-col items-center gap-2">
                        <input
                          :value="slide.data?.heading ?? 'ОПИСАНИЕ'"
                          type="text"
                          placeholder="ОПИСАНИЕ"
                          class="booklet-info__title min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 md:flex-none"
                          @input="(slide.data as Record<string, string>).heading = ($event.target as HTMLInputElement).value"
                        />
                        <div v-if="pe.canEditImages" class="booklet-palette-btn-mob shrink-0 md:hidden flex items-center">
                          <button
                            type="button"
                            class="booklet-palette-btn relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-lg text-white transition-opacity hover:opacity-90"
                            style="background-color: var(--color-green-600);"
                            title="Макет и сетка изображений"
                            @click="pe.openPalettePopup(slide.id, $event)"
                          >
                            <svg class="h-[22px] w-[22px] shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 L4.5 15"/></svg>
                          </button>
                        </div>
                      </div>
                    <div class="booklet-info__wrap" :data-block-layout="pe.getBlockLayout(slide)">
                      <div
                        class="booklet-info__block booklet-info__content"
                        data-editor-block="description-text"
                      >
                        <div class="booklet-info__text relative">
                          <textarea
                            :value="String(slide.data?.text ?? '')"
                            placeholder="Подробно опишите объект... Пустая строка — новый абзац."
                            rows="6"
                            class="booklet-info__textarea w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pb-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400"
                            @input="(slide.data as Record<string, string>).text = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            :class="[
                              'booklet-btn booklet-btn--generate group absolute bottom-[10px] right-[20px] inline-flex items-center overflow-hidden rounded-md border py-1.5 pl-2.5 pr-2.5 text-xs font-medium text-gray-700 transition-[max-width] duration-200 disabled:opacity-70',
                              pe.generateTextLoading === slide.id ? 'max-w-[10rem] md:max-w-[10rem]' : 'max-w-[2.5rem] md:max-w-[2rem] md:hover:max-w-[10rem]'
                            ]"
                            style="z-index: 999;"
                            :disabled="pe.generateTextLoading === slide.id"
                            @click="pe.generateTextWithAI(slide, 'description')"
                          >
                            <img src="/images/icons/gigachat-logo.svg" alt="" class="h-4 w-4 shrink-0" width="16" height="16" />
                            <span v-if="pe.generateTextLoading === slide.id" class="booklet-btn__slide ml-[15px] shrink-0 whitespace-nowrap animate-pulse hidden md:inline">Генерация...</span>
                            <span v-else class="booklet-btn__slide ml-[15px] shrink-0 whitespace-nowrap hidden md:inline">сгенерировать</span>
                          </button>
                        </div>
                      </div>
                      <div
                        class="booklet-info__grid image-grid-bound"
                        :data-image-grid="pe.getImageGrid(slide)"
                        data-editor-block="description-images"
                      >
                        <div
                          v-for="(img, i) in pe.descriptionImages(slide)"
                          :key="i"
                          class="booklet-info__block booklet-info__img relative"
                        >
                          <template v-if="pe.canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="pe.onDescriptionImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <!-- 3. Инфраструктура (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'infrastructure'"
                    class="booklet-content booklet-stroen relative"
                  >
                    <div class="booklet-stroen__shell">
                      <div class="booklet-stroen__title-col flex flex-col items-center gap-2">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ИНФРАСТРУКТУРА"
                          class="booklet-stroen__title min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 md:flex-none"
                        />
                        <div v-if="pe.canEditImages" class="booklet-palette-btn-mob shrink-0 md:hidden flex items-center">
                          <button
                            type="button"
                            class="booklet-palette-btn relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-lg text-white transition-opacity hover:opacity-90"
                            style="background-color: var(--color-green-600);"
                            title="Макет и сетка изображений"
                            @click="pe.openPalettePopup(slide.id, $event)"
                          >
                            <svg class="h-[22px] w-[22px] shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 L4.5 15"/></svg>
                          </button>
                        </div>
                      </div>
                    <div class="booklet-stroen__wrap" :data-block-layout="pe.getBlockLayout(slide)">
                      <div
                        class="booklet-stroen__block booklet-stroen__content"
                        data-editor-block="infrastructure-text"
                      >
                        <div class="booklet-stroen__text relative">
                          <textarea
                            :value="String(slide.data?.content ?? '')"
                            placeholder="Текст об инфраструктуре... Пустая строка — новый абзац."
                            rows="6"
                            class="booklet-stroen__textarea w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pb-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400"
                            @input="(slide.data as Record<string, string>).content = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            :class="[
                              'booklet-btn booklet-btn--generate group absolute bottom-[10px] right-[20px] inline-flex items-center overflow-hidden rounded-md border py-1.5 pl-2.5 pr-2.5 text-xs font-medium text-gray-700 transition-[max-width] duration-200 disabled:opacity-70',
                              pe.generateTextLoading === slide.id ? 'max-w-[10rem] md:max-w-[10rem]' : 'max-w-[2.5rem] md:max-w-[2rem] md:hover:max-w-[10rem]'
                            ]"
                            style="z-index: 999;"
                            :disabled="pe.generateTextLoading === slide.id"
                            @click="pe.generateTextWithAI(slide, 'infrastructure')"
                          >
                            <img src="/images/icons/gigachat-logo.svg" alt="" class="h-4 w-4 shrink-0" width="16" height="16" />
                            <span v-if="pe.generateTextLoading === slide.id" class="booklet-btn__slide ml-[15px] shrink-0 whitespace-nowrap animate-pulse hidden md:inline">Генерация...</span>
                            <span v-else class="booklet-btn__slide ml-[15px] shrink-0 whitespace-nowrap hidden md:inline">сгенерировать</span>
                          </button>
                        </div>
                      </div>
                      <div
                        class="booklet-stroen__grid image-grid-bound"
                        :data-image-grid="pe.getImageGrid(slide)"
                        data-editor-block="infrastructure-images"
                      >
                        <div
                          v-for="(img, i) in pe.infrastructureImages(slide)"
                          :key="i"
                          class="booklet-stroen__block booklet-stroen__img relative"
                        >
                          <template v-if="pe.canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="pe.onInfrastructureImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <!-- 4. Местоположение: 50% карта слева, 50% справа поиск по адресу и поиск метро -->
                  <div
                    v-else-if="slide.type === 'location'"
                    class="booklet-content booklet-map overflow-visible"
                    data-editor-block="slide"
                  >
                    <div class="booklet-map__wrap">
                      <input
                        v-model="slide.data.heading"
                        type="text"
                        placeholder="МЕСТОПОЛОЖЕНИЕ"
                        class="booklet-map__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                      />
                      <div class="booklet-map__left flex flex-col gap-2 min-h-0">
                        <div class="booklet-map__img flex-1 min-h-0">
                          <LocationMap
                            :key="`${slide.id}-${Number(slide.data?.lat)}-${Number(slide.data?.lng)}`"
                            :lat="Number(slide.data?.lat)"
                            :lng="Number(slide.data?.lng)"
                          />
                        </div>
                      </div>
                      <div class="booklet-map__content relative flex min-h-0 flex-col gap-2">
                        <div class="booklet-map__info relative flex-shrink-0">
                          <div class="relative mb-2">
                            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Поиск по адресу</label>
                            <div v-if="pe.dadataToken" class="relative">
                              <input
                                :ref="(el) => pe.setLocationInputRef(slide.id, el as HTMLInputElement | null)"
                                :value="String(slide.data?.address ?? '')"
                                type="text"
                                placeholder="Введите адрес объекта"
                                autocomplete="off"
                                class="location-dadata-input dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                @input="pe.onLocationAddressInput(slide, ($event.target as HTMLInputElement).value)"
                                @focus="pe.onLocationAddressFocus(slide)"
                                @blur="pe.onLocationAddressBlur"
                              />
                              <div
                                v-if="pe.dadataLoadingBySlideId[slide.id]"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                              >
                                Поиск...
                              </div>
                              <!-- Выпадающий список в body — прокрутка только внутри списка, без двойного скролла -->
                              <Teleport to="body">
                                <div
                                  v-if="(pe.dadataSuggestionsBySlideId[slide.id]?.length ?? 0) > 0 && pe.activeDadataSlideId === slide.id"
                                  class="location-dadata-suggestions-fixed z-[9999] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                                  :style="pe.dadataDropdownStyle"
                                >
                                  <ul
                                    class="max-h-60 overflow-y-auto overflow-x-hidden py-1"
                                    style="overscroll-behavior: contain;"
                                  >
                                    <li
                                      v-for="(item, idx) in pe.dadataSuggestionsBySlideId[slide.id]"
                                      :key="idx"
                                      class="cursor-pointer px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                      @mousedown.prevent
                                      @click="pe.applyDadataSuggestion(slide, item)"
                                    >
                                      {{ item.value }}
                                    </li>
                                  </ul>
                                </div>
                              </Teleport>
                            </div>
                            <template v-else>
                              <input
                                v-model="slide.data.address"
                                type="text"
                                placeholder="Введите адрес объекта"
                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                              <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">Задайте VITE_DADATA_API_KEY в .env для подсказок Dadata.</p>
                            </template>
                          </div>
                          <button
                            type="button"
                            class="location-find-metro-btn mb-2 self-start inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
                            :disabled="pe.locationMetroLoading(slide)"
                            @click="pe.findNearestMetro(slide)"
                          >
                            <span>{{ pe.locationMetroLoading(slide) ? 'Поиск...' : 'Найти ближайшее метро' }}</span>
                          </button>
                          <label
                            class="inline-flex w-full cursor-pointer select-none items-center text-sm font-medium text-gray-700 dark:text-gray-400"
                            data-no-drag="1"
                          >
                            <span class="relative">
                              <input
                                v-model="slide.data.show_metro"
                                type="checkbox"
                                class="sr-only"
                              />
                              <span
                                :class="slide.data.show_metro ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'"
                                class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] hover:border-brand-500 dark:hover:border-brand-500"
                                aria-hidden="true"
                              >
                                <span :class="slide.data.show_metro ? '' : 'opacity-0'">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="1.94437" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              </span>
                            </span>
                            <span class="min-w-0 flex-1">Показывать метро в презентации</span>
                          </label>
                          <div
                            v-if="(slide.data?.metro_stations as Array<unknown>)?.length"
                            class="mt-2 rounded border border-gray-200 bg-gray-50 p-2"
                          >
                            <p class="mb-1 text-xs font-medium text-gray-500">Ближайшие станции метро</p>
                            <ul class="space-y-1 text-xs text-gray-700">
                              <li
                                v-for="(station, idx) in (slide.data.metro_stations as Array<{ name?: string; walk_time_text?: string; distance_text?: string }>)"
                                :key="idx"
                                class="flex items-center gap-2"
                              >
                                <span
                                  class="h-2.5 w-2.5 shrink-0 rounded-full"
                                  :style="{ backgroundColor: metroLineColor(station.name) }"
                                  :title="station.name"
                                />
                                <span>
                                  <strong>{{ station.name }}</strong>
                                  <span v-if="station.walk_time_text" class="text-gray-500"> — {{ station.walk_time_text }}</span>
                                  <span v-if="station.distance_text" class="text-gray-500">, {{ station.distance_text }}</span>
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 5. Галерея (как в блоках Описание/Инфраструктура: заголовок + сетка в одну строку) -->
                  <div
                    v-else-if="slide.type === 'gallery'"
                    class="booklet-content booklet-galery"
                    data-editor-block="slide"
                  >
                    <div class="booklet-galery__wrap">
                      <div v-if="pe.canEditImages" class="flex flex-nowrap items-center gap-1.5 mb-1">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ГАЛЕРЕЯ"
                          class="booklet-galery__title min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                        <div class="booklet-palette-btn-mob shrink-0 md:hidden flex items-center">
                          <button
                            type="button"
                            class="booklet-palette-btn relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-lg text-white transition-opacity hover:opacity-90"
                            style="background-color: var(--color-green-600);"
                            title="Сетка изображений"
                            @click="pe.openPalettePopup(slide.id, $event)"
                          >
                            <svg class="h-[22px] w-[22px] shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 L4.5 15"/></svg>
                          </button>
                        </div>
                      </div>
                      <template v-else>
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ГАЛЕРЕЯ"
                          class="booklet-galery__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                      </template>
                      <div class="booklet-galery__grid image-grid-bound" :data-image-grid="pe.getImageGrid(slide)">
                        <div
                          v-for="(img, i) in pe.galleryImages3(slide)"
                          :key="i"
                          class="booklet-galery__img relative"
                        >
                          <template v-if="pe.canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="pe.onGalleryImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 7. Характеристики (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'characteristics'"
                    class="booklet-content booklet-char"
                    data-editor-block="slide"
                  >
                    <div class="booklet-char__shell">
                      <div class="booklet-char__title-col flex flex-col items-center justify-center">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ХАРАКТЕРИСТИКИ"
                          class="booklet-char__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                      </div>
                    <div class="booklet-char__wrap">
                      <div class="booklet-char__img relative">
                        <template v-if="pe.canEditImages">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="pe.onSingleImageUpload(slide, $event, 'charImageUrl')"
                            />
                          </label>
                        </template>
                        <img v-if="slide.data?.charImageUrl" :src="String(slide.data.charImageUrl)" alt="">
                      </div>
                      <div class="booklet-char__content">
                        <div class="booklet-char__table">
                          <div
                            v-for="(item, i) in characteristicItems"
                            :key="item.id"
                            class="booklet-char__row"
                          >
                            <div class="booklet-char__item">
                              <input
                                v-model="item.label"
                                type="text"
                                placeholder="Метка"
                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                            </div>
                            <div class="booklet-char__item">
                              <input
                                v-model="item.value"
                                type="text"
                                placeholder="Значение"
                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                            </div>
                            <button
                              v-if="characteristicItems.length > 1"
                              type="button"
                              class="booklet-btn booklet-btn--icon shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Удалить"
                              @click="pe.removeCharacteristicItem(slide, i)"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <button
                            v-if="characteristicItems.length < 13"
                            type="button"
                            class="booklet-btn booklet-btn--secondary add-row mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-1.5 px-2.5 text-xs font-medium text-gray-600 transition hover:border-brand-500 hover:text-brand-600"
                            @click="pe.addCharacteristicItem(slide)"
                          >
                            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Добавить характеристику
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  <!-- 8. Планировка: заголовок + сетка изображений (как Галерея) -->
                  <div
                    v-else-if="slide.type === 'layout'"
                    class="booklet-content booklet-layout"
                    data-editor-block="slide"
                  >
                    <div class="booklet-layout__wrap">
                      <div v-if="pe.canEditImages" class="flex flex-nowrap items-center gap-1.5 mb-1 flex-shrink-0">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ПЛАНИРОВКА"
                          class="booklet-layout__title min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                        <div class="booklet-palette-btn-mob shrink-0 md:hidden flex items-center">
                          <button
                            type="button"
                            class="booklet-palette-btn relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-lg text-white transition-opacity hover:opacity-90"
                            style="background-color: var(--color-green-600);"
                            title="Сетка изображений"
                            @click="pe.openPalettePopup(slide.id, $event)"
                          >
                            <svg class="h-[22px] w-[22px] shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 L4.5 15"/></svg>
                          </button>
                        </div>
                      </div>
                      <template v-else>
                        <div class="booklet-layout__title-wrapper flex-shrink-0">
                          <input
                            v-model="slide.data.heading"
                            type="text"
                            placeholder="ПЛАНИРОВКА"
                            class="booklet-layout__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </template>
                      <div class="booklet-layout__grid image-grid-bound flex-1 min-h-0" :data-image-grid="pe.getImageGrid(slide)">
                        <div
                          v-for="(img, i) in pe.layoutImages(slide)"
                          :key="i"
                          class="booklet-layout__img relative"
                        >
                          <template v-if="pe.canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="pe.onLayoutImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 9. Контакты: заголовок «Контакты», блок аватар+имя/о себе, мессенджеры, телефон, email -->
                  <div
                    v-else-if="slide.type === 'contacts'"
                    class="booklet-content booklet-contacts"
                    data-editor-block="slide"
                  >
                    <div class="booklet-contacts__shell">
                      <div class="booklet-contacts__title-col flex flex-col items-center justify-center">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="Контакты"
                          class="booklet-contacts__title mb-0 w-full flex-shrink-0 border-0 bg-transparent p-0 text-base font-semibold focus:outline-none focus:ring-0"
                        />
                      </div>
                    <div class="booklet-contacts__wrap">
                      <div class="booklet-contacts__left flex flex-col gap-4">
                        <div class="booklet-contacts__top row flex items-start gap-4">
                          <div class="booklet-contacts__avatar-wrap shrink-0 flex justify-center">
                            <div class="booklet-contacts__avatar group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-500 text-2xl font-semibold text-white dark:border-gray-800">
                              <template v-if="pe.canEditImages">
                                <label class="booklet-upload-btn absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50">
                                  <input type="file" accept="image/*" class="hidden" @change="pe.onContactsAvatarUpload(slide, $event)" />
                                </label>
                              </template>
                              <img v-if="pe.contactsAvatarDisplayUrl(slide)" :src="pe.contactsAvatarDisplayUrl(slide)" alt="" class="h-full w-full object-cover">
                            </div>
                          </div>
                          <div class="booklet-contacts__name-phone flex min-w-0 flex-1 flex-col gap-2">
                            <input
                              v-model="slide.data.contactName"
                              type="text"
                              placeholder="ФИО или название организации"
                              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                            <input
                              :value="slide.data.phone"
                              type="text"
                              placeholder="+7 (000) 000-00-00"
                              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              @input="pe.onPhoneInput(slide, $event)"
                            />
                          </div>
                        </div>
                        <div v-if="slide.data?.messengers && Object.keys(slide.data.messengers as object).length" class="booklet-contacts__messengers w-full">
                          <MessengerIcons :messengers="(slide.data.messengers as Record<string, string>) || undefined" compact />
                        </div>
                        <div class="booklet-contacts__block booklet-contacts__content flex w-full flex-col gap-1">
                          <input
                            :value="(slide.data as Record<string, unknown>)?.email as string ?? ''"
                            @input="(slide.data as Record<string, string>).email = ($event.target as HTMLInputElement).value"
                            type="text"
                            placeholder="Email"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                          <input
                            v-if="pe.hasCompanyBlockFilled"
                            :value="(slide.data as Record<string, unknown>)?.address as string ?? ''"
                            @input="(slide.data as Record<string, string>).address = ($event.target as HTMLInputElement).value"
                            type="text"
                            placeholder="Адрес"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                        </div>
                        <div v-if="pe.showAdditionalTextInput" class="booklet-contacts__block w-full flex flex-col gap-1">
                          <textarea
                            :value="(slide.data as Record<string, unknown>)?.aboutText as string ?? ''"
                            placeholder="Дополнительный текст"
                            rows="3"
                            class="dark:bg-dark-900 min-h-[80px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            @input="(slide.data as Record<string, string>).aboutText = ($event.target as HTMLTextAreaElement).value"
                          />
                        </div>
                        <div v-else-if="(slide.data?.aboutText && String((slide.data as Record<string, unknown>).aboutText).trim())" class="booklet-contacts__block w-full">
                          <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{{ (slide.data as Record<string, unknown>).aboutText }}</p>
                        </div>
                        <div v-if="pe.hasCompanyWebsite" class="booklet-contacts__block w-full">
                          <input
                            :value="(slide.data as Record<string, unknown>)?.websiteUrl as string ?? ''"
                            @input="(slide.data as Record<string, string>).websiteUrl = ($event.target as HTMLInputElement).value"
                            type="url"
                            placeholder="Сайт компании"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                        </div>
                      </div>
                      <div class="booklet-contacts__block booklet-contacts__img relative">
                        <template v-if="pe.canEditImages">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input type="file" accept="image/*" class="hidden" @change="pe.onContactsImageUpload(slide, $event, 0)" />
                          </label>
                        </template>
                        <img v-if="pe.contactsImageDisplayUrl(slide)" :src="pe.contactsImageDisplayUrl(slide)" alt="">
                      </div>
                    </div>
                    </div>
                  </div>

                  <!-- AI-макет: уникальная структура страницы с блоками и стилями -->
                  <div
                    v-else-if="slide.type === 'custom' && slide.data?.layoutMode === 'ai'"
                    class="booklet-content booklet-ai-layout h-full w-full overflow-auto"
                    data-editor-block="slide"
                    :style="pe.customSlidePageStyle(slide)"
                  >
                    <template v-for="(block, bi) in (slide.data?.blocks as Array<Record<string, unknown>>) || []" :key="String(block.id ?? bi)">
                      <component
                        :is="pe.customBlockTag(block.type as string)"
                        v-if="block.type !== 'divider' && block.type !== 'image_placeholder'"
                        class="booklet-ai-block"
                        :style="pe.customBlockStyle(block.style)"
                      >
                        <template v-if="block.type === 'columns' && Array.isArray(block.columns)">
                          <div
                            v-for="(col, ci) in block.columns"
                            :key="ci"
                            class="booklet-ai-column"
                            :style="pe.customBlockStyle((col as Record<string, unknown>).style)"
                          >
                            <textarea
                              :value="String((col as Record<string, unknown>).content ?? '')"
                              rows="2"
                              class="w-full resize-none border-0 bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-0 dark:text-gray-100"
                              @input="(col as Record<string, unknown>).content = ($event.target as HTMLTextAreaElement).value"
                            />
                          </div>
                        </template>
                        <template v-else>
                          <textarea
                            :value="String((block as Record<string, unknown>).content ?? '')"
                            :rows="block.type === 'title' ? 2 : block.type === 'quote' ? 3 : 2"
                            class="w-full resize-none border-0 bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-0 dark:text-gray-100"
                            @input="(block as Record<string, unknown>).content = ($event.target as HTMLTextAreaElement).value"
                          />
                        </template>
                      </component>
                      <hr v-else-if="block.type === 'divider'" class="booklet-ai-divider" :style="pe.customBlockStyle(block.style)">
                      <div
                        v-else-if="block.type === 'image_placeholder'"
                        class="booklet-ai-image-placeholder flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
                        :style="pe.customBlockStyle(block.style)"
                      >
                        <span class="text-sm">Изображение</span>
                        <input
                          :value="String((block as Record<string, unknown>).imageUrl ?? '')"
                          type="url"
                          placeholder="Вставьте ссылку на изображение"
                          class="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500/40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                          @input="(block as Record<string, unknown>).imageUrl = ($event.target as HTMLInputElement).value"
                        />
                      </div>
                    </template>
                  </div>

                  <!-- Fallback -->
                  <div v-else class="flex h-full items-center justify-center p-8 text-gray-500">
                    Слайд: {{ slide.type }}
                  </div>
</template>
