<template>
  <AdminLayout>
    <div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <!-- Панель слайдов (с названиями, удаление/дублирование/перетаскивание) -->
      <aside class="flex w-full shrink-0 flex-col gap-4 lg:w-56 xl:w-64">
        <!-- Публичная ссылка активна (при включённом «Поделиться») -->
        <div
          v-if="presentationMeta.isPublic && presentationMeta.publicUrl"
          class="cursor-pointer rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200"
          title="Нажмите, чтобы скопировать ссылку"
          @click="copyPublicLink"
        >
          Публичная ссылка активна
        </div>
        <!-- Список слайдов (на мобиле прокручивается только этот блок) -->
        <div class="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden pb-2 lg:overflow-visible lg:pb-0">
          <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Слайды
          </p>
          <div class="flex gap-2 lg:flex-col">
            <draggable
              v-model="slides"
              item-key="id"
              handle=".slide-drag-handle"
              @end="onDragEnd"
              class="flex gap-2 lg:flex-col"
            >
              <template #item="{ element: slide, index }">
                <div
                  :class="[
                    'flex items-center gap-2 rounded-lg border transition lg:gap-2',
                    activeSlideIndex === index
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                    slide.hidden ? 'opacity-60' : '',
                  ]"
                >
                  <span
                    class="slide-drag-handle cursor-grab touch-none p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Перетащить"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    class="min-w-0 flex-1 truncate py-2.5 pl-0 pr-1 text-left text-sm font-medium transition"
                    :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                    @click="goToSlide(index)"
                  >
                    {{ getSlideLabel(slide) }}
                  </button>
                  <div class="flex shrink-0 items-center gap-0.5 pr-2">
                    <button
                      type="button"
                      class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                      @click.stop="toggleSlideVisibility(index)"
                    >
                      <svg v-if="slide.hidden" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.031 11.117A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-1.563 3.029m5.858-.908a3 3 0 11-4.243-4.243M9.88 9.88a4.5 4.5 0 106.262-6.262" />
                      </svg>
                      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Дублировать"
                      @click.stop="duplicateSlide(index)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      v-if="slides.length > 1"
                      type="button"
                      class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                      title="Удалить"
                      @click.stop="deleteSlide(index)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
        <!-- Добавить слайд (вне блока прокрутки) -->
        <div class="shrink-0 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Добавить слайд
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in SLIDE_TYPE_OPTIONS"
              :key="opt.type"
              type="button"
              class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              :title="`Добавить: ${opt.label}`"
              @click="addSlide(opt.type)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Область превью слайдов (Swiper) -->
      <main class="min-w-0 flex-1">
        <div
          class="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-4 lg:p-6"
          @paste.capture="onPasteStripFormat"
        >
          <!-- Высота слайдера ограничена, на мобиле больше места под контент -->
          <div class="presentation-slider-wrap booklet-view mx-auto w-full overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900">
            <Swiper
              v-bind="swiperOptions"
              @swiper="onSwiper"
              @slideChange="onSlideChange"
              class="presentation-swiper h-full"
            >
              <SwiperSlide v-for="(slide, index) in visibleSlides" :key="slide.id">
                <div
                  class="booklet-page h-full w-full"
                  :class="slide.type === 'location' ? 'overflow-visible' : 'overflow-hidden'"
                >
                  <div class="booklet-page__inner">
                    <!-- 1. Обложка (как на presentation-realty.ru/view) -->
                    <div
                      v-if="slide.type === 'cover'"
                      class="booklet-content booklet-main"
                    >
                      <div class="booklet-main__wrap">
                        <div class="booklet-main__img">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onSingleImageUpload(slide, $event, 'coverImageUrl')"
                            />
                          </label>
                          <img v-if="slide.data?.coverImageUrl" :src="String(slide.data.coverImageUrl)" alt="">
                        </div>
                        <div class="booklet-main__content">
                          <div class="booklet-main__top">
                            <input
                              v-model="slide.data.title"
                              type="text"
                              placeholder="ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ"
                              class="w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                            />
                          </div>
                          <div class="booklet-main__center">
                            <input
                              v-model="slide.data.subtitle"
                              type="text"
                              placeholder="АБСОЛЮТНО НОВЫЙ ТАУНХАУС НА ПЕРВОЙ ЛИНИИ"
                              class="w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                            />
                          </div>
                          <div class="booklet-main__bottom">
                            <div class="flex flex-wrap items-end gap-4">
                              <div class="min-w-[140px]">
                                <label class="mb-1 block text-xs font-medium text-gray-600">Тип сделки</label>
                                <select
                                  v-model="slide.data.deal_type"
                                  class="h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                  <option value="Аренда">Аренда</option>
                                  <option value="Продажа">Продажа</option>
                                </select>
                              </div>
                              <div class="min-w-0 flex-1 sm:min-w-[180px]">
                                <label class="mb-1 block text-xs font-medium text-gray-600">Цена</label>
                                <div class="flex gap-2">
                                  <input
                                    :value="coverPriceValue(slide)"
                                    type="text"
                                    :placeholder="coverPricePlaceholder(slide)"
                                    class="h-10 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    @input="onCoverPriceInput(slide, ($event.target as HTMLInputElement).value)"
                                  />
                                  <select
                                    :value="slide.data.currency"
                                    class="h-10 w-16 shrink-0 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none"
                                    @change="onCoverCurrencyChange(slide, $event)"
                                  >
                                    <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.symbol }}</option>
                                  </select>
                                </div>
                              </div>
                              <label class="flex cursor-pointer items-center gap-2 pb-1 text-sm text-gray-600">
                                <input
                                  v-model="slide.data.show_all_currencies"
                                  type="checkbox"
                                  class="h-4 w-4 rounded border-gray-300"
                                />
                                <span>Показывать все валюты</span>
                              </label>
                            </div>
                            <div v-if="slide.data?.show_all_currencies" class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span v-for="line in coverConvertedPrices(slide)" :key="line" v-text="line" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  <!-- 2. Описание (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'description'"
                    class="booklet-content booklet-info"
                  >
                    <div class="booklet-info__top-square" />
                    <div class="booklet-info__bottom-square" />
                    <div class="booklet-info__wrap">
                      <div class="booklet-info__block booklet-info__content">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ОПИСАНИЕ"
                          class="booklet-info__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-medium text-gray-500">Сетка:</span>
                          <select
                            :value="getImageGrid(slide)"
                            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
                            @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                          >
                            <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                          </select>
                        </div>
                        <div class="booklet-info__text">
                          <textarea
                            :value="String(slide.data?.text ?? '')"
                            placeholder="Подробно опишите объект..."
                            rows="4"
                            class="w-full resize-none border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-0"
                            @input="(slide.data as Record<string, string>).text = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            class="mt-2 inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            :disabled="generateTextLoading === slide.id"
                            @click="generateTextWithAI(slide, 'description')"
                          >
                            <span v-if="generateTextLoading === slide.id" class="animate-pulse">Генерация...</span>
                            <span v-else>Сгенерировать текст (GigaChat)</span>
                          </button>
                        </div>
                      </div>
                      <div class="booklet-info__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(img, i) in descriptionImages(slide)"
                          :key="i"
                          class="booklet-info__block booklet-info__img relative"
                        >
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onDescriptionImageUpload(slide, $event, i)"
                            />
                          </label>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 3. Инфраструктура (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'infrastructure'"
                    class="booklet-content booklet-stroen"
                  >
                    <div class="booklet-stroen__top-square" />
                    <div class="booklet-stroen__bottom-square" />
                    <div class="booklet-stroen__wrap">
                      <div class="booklet-stroen__block booklet-stroen__content">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ИНФРАСТРУКТУРА"
                          class="booklet-stroen__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-medium text-gray-500">Сетка:</span>
                          <select
                            :value="getImageGrid(slide)"
                            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
                            @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                          >
                            <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                          </select>
                        </div>
                        <div class="booklet-stroen__text">
                          <textarea
                            :value="String(slide.data?.content ?? '')"
                            placeholder="Текст об инфраструктуре..."
                            rows="2"
                            class="w-full resize-none border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-0"
                            @input="(slide.data as Record<string, string>).content = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            class="mt-1 inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                            :disabled="generateTextLoading === slide.id"
                            @click="generateTextWithAI(slide, 'infrastructure')"
                          >
                            <span v-if="generateTextLoading === slide.id" class="animate-pulse">Генерация...</span>
                            <span v-else>Сгенерировать (GigaChat)</span>
                          </button>
                        </div>
                      </div>
                      <div class="booklet-stroen__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(img, i) in infrastructureImages(slide)"
                          :key="i"
                          class="booklet-stroen__block booklet-stroen__img relative"
                        >
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onInfrastructureImageUpload(slide, $event, i)"
                            />
                          </label>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 4. Местоположение (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'location'"
                    class="booklet-content booklet-map overflow-visible"
                  >
                    <div class="booklet-map__wrap">
                      <input
                        v-model="slide.data.heading"
                        type="text"
                        placeholder="МЕСТОПОЛОЖЕНИЕ"
                        class="booklet-map__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                      />
                      <div class="booklet-map__img">
                        <LocationMap
                          :key="slide.id"
                          :lat="Number(slide.data?.lat)"
                          :lng="Number(slide.data?.lng)"
                        />
                      </div>
                      <div class="booklet-map__content">
                        <div class="booklet-map__top-square" />
                        <div class="booklet-map__bottom-square" />
                        <div class="booklet-map__info relative">
                          <div class="relative mb-2">
                            <input
                              v-model="slide.data.address"
                              type="text"
                              placeholder="ЖК «Успешная продажа»"
                              class="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              @input="(slide.data as Record<string, string>).address = ($event.target as HTMLInputElement).value; onLocationAddressInput(slide, ($event.target as HTMLInputElement).value)"
                              @focus="showAddressSuggestions(slide)"
                              @blur="onLocationAddressBlur(slide)"
                              @keydown.enter.prevent="geocodeAddress(slide)"
                            />
                            <ul
                              v-if="addressSuggestionsFor(slide).length > 0"
                              class="absolute left-0 right-0 top-full z-[100] mt-1 max-h-40 overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg"
                            >
                            <li
                              v-for="(s, i) in addressSuggestionsFor(slide)"
                              :key="i"
                              class="cursor-pointer px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                              @mousedown.prevent="selectAddressSuggestion(slide, s)"
                            >
                              {{ s.display_name || s.address || s }}
                            </li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            class="mb-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            :disabled="locationMetroLoading(slide)"
                            @click="findNearestMetro(slide)"
                          >
                            {{ locationMetroLoading(slide) ? 'Поиск...' : 'Найти ближайшее метро' }}
                          </button>
                          <label class="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                            <input v-model="slide.data.show_metro" type="checkbox" class="rounded" />
                            Показывать метро в презентации
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
                              >
                                <strong>{{ station.name }}</strong>
                                <span v-if="station.walk_time_text" class="text-gray-500"> — {{ station.walk_time_text }}</span>
                                <span v-if="station.distance_text" class="text-gray-500">, {{ station.distance_text }}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 5. Изображение (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'image'"
                    class="booklet-content booklet-img"
                  >
                    <div class="booklet-img__top-square" />
                    <div class="booklet-img__bottom-square" />
                    <div class="booklet-img__wrap">
                      <div class="booklet-img__img">
                        <label class="booklet-upload-btn cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onSingleImageUpload(slide, $event, 'imageUrl')"
                          />
                        </label>
                        <img v-if="slide.data?.imageUrl" :src="String(slide.data.imageUrl)" alt="">
                      </div>
                    </div>
                  </div>

                  <!-- 6. Галерея 3 фото (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'gallery'"
                    class="booklet-content booklet-galery"
                  >
                    <div class="booklet-galery__top-square" />
                    <div class="booklet-galery__bottom-square" />
                    <div class="booklet-galery__wrap">
                      <div class="flex items-center gap-2 px-2 py-1 col-span-full">
                        <span class="text-xs font-medium text-gray-500">Сетка:</span>
                        <select
                          :value="getImageGrid(slide)"
                          class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
                          @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                        >
                          <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                      </div>
                      <div class="booklet-galery__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(img, i) in galleryImages3(slide)"
                          :key="i"
                          class="booklet-galery__img relative"
                        >
                        <label class="booklet-upload-btn cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onGalleryImageUpload(slide, $event, i)"
                          />
                        </label>
                        <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 7. Характеристики (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'characteristics'"
                    class="booklet-content booklet-char"
                  >
                    <div class="booklet-char__wrap">
                      <input
                        v-model="slide.data.heading"
                        type="text"
                        placeholder="ХАРАКТЕРИСТИКИ"
                        class="booklet-char__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                      />
                      <div class="booklet-char__img relative">
                        <div class="booklet-char__top-square" />
                        <div class="booklet-char__bottom-square" />
                        <label class="booklet-upload-btn cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onSingleImageUpload(slide, $event, 'charImageUrl')"
                          />
                        </label>
                        <img v-if="slide.data?.charImageUrl" :src="String(slide.data.charImageUrl)" alt="">
                      </div>
                      <div class="booklet-char__content">
                        <div class="booklet-char__table">
                          <div
                            v-for="(item, i) in charItems(slide)"
                            :key="i"
                            class="booklet-char__row"
                          >
                            <div class="booklet-char__item">
                              <input
                                v-model="item.label"
                                type="text"
                                placeholder="Метка"
                                class="w-full border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                              />
                            </div>
                            <div class="booklet-char__item">
                              <input
                                v-model="item.value"
                                type="text"
                                placeholder="Значение"
                                class="w-full border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                              />
                            </div>
                            <button
                              v-if="charItems(slide).length > 1"
                              type="button"
                              class="remove-row shrink-0 rounded p-1 text-gray-400 hover:text-red-600"
                              title="Удалить"
                              @click="removeCharacteristicItem(slide, i)"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <button
                            v-if="charItems(slide).length < 12"
                            type="button"
                            class="add-row mt-2 flex w-full items-center justify-center gap-1 rounded border border-dashed border-gray-300 py-1.5 text-xs text-gray-600 hover:border-brand-500 hover:text-brand-600"
                            @click="addCharacteristicItem(slide)"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Добавить характеристику
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 8. Планировка (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'layout'"
                    class="booklet-content booklet-layout"
                  >
                    <div class="booklet-layout__wrap">
                      <div class="booklet-layout__title-wrapper">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ПЛАНИРОВКА"
                          class="booklet-layout__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                      </div>
                      <div class="booklet-layout__img relative">
                        <label class="booklet-upload-btn cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onSingleImageUpload(slide, $event, 'layoutImageUrl')"
                          />
                        </label>
                        <img v-if="slide.data?.layoutImageUrl" :src="String(slide.data.layoutImageUrl)" alt="">
                      </div>
                    </div>
                  </div>

                  <!-- 9. Сетка 4 фото (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'grid'"
                    class="booklet-content booklet-grid"
                  >
                    <div class="booklet-grid__top-square" />
                    <div class="booklet-grid__bottom-square" />
                    <div class="booklet-grid__wrap">
                      <div class="flex items-center gap-2 px-2 py-1">
                        <span class="text-xs font-medium text-gray-500">Сетка:</span>
                        <select
                          :value="getImageGrid(slide)"
                          class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
                          @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                        >
                          <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                      </div>
                      <div class="booklet-grid__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(img, i) in gridImages4(slide)"
                          :key="i"
                          class="booklet-grid__img relative"
                        >
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onGridImageUpload(slide, $event, i)"
                            />
                          </label>
                          <img v-if="img" :src="img" alt="">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 10. Контакты (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'contacts'"
                    class="booklet-content booklet-contacts"
                  >
                    <div class="booklet-contacts__wrap">
                      <div class="booklet-contacts__block booklet-contacts__content">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="КОНТАКТЫ"
                          class="mb-2 w-full border-0 bg-transparent p-0 text-base font-semibold uppercase focus:outline-none focus:ring-0"
                        />
                        <input
                          v-model="slide.data.phone"
                          type="text"
                          placeholder="Телефон"
                          class="mb-1 w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          v-model="slide.data.email"
                          type="text"
                          placeholder="Email"
                          class="mb-1 w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          v-model="slide.data.address"
                          type="text"
                          placeholder="Адрес"
                          class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div class="booklet-contacts__images-wrap relative">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-medium text-gray-500">Сетка:</span>
                          <select
                            :value="getImageGrid(slide)"
                            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
                            @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                          >
                            <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                          </select>
                        </div>
                        <div class="booklet-contacts__top-square" />
                        <div class="booklet-contacts__bottom-square" />
                        <div class="booklet-contacts-grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(url, i) in imageSlotsForSlide(slide)"
                          :key="i"
                          class="booklet-contacts__block booklet-contacts__img relative"
                        >
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onContactsImageUpload(slide, $event, i)"
                            />
                          </label>
                          <img v-if="url" :src="url" alt="">
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback -->
                  <div v-else class="flex h-full items-center justify-center p-8 text-gray-500">
                    Слайд: {{ slide.type }}
                  </div>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-[30px]">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="prevSlide"
            >
              Назад
            </button>
            <span class="text-sm text-gray-500">
              {{ visibleSlideNumber }} / {{ visibleSlides.length }}
            </span>
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="nextSlide"
            >
              Далее
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="openViewPage"
            >
              Просмотр
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="toggleShare"
            >
              {{ presentationMeta.isPublic ? 'Скрыть ссылку' : 'Поделиться' }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              @click="exportToPDF"
              title="Экспортировать презентацию в PDF"
            >
              Экспорт в PDF
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="saveToStorage"
            >
              Сохранить
            </button>
            <button
              v-if="presentationMeta.status !== 'published'"
              type="button"
              class="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              @click="publishPresentation"
            >
              Опубликовать
            </button>
            <span v-if="autoSaveStatus" class="text-xs text-gray-500">{{ autoSaveStatus }}</span>
          </div>
        </div>
      </main>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperType } from 'swiper'
import draggable from 'vuedraggable'
import 'swiper/css'
import '@/assets/booklet-slides.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import LocationMap from '@/components/presentations/LocationMap.vue'
import { api, hasApi, getToken, getApiBase } from '@/api/client'
import type { PresentationFull } from '@/api/client'

const route = useRoute()
const router = useRouter()

const SLIDE_TYPE_LABELS: Record<string, string> = {
  cover: 'Обложка',
  description: 'Описание',
  infrastructure: 'Инфраструктура',
  location: 'Местоположение',
  image: 'Изображение',
  gallery: 'Галерея',
  characteristics: 'Характеристики',
  layout: 'Планировка',
  grid: 'Сетка с изображениями',
  contacts: 'Контакты',
}

/** Варианты сетки для слайдов с изображениями (колонки × строки) */
const IMAGE_GRID_OPTIONS = [
  { value: '1x1', label: '1×1', cols: 1, rows: 1 },
  { value: '2x1', label: '2×1', cols: 2, rows: 1 },
  { value: '1x2', label: '1×2', cols: 1, rows: 2 },
  { value: '2x2', label: '2×2', cols: 2, rows: 2 },
  { value: '3x1', label: '3×1', cols: 3, rows: 1 },
  { value: '1x3', label: '1×3', cols: 1, rows: 3 },
  { value: '3x2', label: '3×2', cols: 3, rows: 2 },
  { value: '2x3', label: '2×3', cols: 2, rows: 3 },
] as const

const DEFAULT_IMAGE_GRID_BY_TYPE: Record<string, string> = {
  description: '1x2',
  infrastructure: '1x2',
  gallery: '3x1',
  grid: '2x2',
  contacts: '1x2',
}

function getImageGrid(slide: SlideItem): string {
  const v = slide.data?.imageGrid
  if (typeof v === 'string' && v) return v
  return DEFAULT_IMAGE_GRID_BY_TYPE[slide.type] ?? '2x2'
}

function getImageGridColsRows(slide: SlideItem): { cols: number; rows: number } {
  const grid = getImageGrid(slide)
  const opt = IMAGE_GRID_OPTIONS.find((o) => o.value === grid)
  if (opt) return { cols: opt.cols, rows: opt.rows }
  const [c, r] = grid.split('x').map(Number)
  return { cols: c || 2, rows: r || 2 }
}

function getImageGridLimit(slide: SlideItem): number {
  const { cols, rows } = getImageGridColsRows(slide)
  return cols * rows
}

/** Набор готовых типов слайдов для добавления (уникальные) */
const SLIDE_TYPE_OPTIONS = [
  { type: 'cover', label: 'Обложка' },
  { type: 'description', label: 'Описание' },
  { type: 'infrastructure', label: 'Инфраструктура' },
  { type: 'location', label: 'Местоположение' },
  { type: 'image', label: 'Изображение' },
  { type: 'gallery', label: 'Галерея' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'layout', label: 'Планировка' },
  { type: 'grid', label: 'Сетка' },
  { type: 'contacts', label: 'Контакты' },
]

const SLIDE_TYPES = [
  { type: 'cover', label: 'Обложка' },
  { type: 'description', label: 'Описание' },
  { type: 'infrastructure', label: 'Инфраструктура' },
  { type: 'description', label: 'Описание' },
  { type: 'location', label: 'Местоположение' },
  { type: 'image', label: 'Изображение' },
  { type: 'gallery', label: 'Галерея' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'layout', label: 'Планировка' },
  { type: 'grid', label: 'Сетка с изображениями' },
  { type: 'contacts', label: 'Контакты' },
] as const

function genSlideId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const defaultSlides = SLIDE_TYPES.map(({ type }) => ({
  id: genSlideId(),
  type,
  data:
    type === 'cover'
      ? {
          title: 'Новая презентация',
          subtitle: '',
          deal_type: 'Аренда',
          currency: 'RUB',
          price_value: 0,
          show_all_currencies: false,
        }
      : type === 'location'
        ? { heading: 'Местоположение', address: '', lat: 55.755864, lng: 37.617698, show_metro: true, metro_stations: [] }
        : {},
  hidden: false,
}))

interface SlideItem {
  id: string
  type: string
  data: Record<string, unknown>
  hidden?: boolean
}

const slides = ref<SlideItem[]>([...defaultSlides])
const swiperInstance = ref<SwiperType | null>(null)
const activeSlideIndex = ref(0)

/** Мета презентации: статус, публичная ссылка (только владелец) */
const presentationMeta = ref<{
  status: string
  isPublic: boolean
  publicUrl: string
  publicHash: string
}>({
  status: 'draft',
  isPublic: false,
  publicUrl: '',
  publicHash: '',
})

/** Статус автосохранения */
const autoSaveStatus = ref('')
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const AUTO_SAVE_INTERVAL_MS = 30000
const initialLoadDone = ref(false)

/** Слайды, отображаемые в Swiper (без скрытых) */
const visibleSlides = computed(() => slides.value.filter((s) => !s.hidden))

/** Номер текущего слайда среди видимых (1-based для отображения) */
const visibleSlideNumber = computed(() => {
  const current = slides.value[activeSlideIndex.value]
  if (!current || current.hidden) return 0
  const idx = visibleSlides.value.findIndex((s) => s.id === current.id)
  return idx >= 0 ? idx + 1 : 0
})

// Цена на обложке: форматирование и валюты
const CURRENCIES = [
  { code: 'RUB', symbol: '₽' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'CNY', symbol: '¥' },
  { code: 'KZT', symbol: '₸' },
]
const EXCHANGE_RATES: Record<string, number> = {
  RUB: 1,
  USD: 0.011,
  EUR: 0.01,
  CNY: 0.078,
  KZT: 4.9,
}

function formatPrice(num: number): string {
  if (!num || num <= 0) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function parsePrice(str: string): number {
  return parseInt(String(str).replace(/\s/g, ''), 10) || 0
}

function coverPriceValue(slide: SlideItem): string {
  const v = slide.data?.price_value
  const num = typeof v === 'number' ? v : parsePrice(String(v ?? ''))
  return num ? formatPrice(num) : ''
}

function coverPricePlaceholder(slide: SlideItem): string {
  const deal = slide.data?.deal_type
  return deal === 'Аренда' ? '0 000 000 / месяц' : '0 000 000'
}

function onCoverPriceInput(slide: SlideItem, value: string) {
  const num = parsePrice(value)
  slide.data.price_value = num
}

/** Конвертация при смене валюты: пересчитываем price_value в новую валюту */
function onCoverCurrencyChange(slide: SlideItem, event: Event) {
  const select = event.target as HTMLSelectElement
  const newCurrency = select.value
  const oldCurrency = String(slide.data?.currency || 'RUB')
  if (newCurrency === oldCurrency) return
  const price = Number(slide.data?.price_value) || 0
  if (!price) {
    slide.data.currency = newCurrency
    return
  }
  const oldRate = EXCHANGE_RATES[oldCurrency] ?? 1
  const newRate = EXCHANGE_RATES[newCurrency] ?? 1
  if (oldRate <= 0 || newRate <= 0) {
    slide.data.currency = newCurrency
    return
  }
  const priceInRUB = price / oldRate
  const converted = Math.round(priceInRUB * newRate)
  slide.data.price_value = converted
  slide.data.currency = newCurrency
}

/** EXCHANGE_RATES: сколько единиц валюты за 1 RUB (1 RUB = 0.011 USD и т.д.) */
function coverConvertedPrices(slide: SlideItem): string[] {
  const price = Number(slide.data?.price_value) || 0
  const baseCurrency = String(slide.data?.currency || 'RUB')
  const baseRate = EXCHANGE_RATES[baseCurrency] ?? 1
  if (!price || baseRate <= 0) return []
  return CURRENCIES.filter((c) => c.code !== baseCurrency).map((c) => {
    const rate = EXCHANGE_RATES[c.code] ?? 1
    const priceInRUB = price / baseRate
    const converted = Math.round(priceInRUB * rate)
    return `${c.symbol} ${formatPrice(converted)}`
  })
}

// Местоположение и генерация: базовый URL API (в проде — относительный /api, в dev — VITE_API_URL)
const EDITOR_API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : '/api'

const addressSuggestionsBySlideId = ref<Record<string, Array<{ display_name?: string; address?: string; lat?: number; lon?: number }>>>({})
const addressSuggestionsVisibleBySlideId = ref<Record<string, boolean>>({})
let addressSuggestionsBlurTimer: ReturnType<typeof setTimeout> | null = null
let addressSuggestionsFetchTimer: ReturnType<typeof setTimeout> | null = null

function onLocationAddressInput(slide: SlideItem, value: string) {
  slide.data.address = value
  if (!value.trim()) {
    addressSuggestionsBySlideId.value[slide.id] = []
    return
  }
  clearTimeout(addressSuggestionsFetchTimer ?? 0)
  const id = slide.id
  addressSuggestionsFetchTimer = setTimeout(() => {
    fetch(`${EDITOR_API_BASE}/suggest?q=${encodeURIComponent(value)}`)
      .then(async (r) => {
        const text = await r.text()
        let data: { suggestions?: Array<{ display_name?: string; address?: string; lat?: number; lon?: number }>; error?: string }
        try {
          data = JSON.parse(text)
        } catch {
          if (!r.ok) {
            alert(r.status === 502 ? 'Сервис подсказок временно недоступен (502). Проверьте, что бэкенд запущен на сервере.' : `Ошибка сервера: ${r.status}`)
          }
          addressSuggestionsBySlideId.value = { ...addressSuggestionsBySlideId.value, [id]: [] }
          return
        }
        if (data.error) {
          alert(data.error)
        }
        addressSuggestionsBySlideId.value = { ...addressSuggestionsBySlideId.value, [id]: data.suggestions ?? [] }
      })
      .catch(() => {
        addressSuggestionsBySlideId.value = { ...addressSuggestionsBySlideId.value, [id]: [] }
      })
  }, 300)
}

function addressSuggestionsFor(slide: SlideItem) {
  return addressSuggestionsBySlideId.value[slide.id] ?? []
}

function showAddressSuggestions(slide: SlideItem) {
  if ((addressSuggestionsBySlideId.value[slide.id] ?? []).length > 0) {
    addressSuggestionsVisibleBySlideId.value[slide.id] = true
  }
  const address = String(slide.data?.address ?? '').trim()
  if (address.length >= 2) onLocationAddressInput(slide, address)
}

function hideAddressSuggestionsDelay(slide: SlideItem) {
  addressSuggestionsBlurTimer = setTimeout(() => {
    addressSuggestionsVisibleBySlideId.value[slide.id] = false
  }, 200)
}

const geocodeLoadingBySlideId = ref<Record<string, boolean>>({})

async function geocodeAddress(slide: SlideItem) {
  const address = String(slide.data?.address ?? '').trim()
  if (!address) return
  geocodeLoadingBySlideId.value[slide.id] = true
  try {
    const res = await fetch(`${EDITOR_API_BASE}/geocode?q=${encodeURIComponent(address)}`)
    const data = (await res.json()) as { success?: boolean; lat?: number; lng?: number; error?: string }
    if (data.success && typeof data.lat === 'number' && typeof data.lng === 'number') {
      slide.data.lat = data.lat
      slide.data.lng = data.lng
    } else if (data.error && res.status !== 404) {
      console.warn('Геокодирование:', data.error)
    }
  } catch {
    // ignore
  } finally {
    geocodeLoadingBySlideId.value[slide.id] = false
  }
}

function onLocationAddressBlur(slide: SlideItem) {
  hideAddressSuggestionsDelay(slide)
  setTimeout(() => {
    const address = String(slide.data?.address ?? '').trim()
    if (address.length >= 2) geocodeAddress(slide)
  }, 350)
}

function selectAddressSuggestion(
  slide: SlideItem,
  s: { display_name?: string; address?: string; lat?: number; lon?: number }
) {
  slide.data.address = s.display_name || s.address || ''
  if (s.lat != null) slide.data.lat = s.lat
  if (s.lon != null) slide.data.lng = s.lon
  addressSuggestionsBySlideId.value[slide.id] = []
  addressSuggestionsVisibleBySlideId.value[slide.id] = false
}

function locationMapUrl(slide: SlideItem): string {
  const lat = Number(slide.data?.lat)
  const lng = Number(slide.data?.lng)
  if (!lat || !lng) return ''
  return `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=400,300&z=16&l=map&pt=${lng},${lat}`
}

const metroLoadingBySlideId = ref<Record<string, boolean>>({})

function locationMetroLoading(slide: SlideItem): boolean {
  return metroLoadingBySlideId.value[slide.id] ?? false
}

async function findNearestMetro(slide: SlideItem) {
  const lat = Number(slide.data?.lat)
  const lng = Number(slide.data?.lng)
  if (!lat || !lng) {
    alert('Сначала укажите адрес и выберите подсказку, чтобы на карте отобразилась точка.')
    return
  }
  metroLoadingBySlideId.value[slide.id] = true
  try {
    const res = await fetch(`${EDITOR_API_BASE}/find_nearest_metro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
    const text = await res.text()
    let data: { stations?: unknown[]; error?: string }
    try {
      data = JSON.parse(text)
    } catch {
      alert(res.status === 502 ? 'Сервис поиска метро временно недоступен (502). Проверьте, что бэкенд запущен на сервере.' : `Ошибка сервера: ${res.status}`)
      return
    }
    if (data.error) {
      alert(data.error)
      return
    }
    if (data.stations && Array.isArray(data.stations)) {
      slide.data.metro_stations = data.stations
    }
  } catch {
    alert('Ошибка при поиске станций метро.')
  } finally {
    metroLoadingBySlideId.value[slide.id] = false
  }
}

// Генерация текста (GigaChat)
const generateTextLoading = ref<string | null>(null)

async function generateTextWithAI(slide: SlideItem, type: 'description' | 'infrastructure') {
  const cover = slides.value.find((s) => s.type === 'cover')
  const objectTitle = cover?.data?.title ? String(cover.data.title) : ''
  const currentText = type === 'description' ? String(slide.data?.text ?? '') : String(slide.data?.content ?? '')
  const prompt = currentText.trim() || objectTitle || 'объект недвижимости'

  generateTextLoading.value = slide.id
  try {
    const res = await fetch(`${EDITOR_API_BASE}/generate_text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, object_title: objectTitle }),
    })
    const text = await res.text()
    let data: { text?: string; error?: string }
    try {
      data = JSON.parse(text)
    } catch {
      alert(res.status === 502 ? 'Сервис генерации текста временно недоступен (502). Проверьте, что бэкенд запущен на сервере.' : `Ошибка сервера: ${res.status}`)
      return
    }
    if (data.text) {
      if (type === 'description') {
        slide.data.text = data.text
      } else {
        slide.data.content = data.text
      }
    } else {
      alert(data.error || 'Не удалось сгенерировать текст.')
    }
  } catch (e) {
    alert('Ошибка запроса к API: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    generateTextLoading.value = null
  }
}

const swiperOptions = {
  spaceBetween: 0,
  allowTouchMove: false,
  initialSlide: 0,
}

function onSwiper(swiper: SwiperType) {
  swiperInstance.value = swiper
}

function onSlideChange(swiper: SwiperType) {
  const visibleIdx = swiper.activeIndex
  const slide = visibleSlides.value[visibleIdx]
  if (slide) {
    const fullIdx = slides.value.findIndex((s) => s.id === slide.id)
    if (fullIdx >= 0) activeSlideIndex.value = fullIdx
  }
}

function goToSlide(fullIndex: number) {
  activeSlideIndex.value = fullIndex
  const slide = slides.value[fullIndex]
  if (slide && !slide.hidden) {
    const visibleIdx = visibleSlides.value.findIndex((s) => s.id === slide.id)
    if (visibleIdx >= 0) swiperInstance.value?.slideTo(visibleIdx)
  }
}

function prevSlide() {
  const idx = findPrevVisibleIndex(activeSlideIndex.value)
  if (idx >= 0) goToSlide(idx)
}

function nextSlide() {
  const idx = findNextVisibleIndex(activeSlideIndex.value)
  if (idx >= 0) goToSlide(idx)
}

function findPrevVisibleIndex(from: number): number {
  for (let i = from - 1; i >= 0; i--) {
    if (!slides.value[i]?.hidden) return i
  }
  return -1
}

function findNextVisibleIndex(from: number): number {
  for (let i = from + 1; i < slides.value.length; i++) {
    if (!slides.value[i]?.hidden) return i
  }
  return -1
}

function toggleSlideVisibility(index: number) {
  const slide = slides.value[index]
  if (slide) {
    slide.hidden = !slide.hidden
    nextTick(() => {
      if (slide.hidden) {
        const nextIdx = findNextVisibleIndex(index)
        const prevIdx = findPrevVisibleIndex(index)
        const goIdx = nextIdx >= 0 ? nextIdx : prevIdx
        if (goIdx >= 0) goToSlide(goIdx)
      } else {
        goToSlide(index)
      }
    })
  }
}

const defaultCharItems = [
  { label: 'Площадь', value: '—' },
  { label: 'Этажность', value: '—' },
  { label: 'Год', value: '—' },
  { label: 'Материал', value: '—' },
]

function getSlideLabel(slide: SlideItem): string {
  return SLIDE_TYPE_LABELS[slide.type] ?? slide.type
}

function getDefaultDataForType(type: string): Record<string, unknown> {
  switch (type) {
    case 'cover':
      return {
        title: 'Новая презентация',
        subtitle: '',
        deal_type: 'Аренда',
        currency: 'RUB',
        price_value: 0,
        show_all_currencies: false,
      }
    case 'location':
      return {
        heading: 'Местоположение',
        address: '',
        lat: 55.755864,
        lng: 37.617698,
        show_metro: true,
        metro_stations: [],
      }
    case 'image':
      return { heading: '', imageUrl: '' }
    case 'description':
      return { heading: 'ОПИСАНИЕ', text: '', imageGrid: '1x2', images: [] as string[] }
    case 'infrastructure':
      return { heading: 'ИНФРАСТРУКТУРА', content: '', imageGrid: '1x2', images: [] as string[] }
    case 'gallery':
      return { heading: 'Галерея', imageGrid: '3x1', images: [] as string[] }
    case 'characteristics':
      return { heading: 'Характеристики', items: defaultCharItems.map((x) => ({ ...x })) }
    case 'layout':
      return { heading: 'Планировка' }
    case 'grid':
      return { heading: 'Сетка', imageGrid: '2x2', images: [] as string[] }
    case 'contacts':
      return { heading: 'Контакты', phone: '', email: '', address: '', imageGrid: '1x2', images: [] as string[] }
    default:
      return {}
  }
}

function addSlide(type: string) {
  const newSlide: SlideItem = {
    id: genSlideId(),
    type,
    data: getDefaultDataForType(type),
    hidden: false,
  }
  slides.value.push(newSlide)
  const idx = slides.value.length - 1
  nextTick(() => goToSlide(idx))
}

function duplicateSlide(index: number) {
  const slide = slides.value[index]
  const copy: SlideItem = {
    id: genSlideId(),
    type: slide.type,
    data: JSON.parse(JSON.stringify(slide.data)),
    hidden: slide.hidden,
  }
  slides.value.splice(index + 1, 0, copy)
  nextTick(() => goToSlide(index + 1))
}

function deleteSlide(index: number) {
  slides.value.splice(index, 1)
  const newIndex = Math.min(activeSlideIndex.value, Math.max(0, slides.value.length - 1))
  activeSlideIndex.value = newIndex
  nextTick(() => {
    const slide = slides.value[newIndex]
    if (slide && !slide.hidden) {
      const visibleIdx = visibleSlides.value.findIndex((s) => s.id === slide.id)
      if (visibleIdx >= 0) swiperInstance.value?.slideTo(visibleIdx)
    }
  })
}

function onDragEnd() {
  const visibleIdx = swiperInstance.value?.activeIndex ?? 0
  const slide = visibleSlides.value[visibleIdx]
  if (slide) {
    const fullIdx = slides.value.findIndex((s) => s.id === slide.id)
    if (fullIdx >= 0) activeSlideIndex.value = fullIdx
  }
}

const MAX_CHARACTERISTICS = 12

function charItems(slide: SlideItem): Array<{ label: string; value: string }> {
  const items = slide.data?.items
  if (!Array.isArray(items) || items.length === 0) {
    slide.data.items = defaultCharItems.map((x) => ({ ...x }))
    return slide.data.items as Array<{ label: string; value: string }>
  }
  return items as Array<{ label: string; value: string }>
}

function addCharacteristicItem(slide: SlideItem) {
  const arr = charItems(slide)
  if (arr.length >= MAX_CHARACTERISTICS) return
  if (!Array.isArray(slide.data?.items)) slide.data.items = []
  ;(slide.data.items as Array<{ label: string; value: string }>).push({
    label: '',
    value: '',
  })
}

function removeCharacteristicItem(slide: SlideItem, index: number) {
  const arr = slide.data?.items as Array<{ label: string; value: string }> | undefined
  if (Array.isArray(arr) && arr.length > 1) {
    arr.splice(index, 1)
  }
}

function infraItems(slide: SlideItem): string[] {
  if (!Array.isArray(slide.data?.items)) {
    slide.data.items = ['Пункт 1', 'Пункт 2', 'Пункт 3']
  }
  return slide.data.items as string[]
}

function addInfraItem(slide: SlideItem) {
  const arr = infraItems(slide)
  arr.push('')
}

function removeInfraItem(slide: SlideItem, index: number) {
  const arr = slide.data?.items as string[] | undefined
  if (Array.isArray(arr) && arr.length > 1) {
    arr.splice(index, 1)
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Загрузить изображение на сервер; возвращает URL для сохранения в слайде (в БД хранится только URL) */
async function uploadPresentationImage(file: File): Promise<string> {
  const base = getApiBase()
  const path = '/api/upload/presentation-image' + (presentationId.value ? `?presentationId=${encodeURIComponent(presentationId.value)}` : '')
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || res.statusText)
  }
  const data = (await res.json()) as { url?: string }
  if (!data?.url) throw new Error('Нет URL в ответе')
  return data.url
}

async function onSingleImageUpload(
  slide: SlideItem,
  event: Event,
  field: string
) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    if (hasApi() && getToken()) {
      try {
        slide.data[field] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    const dataUrl = await readFileAsDataUrl(file)
    slide.data[field] = dataUrl
  } finally {
    input.value = ''
  }
}

async function onGalleryImageUpload(slide: SlideItem, event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!Array.isArray(slide.data.images)) slide.data.images = []
  const arr = slide.data.images as string[]
  while (arr.length <= index) arr.push('')
  try {
    if (hasApi() && getToken()) {
      try {
        arr[index] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    arr[index] = await readFileAsDataUrl(file)
  } finally {
    input.value = ''
  }
}

async function onGridImageUpload(slide: SlideItem, event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!Array.isArray(slide.data.images)) slide.data.images = []
  const arr = slide.data.images as string[]
  while (arr.length <= index) arr.push('')
  try {
    if (hasApi() && getToken()) {
      try {
        arr[index] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    arr[index] = await readFileAsDataUrl(file)
  } finally {
    input.value = ''
  }
}

async function onContactsImageUpload(slide: SlideItem, event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!Array.isArray(slide.data.images)) slide.data.images = []
  const arr = slide.data.images as string[]
  while (arr.length <= index) arr.push('')
  try {
    if (hasApi() && getToken()) {
      try {
        arr[index] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    arr[index] = await readFileAsDataUrl(file)
  } finally {
    input.value = ''
  }
}

function galleryImages(slide: SlideItem): string[] {
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return ['', '', '', '']
  const out = [...arr]
  while (out.length < 4) out.push('')
  return out.slice(0, 4)
}

function galleryImages3(slide: SlideItem): string[] {
  return imageSlotsForSlide(slide)
}

function gridImages(slide: SlideItem): string[] {
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return ['', '', '', '', '', '']
  const out = [...arr]
  while (out.length < 6) out.push('')
  return out.slice(0, 6)
}

function gridImages4(slide: SlideItem): string[] {
  return imageSlotsForSlide(slide)
}

/** Слоты изображений по выбранной сетке (массив длины cols×rows) */
function imageSlotsForSlide(slide: SlideItem): string[] {
  const limit = getImageGridLimit(slide)
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return Array(limit).fill('')
  const out = [...arr]
  while (out.length < limit) out.push('')
  return out.slice(0, limit)
}

function descriptionImages(slide: SlideItem): string[] {
  return imageSlotsForSlide(slide)
}

async function onDescriptionImageUpload(slide: SlideItem, event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!Array.isArray(slide.data.images)) slide.data.images = []
  const arr = slide.data.images as string[]
  while (arr.length <= index) arr.push('')
  try {
    if (hasApi() && getToken()) {
      try {
        arr[index] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    arr[index] = await readFileAsDataUrl(file)
  } finally {
    input.value = ''
  }
}

function infrastructureImages(slide: SlideItem): string[] {
  return imageSlotsForSlide(slide)
}

async function onInfrastructureImageUpload(slide: SlideItem, event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!Array.isArray(slide.data.images)) slide.data.images = []
  const arr = slide.data.images as string[]
  while (arr.length <= index) arr.push('')
  try {
    if (hasApi() && getToken()) {
      try {
        arr[index] = await uploadPresentationImage(file)
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    arr[index] = await readFileAsDataUrl(file)
  } finally {
    input.value = ''
  }
}

const presentationId = computed(() => route.params.id as string)

watch(slides, () => {
  if (initialLoadDone.value) scheduleAutoSave()
}, { deep: true })

function backupToLocalStorage() {
  try {
    const title = (slides.value[0]?.type === 'cover' && slides.value[0]?.data?.title)
      ? String(slides.value[0].data.title).trim() || 'Без названия'
      : 'Без названия'
    localStorage.setItem(`presentation-${presentationId.value}`, JSON.stringify({ slides: slides.value }))
    const listRaw = localStorage.getItem('presentations-list')
    if (listRaw) {
      const list = JSON.parse(listRaw)
      const item = list.find((p: { id: string }) => p.id === presentationId.value)
      if (item) {
        item.title = title
        item.updatedAt = new Date().toISOString()
        localStorage.setItem('presentations-list', JSON.stringify(list))
      }
    }
  } catch {
    // ignore
  }
}

let editorMounted = true
onMounted(async () => {
  if (route.path === '/dashboard/presentations/new') {
    router.replace('/dashboard/presentations')
    return
  }
  const id = presentationId.value
  if (hasApi() && getToken()) {
    try {
      const data = await api.get<PresentationFull & { status?: string; isPublic?: boolean; publicUrl?: string; publicHash?: string }>(`/api/presentations/${id}`)
      if (!editorMounted) return
      if (data?.content?.slides && Array.isArray(data.content.slides) && data.content.slides.length) {
        slides.value = (data.content.slides as SlideItem[]).map((s) => ({
          ...s,
          id: s.id ?? genSlideId(),
          hidden: s.hidden ?? false,
        }))
      }
      const coverSlide = slides.value.find((s) => s.type === 'cover')
      if (coverSlide && data?.coverImage) {
        if (!coverSlide.data) coverSlide.data = {}
        coverSlide.data.coverImageUrl = data.coverImage
      }
      if (data?.status != null) presentationMeta.value.status = data.status
      if (data?.isPublic != null) presentationMeta.value.isPublic = data.isPublic
      if (data?.publicUrl != null) presentationMeta.value.publicUrl = data.publicUrl
      if (data?.publicHash != null) presentationMeta.value.publicHash = data.publicHash
    } catch {
      if (editorMounted) loadFromLocalStorage()
    }
  } else {
    loadFromLocalStorage()
  }
  if (editorMounted) nextTick(() => { initialLoadDone.value = true })
  window.addEventListener('beforeunload', backupToLocalStorage)
})

onBeforeUnmount(() => {
  editorMounted = false
  window.removeEventListener('beforeunload', backupToLocalStorage)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (addressSuggestionsBlurTimer) clearTimeout(addressSuggestionsBlurTimer)
  if (addressSuggestionsFetchTimer) clearTimeout(addressSuggestionsFetchTimer)
})

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(`presentation-${presentationId.value}`)
    if (raw) {
      const saved = JSON.parse(raw)
      if (Array.isArray(saved.slides) && saved.slides.length) {
        slides.value = saved.slides.map((s: SlideItem) => ({
          ...s,
          id: s.id ?? genSlideId(),
          hidden: s.hidden ?? false,
        }))
      }
    }
  } catch {
    // keep default slides
  }
}

async function doSave(options?: { status?: string; skipRedirect?: boolean }) {
  const cover = slides.value.find((s) => s.type === 'cover')
  const title = (cover?.type === 'cover' && cover.data?.title)
    ? String(cover.data.title).trim() || 'Без названия'
    : 'Без названия'
  const coverImage = (cover?.type === 'cover' && cover.data?.coverImageUrl) ? String(cover.data.coverImageUrl) : undefined
  const content = { slides: slides.value }
  const status = options?.status
  const skipRedirect = options?.skipRedirect ?? false

  if (hasApi() && getToken()) {
    try {
      const body: { title: string; coverImage?: string; content: { slides: SlideItem[] }; status?: string } = { title, coverImage, content }
      if (status !== undefined) body.status = status
      const data = await api.put<PresentationFull & { status?: string; isPublic?: boolean; publicUrl?: string; publicHash?: string }>(`/api/presentations/${presentationId.value}`, body)
      if (data?.status != null) presentationMeta.value.status = data.status
      if (data?.isPublic != null) presentationMeta.value.isPublic = data.isPublic
      if (data?.publicUrl != null) presentationMeta.value.publicUrl = data.publicUrl
      if (data?.publicHash != null) presentationMeta.value.publicHash = data.publicHash
      if (!skipRedirect) router.push('/dashboard/presentations')
      return true
    } catch {
      if (!skipRedirect) saveToLocalStorage()
      return false
    }
  }
  saveToLocalStorage(skipRedirect)
  return true
}

async function saveToStorage() {
  await doSave()
}

async function publishPresentation() {
  autoSaveStatus.value = 'Публикация...'
  const ok = await doSave({ status: 'published', skipRedirect: true })
  autoSaveStatus.value = ok ? 'Опубликовано' : 'Ошибка'
  if (ok) setTimeout(() => { autoSaveStatus.value = '' }, 2000)
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    autoSaveStatus.value = 'Сохранение...'
    const ok = await doSave({ skipRedirect: true })
    autoSaveStatus.value = ok ? 'Сохранено' : ''
    if (ok) setTimeout(() => { autoSaveStatus.value = '' }, 2000)
  }, AUTO_SAVE_INTERVAL_MS)
}

function saveToLocalStorage(skipRedirect = false) {
  const title = (slides.value[0]?.type === 'cover' && slides.value[0]?.data?.title)
    ? String(slides.value[0].data.title).trim() || 'Без названия'
    : 'Без названия'
  localStorage.setItem(
    `presentation-${presentationId.value}`,
    JSON.stringify({ slides: slides.value })
  )
  const listRaw = localStorage.getItem('presentations-list')
  if (listRaw) {
    const list = JSON.parse(listRaw)
    const item = list.find((p: { id: string }) => p.id === presentationId.value)
    if (item) {
      item.title = title
      item.updatedAt = new Date().toISOString()
      localStorage.setItem('presentations-list', JSON.stringify(list))
    }
  }
  if (!skipRedirect) router.push('/dashboard/presentations')
}

/** Вставка текста без форматирования (очистка от стилей слайда) */
function onPasteStripFormat(e: ClipboardEvent) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (!text) return
  e.preventDefault()
  const start = target.selectionStart ?? 0
  const end = target.selectionEnd ?? 0
  const value = target.value ?? ''
  const newValue = value.slice(0, start) + text + value.slice(end)
  target.value = newValue
  const pos = start + text.length
  target.setSelectionRange(pos, pos)
}

/** Открыть страницу просмотра (владелец: по id; или публичная по hash) */
function openViewPage() {
  if (presentationMeta.value.isPublic && presentationMeta.value.publicHash) {
    window.open(`/view/${presentationMeta.value.publicHash}`, '_blank')
  } else {
    window.open(`/dashboard/presentations/${presentationId.value}/view`, '_blank')
  }
}

/** Включить/выключить публичную ссылку */
async function toggleShare() {
  if (!hasApi() || !getToken()) return
  const id = presentationId.value
  const newPublic = !presentationMeta.value.isPublic
  try {
    const data = await api.put<{ isPublic: boolean; publicUrl?: string; publicHash?: string }>(`/api/presentations/${id}/share`, { isPublic: newPublic })
    presentationMeta.value.isPublic = data.isPublic
    if (data.publicUrl) presentationMeta.value.publicUrl = data.publicUrl
    if (data.publicHash) presentationMeta.value.publicHash = data.publicHash
    if (!newPublic) presentationMeta.value.publicUrl = ''
    if (!newPublic) presentationMeta.value.publicHash = ''
  } catch (err) {
    console.error(err)
    alert('Не удалось изменить настройки доступа')
  }
}

/** Скопировать публичную ссылку в буфер */
async function copyPublicLink() {
  const url = presentationMeta.value.publicUrl
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    alert('Ссылка скопирована')
  } catch {
    alert('Не удалось скопировать ссылку')
  }
}

/** Экспорт презентации в PDF */
async function exportToPDF() {
  if (!hasApi() || !getToken()) {
    alert('Необходима авторизация для экспорта в PDF')
    return
  }
  
  // Сначала сохраняем презентацию
  autoSaveStatus.value = 'Сохранение перед экспортом...'
  const saved = await doSave({ skipRedirect: true })
  if (!saved) {
    autoSaveStatus.value = 'Ошибка сохранения'
    setTimeout(() => { autoSaveStatus.value = '' }, 2000)
    return
  }
  
  autoSaveStatus.value = 'Генерация PDF...'
  const id = presentationId.value
  try {
    const apiBase = getApiBase()
    const apiUrl = apiBase || (window.location.origin + '/api')
    const response = await fetch(`${apiUrl}/presentations/${id}/export-pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Ошибка при генерации PDF' }))
      throw new Error(error.error || 'Ошибка при генерации PDF')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const title = (slides.value[0]?.type === 'cover' && slides.value[0]?.data?.title)
      ? String(slides.value[0].data.title).trim() || 'presentation'
      : 'presentation'
    a.download = `${title}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    autoSaveStatus.value = 'PDF экспортирован'
    setTimeout(() => { autoSaveStatus.value = '' }, 2000)
  } catch (err) {
    console.error(err)
    autoSaveStatus.value = 'Ошибка экспорта'
    setTimeout(() => { autoSaveStatus.value = '' }, 2000)
    alert('Не удалось экспортировать презентацию в PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
  }
}
</script>

<style>
/* Слайдер: горизонтальный (альбомный) формат 16:10 */
.presentation-slider-wrap {
  aspect-ratio: 16 / 10;
  max-height: min(72vh, 640px);
  width: 100%;
}
@media (max-width: 1023px) {
  .presentation-slider-wrap {
    min-height: min(50vh, 360px);
    max-height: min(70vh, 500px);
  }
}
.presentation-swiper {
  height: 100%;
}
.presentation-swiper .swiper-slide {
  height: 100%;
}
</style>
