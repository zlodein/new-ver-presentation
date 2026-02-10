<template>
  <AdminLayout>
    <div class="flex flex-col gap-4">
      <!-- Публичная ссылка активна (при включённом «Поделиться») -->
      <div
        v-if="presentationMeta.isPublic && presentationMeta.publicUrl"
        class="cursor-pointer rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200"
        title="Нажмите, чтобы скопировать ссылку"
        @click="copyPublicLink"
      >
        Публичная ссылка активна
      </div>

      <!-- Оповещение автосохранения (стили как в /dashboard/alerts) -->
      <div
        v-if="autoSaveStatus"
        :class="['rounded-xl border p-4', autoSaveAlertClasses.container]"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-center gap-3">
          <div :class="['shrink-0', autoSaveAlertClasses.icon]">
            <component :is="autoSaveAlertIcon" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">
              {{ autoSaveAlertTitle }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ autoSaveAlertMessage }}
            </p>
          </div>
        </div>
      </div>

      <!-- Панель со слайдами: на ПК — горизонтальная лента, на мобильных — кнопка + раскрывающийся вертикальный список -->
      <div class="editor-slides-nav flex flex-col gap-0 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center md:gap-1.5 md:p-1.5">
        <!-- Мобильная: кнопка «Навигация по слайдам» со стрелкой -->
        <button
          type="button"
          class="editor-slides-nav__mob-trigger flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left md:hidden"
          :class="showMobSlidesNav ? 'bg-gray-100 dark:bg-gray-700' : ''"
          :aria-expanded="showMobSlidesNav"
          @click="showMobSlidesNav = !showMobSlidesNav"
        >
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Навигация по слайдам</span>
          <svg
            class="h-5 w-5 shrink-0 text-gray-500 transition-transform dark:text-gray-400"
            :class="{ 'rotate-180': showMobSlidesNav }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <!-- Мобильная: раскрытый список слайдов (вертикально) -->
        <div
          v-show="showMobSlidesNav"
          class="slides-strip-mob max-h-[60vh] overflow-y-auto border-t border-gray-200 py-2 dark:border-gray-700 md:hidden"
        >
          <draggable
            v-model="slides"
            item-key="id"
            handle=".slide-drag-handle"
            @end="onDragEnd"
            @move="onDragMove"
            class="flex flex-col gap-2 px-2"
          >
            <template #item="{ element: slide, index }">
              <div
                :data-slide-index="index"
                :class="[
                  'slide-item-mob flex items-center gap-3 rounded-lg border px-3 py-2.5 transition',
                  activeSlideIndex === index
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                  slide.hidden ? 'opacity-60' : '',
                ]"
              >
                <span
                  class="slide-drag-handle flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-400 active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Перетащить"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </span>
                <button
                  type="button"
                  class="min-w-0 flex-1 truncate text-left text-base font-medium"
                  :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                  @click="goToSlide(index)"
                >
                  {{ getSlideLabel(slide) }}
                </button>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                    @click.stop="toggleSlideVisibility(index)"
                  >
                    <svg v-if="slide.hidden" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Дублировать"
                    @click.stop="duplicateSlide(index)"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    v-if="slides.length > 1"
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    title="Удалить"
                    @click.stop="deleteSlide(index)"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- ПК: горизонтальная лента со слайдами -->
        <div class="hidden md:flex md:flex-1 md:items-center md:gap-1.5">
          <button
            type="button"
            class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            :disabled="!canScrollLeft"
            @click="scrollSlidesLeft"
            title="Прокрутить влево"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div ref="slidesContainerRef" class="flex-1 overflow-x-auto scrollbar-hide" @scroll="onSlidesScroll">
            <div class="slides-strip flex gap-2 min-w-max">
              <draggable
                v-model="slides"
                item-key="id"
                handle=".slide-drag-handle"
                @end="onDragEnd"
                @move="onDragMove"
                class="flex gap-2"
              >
                <template #item="{ element: slide, index }">
                  <div
                    :data-slide-index="index"
                    :class="[
                      'flex items-center gap-1 rounded-lg border px-1.5 py-1 transition shrink-0',
                      activeSlideIndex === index
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                      slide.hidden ? 'opacity-60' : '',
                    ]"
                  >
                    <span
                      class="slide-drag-handle cursor-grab touch-none p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Перетащить"
                    >
                      <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                      </svg>
                    </span>
                    <button
                      type="button"
                      class="min-w-0 truncate text-xs font-medium transition whitespace-nowrap"
                      :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                      @click="goToSlide(index)"
                    >
                      {{ getSlideLabel(slide) }}
                    </button>
                    <div class="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                        @click.stop="toggleSlideVisibility(index)"
                      >
                        <svg v-if="slide.hidden" class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <svg v-else class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.031 11.117A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-1.563 3.029m5.858-.908a3 3 0 11-4.243-4.243M9.88 9.88a4.5 4.5 0 106.262-6.262" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        title="Дублировать"
                        @click.stop="duplicateSlide(index)"
                      >
                        <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        v-if="slides.length > 1"
                        type="button"
                        class="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        title="Удалить"
                        @click.stop="deleteSlide(index)"
                      >
                        <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            :disabled="!canScrollRight"
            @click="scrollSlidesRight"
            title="Прокрутить вправо"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Кнопка "Добавить слайд" с выпадающим меню (скрыта на мобильных — есть в нижней панели) -->
        <div ref="addSlideWrapRef" class="relative hidden shrink-0 md:block">
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showAddSlideMenu = !showAddSlideMenu"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Добавить</span>
            <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <!-- Выпадающее меню -->
          <div
            v-if="showAddSlideMenu"
            ref="addSlideMenuRef"
            class="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            @click.stop
          >
            <div class="py-1">
              <button
                v-for="opt in SLIDE_TYPE_OPTIONS"
                :key="opt.type"
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="addSlide(opt.type); showAddSlideMenu = false"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Область превью слайдов (Swiper) -->
      <main class="w-full">
        <div
          class="editor-slider-wrap rounded-2xl border border-gray-200 bg-gray-50 p-0 dark:border-gray-800 dark:bg-gray-900/50 md:p-4 lg:p-6"
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

                  <!-- 4. Местоположение: 50% карта слева, 50% справа поиск по адресу и поиск метро -->
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
                      <div class="booklet-map__left flex flex-col gap-2 min-h-0">
                        <div class="booklet-map__img flex-1 min-h-0">
                          <LocationMap
                            :key="slide.id"
                            :lat="Number(slide.data?.lat)"
                            :lng="Number(slide.data?.lng)"
                          />
                        </div>
                      </div>
                      <div class="booklet-map__content flex flex-col gap-2 min-h-0">
                        <div class="booklet-map__info relative flex-shrink-0">
                          <div class="relative mb-2">
                            <label class="mb-1 block text-xs font-medium text-gray-600">Поиск по адресу</label>
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
                            class="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
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

                  <!-- 5. Галерея 3 фото (как на presentation-realty.ru/view) -->
                  <div
                    v-else-if="slide.type === 'gallery'"
                    class="booklet-content booklet-galery"
                  >
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

                  <!-- 8. Планировка: 100% изображение по ширине и высоте -->
                  <div
                    v-else-if="slide.type === 'layout'"
                    class="booklet-content booklet-layout"
                  >
                    <div class="booklet-layout__wrap">
                      <div class="booklet-layout__title-wrapper flex-shrink-0">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="ПЛАНИРОВКА"
                          class="booklet-layout__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                        />
                      </div>
                      <div class="booklet-layout__img relative flex-1 min-h-0">
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

                  <!-- 9. Контакты: 50% слева аватар/лого + список контактов, 50% справа изображение -->
                  <div
                    v-else-if="slide.type === 'contacts'"
                    class="booklet-content booklet-contacts"
                  >
                    <div class="booklet-contacts__wrap">
                      <div class="booklet-contacts__left">
                        <div class="booklet-contacts__avatar-wrap">
                          <div class="booklet-contacts__avatar relative">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="onContactsAvatarUpload(slide, $event)"
                              />
                            </label>
                            <img v-if="slide.data?.avatarUrl || slide.data?.logoUrl" :src="String(slide.data?.avatarUrl ?? slide.data?.logoUrl)" alt="">
                          </div>
                          <span class="text-xs text-gray-500">Аватар риэлтора / лого компании</span>
                        </div>
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
                      </div>
                      <div class="booklet-contacts__block booklet-contacts__img relative">
                        <label class="booklet-upload-btn cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onContactsImageUpload(slide, $event, 0)"
                          />
                        </label>
                        <img v-if="contactImageUrl(slide)" :src="contactImageUrl(slide)!" alt="">
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

          <div class="editor-actions mt-4 flex flex-wrap items-center gap-[30px]">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="prevSlide"
              title="Назад"
              aria-label="Назад"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-sm text-gray-500">
              {{ visibleSlideNumber }} / {{ visibleSlides.length }}
            </span>
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="nextSlide"
              title="Далее"
              aria-label="Далее"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
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
          </div>

          <!-- Мобильная нижняя панель: навигация, добавить, просмотр, сохранение, публичная ссылка -->
          <div class="mob-editor-buttons fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-3 safe-area-pb dark:border-gray-700 dark:bg-gray-800 md:hidden">
            <button
              type="button"
              class="mob-editor-buttons__prev inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition"
              :class="visibleSlideNumber <= 1
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
              :disabled="visibleSlideNumber <= 1"
              title="Назад"
              @click="prevSlide"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              class="mob-editor-buttons__next inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition"
              :class="visibleSlideNumber >= visibleSlides.length
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
              :disabled="visibleSlideNumber >= visibleSlides.length"
              title="Вперёд"
              @click="nextSlide"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div class="relative">
              <button
                type="button"
                class="mob-editor-buttons__add flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
                title="Добавить слайд"
                @click.stop="showAddSlideMenu = !showAddSlideMenu"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div
                v-if="showAddSlideMenu"
                ref="mobAddSlideMenuRef"
                data-mob-add-menu
                class="absolute bottom-full left-1/2 z-[110] mb-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                @click.stop
              >
                <div class="max-h-64 overflow-y-auto py-1">
                  <button
                    v-for="opt in SLIDE_TYPE_OPTIONS"
                    :key="opt.type"
                    type="button"
                    class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    @click="addSlide(opt.type); showAddSlideMenu = false"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Просмотр"
              @click="openViewPage"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
              title="Сохранить"
              @click="saveToStorage"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-4 0l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              title="Экспорт в PDF"
              @click="exportToPDF"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <!-- Публичная ссылка: глобус (вкл) / глобус перечёркнут (выкл) -->
            <button
              type="button"
              class="mob-editor-buttons__share inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition"
              :class="presentationMeta.isPublic
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600'"
              :title="presentationMeta.isPublic ? 'Публичная ссылка включена' : 'Поделиться (включить публичную ссылку)'"
              aria-label="Публичная ссылка"
              @click="toggleShare"
            >
              <!-- Глобус (ссылка вкл) — круг + меридиан -->
              <svg v-if="presentationMeta.isPublic" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2 12h20" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 2a9 9 0 0 1 6 10 9 9 0 0 1-6 10 9 9 0 0 1-6-10 9 9 0 0 1 6-10z" />
              </svg>
              <!-- Глобус перечёркнут (ссылка выкл) — тот же глобус + диагональ -->
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2 12h20" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 2a9 9 0 0 1 6 10 9 9 0 0 1-6 10 9 9 0 0 1-6-10 9 9 0 0 1 6-10z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 5l14 14" />
              </svg>
            </button>
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
import { SuccessIcon, ErrorIcon, InfoCircleIcon } from '@/icons'
import { api, hasApi, getToken, getApiBase } from '@/api/client'
import type { PresentationFull } from '@/api/client'

const route = useRoute()
const router = useRouter()

const SLIDE_TYPE_LABELS: Record<string, string> = {
  cover: 'Обложка',
  description: 'Описание',
  infrastructure: 'Инфраструктура',
  location: 'Местоположение',
  gallery: 'Галерея',
  characteristics: 'Характеристики',
  layout: 'Планировка',
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
  contacts: '1x1',
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
  { type: 'gallery', label: 'Галерея' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'layout', label: 'Планировка' },
  { type: 'contacts', label: 'Контакты' },
]

const SLIDE_TYPES = [
  { type: 'cover', label: 'Обложка' },
  { type: 'description', label: 'Описание' },
  { type: 'infrastructure', label: 'Инфраструктура' },
  { type: 'location', label: 'Местоположение' },
  { type: 'gallery', label: 'Галерея' },
  { type: 'characteristics', label: 'Характеристики' },
  { type: 'layout', label: 'Планировка' },
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
const slidesContainerRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const showAddSlideMenu = ref(false)
const showMobSlidesNav = ref(false)

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
/** Интервал автосохранения после последнего изменения (промежуточное сохранение без кнопки) */
const AUTO_SAVE_INTERVAL_MS = 12000
const initialLoadDone = ref(false)

/** Стили и иконка оповещения автосохранения (как в /dashboard/alerts) */
const AUTO_SAVE_ALERT = {
  success: {
    container: 'border-success-500 bg-success-50 dark:border-success-500/30 dark:bg-success-500/15',
    icon: 'text-success-500',
  },
  error: {
    container: 'border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15',
    icon: 'text-error-500',
  },
  info: {
    container: 'border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15',
    icon: 'text-blue-light-500',
  },
}
const autoSaveAlertVariant = computed(() => {
  const s = autoSaveStatus.value
  if (s === 'Сохранено' || s === 'Опубликовано' || s === 'PDF экспортирован') return 'success'
  if (s === 'Ошибка' || s === 'Ошибка сохранения' || s === 'Ошибка экспорта') return 'error'
  return 'info'
})
const autoSaveAlertClasses = computed(() => AUTO_SAVE_ALERT[autoSaveAlertVariant.value])
const autoSaveAlertIcon = computed(() => {
  const v = autoSaveAlertVariant.value
  if (v === 'success') return SuccessIcon
  if (v === 'error') return ErrorIcon
  return InfoCircleIcon
})
const autoSaveAlertTitle = computed(() => autoSaveStatus.value || 'Автосохранение')
const autoSaveAlertMessage = computed(() => {
  const s = autoSaveStatus.value
  if (s === 'Сохранено' || s === 'Опубликовано' || s === 'PDF экспортирован') return 'Изменения сохранены. Кнопка «Сохранить» доступна для ручного сохранения в любой момент.'
  if (s === 'Ошибка' || s === 'Ошибка сохранения' || s === 'Ошибка экспорта') return 'Попробуйте нажать «Сохранить» вручную или проверьте подключение.'
  return 'Изменения сохраняются автоматически через несколько секунд после правок. Кнопка «Сохранить» — для ручного сохранения.'
})

/** Слайды, отображаемые в Swiper (без скрытых) */
const visibleSlides = computed(() => slides.value.filter((s) => !s.hidden))

/** Текущий слайд по активному индексу (для панели управления на мобильных) */
const currentSlide = computed(() => slides.value[activeSlideIndex.value] ?? null)

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
    case 'contacts':
      return { heading: 'Контакты', phone: '', email: '', address: '', avatarUrl: '', contactImageUrl: '', images: [] as string[] }
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
  
  // Устанавливаем активный слайд
  activeSlideIndex.value = idx
  
  // Прокручиваем список к новому слайду с задержкой для обновления DOM
  nextTick(() => {
    goToSlide(idx)
    setTimeout(() => {
      scrollToSlideInList(idx)
    }, 100)
  })
}

// Прокрутка списка слайдов к указанному индексу
function scrollToSlideInList(index: number) {
  if (!slidesContainerRef.value) return
  
  // Используем несколько nextTick для гарантии, что DOM обновлен
  nextTick(() => {
    nextTick(() => {
      const container = slidesContainerRef.value
      if (!container) return
      
      // Находим элемент слайда в DOM по data-slide-index
      const slideElements = container.querySelectorAll('[data-slide-index]')
      let targetElement: HTMLElement | undefined
      
      for (let i = 0; i < slideElements.length; i++) {
        const el = slideElements[i] as HTMLElement
        const slideIdx = parseInt(el.getAttribute('data-slide-index') || '-1')
        if (slideIdx === index) {
          targetElement = el
          break
        }
      }
      
      if (targetElement) {
        // Используем scrollIntoView для более надежной прокрутки
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      } else {
        // Fallback: прокручиваем вручную
        const containerRect = container.getBoundingClientRect()
        const scrollLeft = container.scrollLeft
        const estimatedWidth = 150 // Примерная ширина одного слайда
        const targetScrollLeft = index * estimatedWidth
        
        container.scrollTo({
          left: Math.max(0, targetScrollLeft - containerRect.width / 2),
          behavior: 'smooth'
        })
      }
      
      updateScrollButtons()
    })
  })
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
  // Очищаем интервал авто-прокрутки
  if (dragScrollInterval) {
    clearInterval(dragScrollInterval)
    dragScrollInterval = null
  }
  
  const visibleIdx = swiperInstance.value?.activeIndex ?? 0
  const slide = visibleSlides.value[visibleIdx]
  if (slide) {
    const fullIdx = slides.value.findIndex((s) => s.id === slide.id)
    if (fullIdx >= 0) {
      activeSlideIndex.value = fullIdx
      // Прокручиваем к перетащенному слайду
      nextTick(() => scrollToSlideInList(fullIdx))
    }
  }
  updateScrollButtons()
}

// Авто-прокрутка при перетаскивании слайда
let dragScrollInterval: ReturnType<typeof setInterval> | null = null
function onDragMove(event: { relatedContext: { index: number } }) {
  if (!slidesContainerRef.value) return
  
  const container = slidesContainerRef.value
  
  // Очищаем предыдущий интервал
  if (dragScrollInterval) {
    clearInterval(dragScrollInterval)
  }
  
  // Создаем интервал для авто-прокрутки
  dragScrollInterval = setInterval(() => {
    if (!container) {
      if (dragScrollInterval) {
        clearInterval(dragScrollInterval)
        dragScrollInterval = null
      }
      return
    }
    
    const containerRect = container.getBoundingClientRect()
    const mouseX = (window as any).dragMouseX ?? containerRect.left + containerRect.width / 2
    
    const scrollZone = 80 // Зона прокрутки от краев
    const scrollSpeed = 15
    
    if (mouseX < containerRect.left + scrollZone) {
      // Прокрутка влево
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed)
      updateScrollButtons()
    } else if (mouseX > containerRect.right - scrollZone) {
      // Прокрутка вправо
      container.scrollLeft = Math.min(
        container.scrollWidth - container.clientWidth,
        container.scrollLeft + scrollSpeed
      )
      updateScrollButtons()
    }
  }, 16) // ~60fps
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
  try {
    if (hasApi() && getToken()) {
      try {
        const url = await uploadPresentationImage(file)
        slide.data.contactImageUrl = url
        if (!Array.isArray(slide.data.images)) slide.data.images = []
        const arr = slide.data.images as string[]
        arr[0] = url
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    const dataUrl = await readFileAsDataUrl(file)
    slide.data.contactImageUrl = dataUrl
    if (!Array.isArray(slide.data.images)) slide.data.images = []
    const arr = slide.data.images as string[]
    arr[0] = dataUrl
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

function locationImages(slide: SlideItem): string[] {
  return imageSlotsForSlide(slide)
}

async function onLocationImageUpload(slide: SlideItem, event: Event, index: number) {
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

function contactImageUrl(slide: SlideItem): string | undefined {
  const url = slide.data?.contactImageUrl
  if (url) return String(url)
  const images = slide.data?.images
  if (Array.isArray(images) && images[0]) return String(images[0])
  return undefined
}

async function onContactsAvatarUpload(slide: SlideItem, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    if (hasApi() && getToken()) {
      try {
        const url = await uploadPresentationImage(file)
        slide.data.avatarUrl = url
        slide.data.logoUrl = url
        return
      } catch (e) {
        console.warn('Загрузка на сервер не удалась, сохраняю как data URL:', e)
      }
    }
    const dataUrl = await readFileAsDataUrl(file)
    slide.data.avatarUrl = dataUrl
    slide.data.logoUrl = dataUrl
  } finally {
    input.value = ''
  }
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

// Функции для прокрутки слайдов
function updateScrollButtons() {
  if (!slidesContainerRef.value) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const container = slidesContainerRef.value
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 1
}

function scrollSlidesLeft() {
  if (slidesContainerRef.value) {
    slidesContainerRef.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}

function scrollSlidesRight() {
  if (slidesContainerRef.value) {
    slidesContainerRef.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}

function onSlidesScroll() {
  updateScrollButtons()
}

// Обработчик клика вне меню "Добавить слайд"
const addSlideMenuRef = ref<HTMLElement | null>(null)
const addSlideWrapRef = ref<HTMLElement | null>(null)
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const inDesktopWrap = addSlideWrapRef.value?.contains(target)
  const inMobileAdd = target.closest('.mob-editor-buttons__add') || target.closest('[data-mob-add-menu]')
  if (inDesktopWrap || inMobileAdd) return
  showAddSlideMenu.value = false
}

let editorMounted = true
onMounted(async () => {
  // Обработчик клика вне меню
  document.addEventListener('click', handleClickOutside)
  
  // Обновляем состояние кнопок прокрутки
  nextTick(() => {
    updateScrollButtons()
    watch(slides, () => {
      nextTick(() => updateScrollButtons())
    }, { deep: true })
  })
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
  
  // Отслеживание позиции мыши при перетаскивании
  document.addEventListener('mousemove', (e) => {
    (window as any).dragMouseX = e.clientX
  })
  
  window.addEventListener('beforeunload', backupToLocalStorage)
})

onBeforeUnmount(() => {
  editorMounted = false
  window.removeEventListener('beforeunload', backupToLocalStorage)
  document.removeEventListener('click', handleClickOutside)
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
/* Слайдер: горизонтальный А4 (297×210) - увеличенная высота */
.presentation-slider-wrap {
  aspect-ratio: 297 / 210;
  max-height: min(80vh, 720px);
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

/* Оптимизация мобильного редактора */
@media (max-width: 768px) {
  /* Увеличиваем размеры кнопок загрузки изображений для удобства на мобильных */
  .presentation-slider-wrap.booklet-view .booklet-upload-btn {
    opacity: 0.3;
    min-height: 60px;
  }
  
  .presentation-slider-wrap.booklet-view .booklet-upload-btn::after {
    width: 56px;
    height: 56px;
    background-size: 28px;
  }
  
  /* Улучшаем видимость кнопок загрузки на мобильных */
  .presentation-slider-wrap.booklet-view [class*='__img']:active .booklet-upload-btn,
  .presentation-slider-wrap.booklet-view .booklet-main__img:active .booklet-upload-btn,
  .presentation-slider-wrap.booklet-view .booklet-img__img:active .booklet-upload-btn,
  .presentation-slider-wrap.booklet-view .booklet-galery__img:active .booklet-upload-btn {
    opacity: 0.7;
  }
  
  /* Увеличиваем размеры элементов управления в редакторе */
  .presentation-slider-wrap.booklet-view input[type="text"],
  .presentation-slider-wrap.booklet-view input[type="email"],
  .presentation-slider-wrap.booklet-view textarea,
  .presentation-slider-wrap.booklet-view select {
    font-size: 16px; /* Предотвращает зум на iOS */
    min-height: 44px; /* Минимальный размер для удобного нажатия */
    padding: 10px 12px;
  }
  
  /* Улучшаем кнопки в редакторе */
  .presentation-slider-wrap.booklet-view button {
    min-height: 44px;
    padding: 10px 16px;
    font-size: 15px;
  }
  
  /* Улучшаем панель слайдов на мобильных */
  .presentation-slider-wrap.booklet-view ~ * aside {
    max-height: 40vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Улучшаем элементы списка слайдов */
  .presentation-slider-wrap.booklet-view ~ * .slide-drag-handle {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Улучшаем кнопки управления слайдами */
  .presentation-slider-wrap.booklet-view ~ * button[title] {
    min-width: 44px;
    min-height: 44px;
  }
  
  /* Улучшаем поля ввода в слайдах */
  .presentation-slider-wrap.booklet-view .booklet-main__content input,
  .presentation-slider-wrap.booklet-view .booklet-info__text textarea,
  .presentation-slider-wrap.booklet-view .booklet-stroen__text textarea {
    font-size: 16px;
    min-height: 44px;
  }
  
  /* Улучшаем селекты сетки изображений */
  .presentation-slider-wrap.booklet-view select {
    min-height: 44px;
    padding: 8px 12px;
  }
  
        /* Улучшаем область загрузки изображений */
        .presentation-slider-wrap.booklet-view [class*='__img'] {
          min-height: 120px;
        }
        
        /* Улучшаем кнопки в панели управления */
        .presentation-slider-wrap.booklet-view ~ * .mt-4 button {
          min-height: 44px;
          padding: 10px 16px;
          font-size: 15px;
        }
      }
      
      /* Скрытие скроллбара для горизонтальной прокрутки слайдов */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      /* Шрифт панели слайдов (редактор): крупнее для читаемости на ПК */
      .slides-strip,
      .slides-strip button,
      .slides-strip span,
      .slides-strip [data-slide-index] button,
      .slides-strip [data-slide-index] span {
        font-size: 14px;
        line-height: 1.3;
      }

      /* --- Стили свайпера и мобильного редактора (адаптация под TailAdmin) --- */
      .presentation-swiper.swiper,
      .presentation-slider-wrap .swiper {
        padding: 0;
        overflow: hidden;
        width: 100%;
      }
      .presentation-swiper .swiper-wrapper {
        width: auto;
      }
      .presentation-swiper .swiper-slide {
        max-width: 100%;
        box-sizing: border-box;
      }

    /* Мобильная версия: скрыть десктопные действия, показать нижнюю панель */
    @media (max-width: 768px) {
      .editor-actions {
        display: none;
      }

      /* Навигация по слайдам вверху (стили mob-editor-nav) */
      .editor-slides-nav {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        border-radius: 0;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: visible;
      }
      .dark .editor-slides-nav {
        background: #1f2937;
        border-bottom-color: #374151;
      }
      /* Вертикальный список слайдов на мобильных: прокрутка */
      .editor-slides-nav .slides-strip-mob {
        -webkit-overflow-scrolling: touch;
      }
      .editor-slides-nav .slide-item-mob .slide-drag-handle {
        -webkit-tap-highlight-color: transparent;
      }

      /* На мобильных отключаем aspect-ratio, чтобы высота задавалась min/max и контент помещался с прокруткой */
      .presentation-slider-wrap {
        aspect-ratio: auto;
      }
      /* Контейнер редактора слайдов: большая высота на мобильных, чтобы контент помещался с вертикальной прокруткой */
      .presentation-slider-wrap.booklet-view {
        min-height: 60vh;
        max-height: min(85vh, calc(100vh - 160px));
        overflow-x: hidden;
        box-sizing: border-box;
      }
      .presentation-slider-wrap.booklet-view .booklet-page__inner {
        min-height: 480px;
        padding: 20px 16px;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        box-sizing: border-box;
      }

      /* Нижняя панель: отступ снизу для safe area (вырезы/индикатор) */
      .mob-editor-buttons {
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
    }
</style>
