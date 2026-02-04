<template>
  <AdminLayout>
    <!-- Форма названия и описания при создании новой презентации -->
    <div
      v-if="isNew"
      class="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50"
    >
      <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Новая презентация
      </h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Название объекта <span class="text-red-500">*</span>
          </label>
          <input
            v-model="objectName"
            type="text"
            placeholder="Введите название"
            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Описание (по желанию)
          </label>
          <textarea
            v-model="objectDescription"
            rows="2"
            placeholder="Краткое описание объекта"
            class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <!-- Панель слайдов (с названиями, удаление/дублирование/перетаскивание) -->
      <aside class="flex w-full shrink-0 flex-col gap-4 lg:w-56 xl:w-64">
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
        <div class="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-4 lg:p-6">
          <!-- Высота слайдера ограничена, на мобиле больше места под контент -->
          <div class="presentation-slider-wrap mx-auto w-full overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900">
            <Swiper
              v-bind="swiperOptions"
              @swiper="onSwiper"
              @slideChange="onSlideChange"
              class="presentation-swiper h-full"
            >
              <SwiperSlide v-for="(slide, index) in visibleSlides" :key="slide.id">
                <div class="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
                  <!-- 1. Обложка -->
                  <div
                    v-if="slide.type === 'cover'"
                    class="flex h-full flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white md:p-8"
                    :style="slide.data?.coverImageUrl ? { backgroundImage: `url(${slide.data.coverImageUrl})`, backgroundSize: 'cover' } : {}"
                  >
                    <div class="flex flex-1 flex-col justify-between">
                      <label class="mt-2 flex cursor-pointer items-center gap-2 text-sm opacity-90">
                        <input
                          type="file"
                          accept="image/*"
                          class="hidden"
                          @change="onSingleImageUpload(slide, $event, 'coverImageUrl')"
                        />
                        <span class="rounded bg-white/20 px-2 py-1">Загрузить фон</span>
                      </label>
                      <div>
                        <input
                          v-model="slide.data.title"
                          type="text"
                          placeholder="Название презентации"
                          class="w-full bg-transparent text-2xl font-bold placeholder-white/70 focus:outline-none md:text-3xl lg:text-4xl"
                        />
                        <input
                          v-model="slide.data.subtitle"
                          type="text"
                          placeholder="Подзаголовок"
                          class="mt-2 w-full bg-transparent text-base opacity-90 placeholder-white/70 focus:outline-none md:text-lg"
                        />
                      </div>
                      <div class="mt-4 flex flex-wrap items-end gap-4">
                        <!-- Тип сделки — селект как в Form Elements -->
                        <div class="min-w-[140px]">
                          <label class="mb-1.5 block text-sm font-medium text-white/90">
                            Тип сделки
                          </label>
                          <div class="relative z-20 bg-transparent">
                            <select
                              v-model="slide.data.deal_type"
                              class="h-11 w-full min-w-[140px] appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                            >
                              <option value="Аренда" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">Аренда</option>
                              <option value="Продажа" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">Продажа</option>
                            </select>
                            <span class="pointer-events-none absolute right-4 top-1/2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                              <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <!-- Цена и валюта — инпут + селект как в Form Elements -->
                        <div class="min-w-0 flex-1 sm:min-w-[200px]">
                          <label class="mb-1.5 block text-sm font-medium text-white/90">
                            Цена
                          </label>
                          <div class="flex gap-2">
                            <input
                              :value="coverPriceValue(slide)"
                              type="text"
                              :placeholder="coverPricePlaceholder(slide)"
                              class="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              @input="onCoverPriceInput(slide, ($event.target as HTMLInputElement).value)"
                            />
                            <div class="relative z-20 w-20 shrink-0 bg-transparent sm:w-24">
                              <select
                                :value="slide.data.currency"
                                class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-9 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                @change="onCoverCurrencyChange(slide, $event)"
                              >
                                <option v-for="c in CURRENCIES" :key="c.code" :value="c.code" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ c.symbol }}</option>
                              </select>
                              <span class="pointer-events-none absolute right-2 top-1/2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                <svg class="stroke-current" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <label class="flex cursor-pointer items-center gap-2 pb-2 text-sm text-white/90">
                          <input
                            v-model="slide.data.show_all_currencies"
                            type="checkbox"
                            class="h-4 w-4 rounded border-gray-400 bg-white/20 focus:ring-2 focus:ring-brand-500/30"
                          />
                          <span>Показывать все валюты</span>
                        </label>
                      </div>
                      <div v-if="slide.data?.show_all_currencies" class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm opacity-95">
                        <span v-for="line in coverConvertedPrices(slide)" :key="line" v-text="line" />
                      </div>
                    </div>
                  </div>

                  <!-- 2. Описание -->
                  <div
                    v-else-if="slide.type === 'description'"
                    class="flex h-full flex-col justify-center p-6 md:p-8"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Заголовок (Описание)"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="relative">
                      <textarea
                        :value="String(slide.data?.text ?? '')"
                        placeholder="Текст описания..."
                        rows="4"
                        class="w-full resize-none border border-gray-200 rounded-lg bg-transparent p-3 text-gray-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
                        @input="(slide.data as Record<string, string>).text = ($event.target as HTMLTextAreaElement).value"
                      />
                      <button
                        type="button"
                        class="mt-2 flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900"
                        :disabled="generateTextLoading === slide.id"
                        @click="generateTextWithAI(slide, 'description')"
                      >
                        <span v-if="generateTextLoading === slide.id" class="animate-pulse">Генерация...</span>
                        <span v-else>Сгенерировать текст (GigaChat)</span>
                      </button>
                    </div>
                  </div>

                  <!-- 3. Инфраструктура -->
                  <div
                    v-else-if="slide.type === 'infrastructure'"
                    class="flex h-full flex-col overflow-auto p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Инфраструктура"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="mb-3">
                      <textarea
                        :value="String(slide.data?.content ?? '')"
                        placeholder="Текст об инфраструктуре (опционально). Можно сгенерировать по кнопке ниже."
                        rows="2"
                        class="w-full resize-none rounded-lg border border-gray-200 bg-transparent p-2 text-sm text-gray-600 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-gray-300"
                        @input="(slide.data as Record<string, string>).content = ($event.target as HTMLTextAreaElement).value"
                      />
                    </div>
                    <ul class="space-y-2 flex-1 min-h-0 overflow-auto">
                      <li
                        v-for="(item, i) in infraItems(slide)"
                        :key="i"
                        class="flex items-center gap-2"
                      >
                        <span class="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        <input
                          v-model="(slide.data.items as string[])[i]"
                          type="text"
                          placeholder="Пункт списка"
                          class="min-w-0 flex-1 bg-transparent text-gray-600 focus:outline-none dark:text-gray-300 text-sm md:text-base"
                        />
                        <button
                          v-if="infraItems(slide).length > 1"
                          type="button"
                          class="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400"
                          title="Удалить пункт"
                          @click="removeInfraItem(slide, i)"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    </ul>
                    <button
                      type="button"
                      class="mt-2 flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900"
                      :disabled="generateTextLoading === slide.id"
                      @click="generateTextWithAI(slide, 'infrastructure')"
                    >
                      <span v-if="generateTextLoading === slide.id" class="animate-pulse">Генерация...</span>
                      <span v-else>Сгенерировать текст (GigaChat)</span>
                    </button>
                    <button
                      type="button"
                      class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500"
                      @click="addInfraItem(slide)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Добавить пункт
                    </button>
                  </div>

                  <!-- 4. Местоположение -->
                  <div
                    v-else-if="slide.type === 'location'"
                    class="flex h-full flex-col overflow-auto p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Местоположение"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="relative mb-3">
                      <input
                        :value="String(slide.data?.address ?? '')"
                        type="text"
                        placeholder="Введите адрес для подсказок и отображения на карте"
                        class="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-gray-600 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-gray-300"
                        autocomplete="off"
                        @input="(slide.data as Record<string, string>).address = ($event.target as HTMLInputElement).value; onLocationAddressInput(slide, ($event.target as HTMLInputElement).value)"
                        @focus="showAddressSuggestions(slide)"
                        @blur="hideAddressSuggestionsDelay(slide)"
                      />
                      <ul
                        v-if="addressSuggestionsFor(slide).length > 0"
                        class="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                      >
                        <li
                          v-for="(s, i) in addressSuggestionsFor(slide)"
                          :key="i"
                          class="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          @mousedown.prevent="selectAddressSuggestion(slide, s)"
                        >
                          {{ s.display_name || s.address || s }}
                        </li>
                      </ul>
                    </div>
                    <div class="relative min-h-[140px] w-full flex-1 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                      <img
                        v-if="locationMapUrl(slide)"
                        :src="locationMapUrl(slide)"
                        alt="Карта"
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="flex h-full w-full items-center justify-center text-gray-500 text-sm">
                        Укажите адрес — карта появится здесь
                      </div>
                    </div>
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        :disabled="locationMetroLoading(slide)"
                        @click="findNearestMetro(slide)"
                      >
                        {{ locationMetroLoading(slide) ? 'Поиск...' : 'Найти ближайшее метро' }}
                      </button>
                      <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input v-model="slide.data.show_metro" type="checkbox" class="rounded" />
                        Показывать метро в презентации
                      </label>
                    </div>
                    <div
                      v-if="(slide.data?.metro_stations as Array<unknown>)?.length"
                      class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Ближайшие станции метро</p>
                      <ul class="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
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

                  <!-- 5. Изображение -->
                  <div
                    v-else-if="slide.type === 'image'"
                    class="flex h-full flex-col p-4"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Заголовок (необязательно)"
                      class="mb-2 w-full bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-white/90 md:text-xl"
                    />
                    <div class="relative min-h-[120px] flex-1 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                      <img
                        v-if="slide.data?.imageUrl"
                        :src="String(slide.data.imageUrl)"
                        alt=""
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-500 text-sm">
                        <label class="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-800">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onSingleImageUpload(slide, $event, 'imageUrl')"
                          />
                          Загрузить изображение
                        </label>
                        <span>или URL:</span>
                      </div>
                    </div>
                    <input
                      v-model="slide.data.imageUrl"
                      type="text"
                      placeholder="URL изображения"
                      class="mt-2 w-full rounded border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
                    />
                  </div>

                  <!-- 6. Галерея -->
                  <div
                    v-else-if="slide.type === 'gallery'"
                    class="flex h-full flex-col p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Галерея"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="grid flex-1 grid-cols-2 gap-2 min-h-0">
                      <div
                        v-for="(img, i) in galleryImages(slide)"
                        :key="i"
                        class="relative min-h-[60px] rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden"
                      >
                        <img
                          v-if="img"
                          :src="img"
                          alt=""
                          class="h-full w-full object-cover"
                        />
                        <label v-else class="flex h-full w-full cursor-pointer items-center justify-center text-gray-500 text-xs">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onGalleryImageUpload(slide, $event, i)"
                          />
                          + Фото
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- 7. Характеристики -->
                  <div
                    v-else-if="slide.type === 'characteristics'"
                    class="flex h-full flex-col overflow-auto p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Характеристики"
                      class="mb-4 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="grid flex-1 grid-cols-2 gap-3 min-h-0 overflow-auto content-start">
                      <div
                        v-for="(item, i) in (charItems(slide))"
                        :key="i"
                        class="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div class="min-w-0 flex-1">
                          <input
                            v-model="item.label"
                            type="text"
                            class="mb-1 w-full bg-transparent text-xs text-gray-500 focus:outline-none dark:text-gray-400"
                            placeholder="Метка"
                          />
                          <input
                            v-model="item.value"
                            type="text"
                            class="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none dark:text-white/90"
                            placeholder="Значение"
                          />
                        </div>
                        <button
                          v-if="charItems(slide).length > 1"
                          type="button"
                          class="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400"
                          title="Удалить"
                          @click="removeCharacteristicItem(slide, i)"
                        >
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      v-if="charItems(slide).length < 12"
                      type="button"
                      class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500"
                      @click="addCharacteristicItem(slide)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Добавить характеристику
                    </button>
                    <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Максимум 12 характеристик
                    </p>
                  </div>

                  <!-- 8. Планировка -->
                  <div
                    v-else-if="slide.type === 'layout'"
                    class="flex h-full flex-col p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Планировка"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="relative min-h-[100px] flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        v-if="slide.data?.layoutImageUrl"
                        :src="String(slide.data.layoutImageUrl)"
                        alt=""
                        class="h-full w-full object-contain"
                      />
                      <label v-else class="flex h-full w-full cursor-pointer items-center justify-center text-gray-500 text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          class="hidden"
                          @change="onSingleImageUpload(slide, $event, 'layoutImageUrl')"
                        />
                        Загрузить план этажа
                      </label>
                    </div>
                  </div>

                  <!-- 9. Сетка с изображениями -->
                  <div
                    v-else-if="slide.type === 'grid'"
                    class="flex h-full flex-col p-4 md:p-6"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Сетка"
                      class="mb-3 w-full border-0 border-b border-transparent bg-transparent text-xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600 md:text-2xl"
                    />
                    <div class="grid flex-1 grid-cols-3 gap-2 min-h-0">
                      <div
                        v-for="(img, i) in gridImages(slide)"
                        :key="i"
                        class="relative min-h-[50px] rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden"
                      >
                        <img
                          v-if="img"
                          :src="img"
                          alt=""
                          class="h-full w-full object-cover"
                        />
                        <label v-else class="flex h-full w-full cursor-pointer items-center justify-center text-gray-500 text-xs">
                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="onGridImageUpload(slide, $event, i)"
                          />
                          +
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- 10. Контакты -->
                  <div
                    v-else-if="slide.type === 'contacts'"
                    class="flex h-full flex-col justify-center p-8"
                  >
                    <input
                      v-model="slide.data.heading"
                      type="text"
                      placeholder="Контакты"
                      class="mb-6 w-full border-0 border-b border-transparent bg-transparent text-2xl font-semibold text-gray-800 focus:border-gray-300 focus:outline-none dark:text-white/90 dark:focus:border-gray-600"
                    />
                    <div class="space-y-3 text-gray-600 dark:text-gray-300">
                      <input
                        v-model="slide.data.phone"
                        type="text"
                        placeholder="Телефон"
                        class="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-300 focus:outline-none dark:border-gray-700"
                      />
                      <input
                        v-model="slide.data.email"
                        type="text"
                        placeholder="Email"
                        class="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-300 focus:outline-none dark:border-gray-700"
                      />
                      <input
                        v-model="slide.data.address"
                        type="text"
                        placeholder="Адрес"
                        class="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 focus:border-brand-300 focus:outline-none dark:border-gray-700"
                      />
                    </div>
                  </div>

                  <!-- Fallback -->
                  <div v-else class="flex h-full items-center justify-center p-8 text-gray-500">
                    Слайд: {{ slide.type }}
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
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
              :disabled="isNew && !objectName.trim()"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveToStorage"
            >
              {{ isNew ? 'Создать и сохранить' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperType } from 'swiper'
import draggable from 'vuedraggable'
import 'swiper/css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { api, hasApi, getToken } from '@/api/client'
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

/** Слайды, отображаемые в Swiper (без скрытых) */
const visibleSlides = computed(() => slides.value.filter((s) => !s.hidden))

/** Номер текущего слайда среди видимых (1-based для отображения) */
const visibleSlideNumber = computed(() => {
  const current = slides.value[activeSlideIndex.value]
  if (!current || current.hidden) return 0
  const idx = visibleSlides.value.findIndex((s) => s.id === current.id)
  return idx >= 0 ? idx + 1 : 0
})

// Название и описание при создании новой презентации (синхронизация с обложкой)
const objectName = ref('')
const objectDescription = ref('')

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

// Местоположение: подсказки адреса, карта, метро
const API_BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  : ''

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
  if (!API_BASE) return
  clearTimeout(addressSuggestionsFetchTimer ?? 0)
  const id = slide.id
  addressSuggestionsFetchTimer = setTimeout(() => {
    fetch(`${API_BASE}/suggest?q=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((data: { suggestions?: Array<{ display_name?: string; address?: string; lat?: number; lon?: number }> }) => {
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
}

function hideAddressSuggestionsDelay(slide: SlideItem) {
  addressSuggestionsBlurTimer = setTimeout(() => {
    addressSuggestionsVisibleBySlideId.value[slide.id] = false
  }, 200)
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
  if (!API_BASE) {
    alert('Настройте VITE_API_URL для работы поиска метро.')
    return
  }
  metroLoadingBySlideId.value[slide.id] = true
  try {
    const res = await fetch(`${API_BASE}/find_nearest_metro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
    const data = await res.json()
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
  if (!API_BASE) {
    alert('Настройте VITE_API_URL в .env для работы генерации текста (GigaChat).')
    return
  }
  const cover = slides.value.find((s) => s.type === 'cover')
  const objectTitle = cover?.data?.title ? String(cover.data.title) : ''
  const currentText = type === 'description' ? String(slide.data?.text ?? '') : String(slide.data?.content ?? '')
  const prompt = currentText.trim() || objectTitle || 'объект недвижимости'

  generateTextLoading.value = slide.id
  try {
    const res = await fetch(`${API_BASE}/generate_text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, object_title: objectTitle }),
    })
    const data = await res.json()
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

watch(
  [objectName, objectDescription],
  () => {
    const cover = slides.value[0]
    if (cover?.type === 'cover' && cover.data) {
      cover.data.title = objectName.value
      cover.data.subtitle = objectDescription.value
    }
  },
  { immediate: false }
)

const swiperOptions = {
  spaceBetween: 0,
  allowTouchMove: true,
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
    case 'description':
      return { heading: '', text: '' }
    case 'infrastructure':
      return { heading: 'Инфраструктура', content: '', items: ['Пункт 1', 'Пункт 2', 'Пункт 3'] }
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
    case 'gallery':
      return { heading: 'Галерея', images: [] as string[] }
    case 'characteristics':
      return { heading: 'Характеристики', items: defaultCharItems.map((x) => ({ ...x })) }
    case 'layout':
      return { heading: 'Планировка' }
    case 'grid':
      return { heading: 'Сетка', images: [] as string[] }
    case 'contacts':
      return { heading: 'Контакты', phone: '', email: '', address: '' }
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

async function onSingleImageUpload(
  slide: SlideItem,
  event: Event,
  field: string
) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
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

function gridImages(slide: SlideItem): string[] {
  const arr = slide.data?.images
  if (!Array.isArray(arr)) return ['', '', '', '', '', '']
  const out = [...arr]
  while (out.length < 6) out.push('')
  return out.slice(0, 6)
}

const presentationId = computed(() => route.params.id as string)
const isNew = computed(() => route.path === '/presentations/new')

onMounted(async () => {
  if (isNew.value) {
    objectName.value = String(slides.value[0]?.data?.title ?? '')
    objectDescription.value = String(slides.value[0]?.data?.subtitle ?? '')
    return
  }
  const id = presentationId.value
  if (hasApi() && getToken()) {
    try {
      const data = await api.get<PresentationFull>(`/api/presentations/${id}`)
      if (data?.content?.slides && Array.isArray(data.content.slides) && data.content.slides.length) {
        slides.value = (data.content.slides as SlideItem[]).map((s) => ({
          ...s,
          id: s.id ?? genSlideId(),
          hidden: s.hidden ?? false,
        }))
      }
      objectName.value = data.title || String(slides.value[0]?.data?.title ?? '')
      objectDescription.value = String(slides.value[0]?.data?.subtitle ?? '')
    } catch {
      // fallback to localStorage
      loadFromLocalStorage()
    }
  } else {
    loadFromLocalStorage()
  }
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

const canSaveNew = computed(() => {
  return !isNew.value || objectName.value.trim().length > 0
})

async function saveToStorage() {
  if (!canSaveNew.value && isNew.value) return
  const cover = slides.value[0]
  if (cover?.data) {
    cover.data.title = objectName.value.trim() || 'Без названия'
    cover.data.subtitle = objectDescription.value
  }
  const title = objectName.value.trim() || (slides.value[0]?.data?.title ?? 'Без названия')
  const content = { slides: slides.value }

  if (hasApi() && getToken()) {
    try {
      if (isNew.value) {
        const created = await api.post<PresentationFull>('/api/presentations', {
          title,
          content,
        })
        router.replace(`/presentations/${created.id}/edit`)
      } else {
        await api.put(`/api/presentations/${presentationId.value}`, {
          title,
          content,
        })
        router.push('/presentations')
      }
    } catch {
      saveToLocalStorage()
    }
    return
  }
  saveToLocalStorage()
}

function saveToLocalStorage() {
  if (isNew.value) {
    const id = `pres-${Date.now()}`
    const listRaw = localStorage.getItem('presentations-list')
    const list = listRaw ? JSON.parse(listRaw) : []
    const title = objectName.value.trim() || (slides.value[0]?.data?.title ?? 'Без названия')
    list.push({
      id,
      title: String(title),
      updatedAt: new Date().toISOString(),
    })
    localStorage.setItem('presentations-list', JSON.stringify(list))
    localStorage.setItem(`presentation-${id}`, JSON.stringify({ slides: slides.value }))
    router.replace(`/presentations/${id}/edit`)
    return
  }
  localStorage.setItem(
    `presentation-${presentationId.value}`,
    JSON.stringify({ slides: slides.value })
  )
  const listRaw = localStorage.getItem('presentations-list')
  if (listRaw) {
    const list = JSON.parse(listRaw)
    const item = list.find((p: { id: string }) => p.id === presentationId.value)
    if (item) {
      item.title = String(slides.value[0]?.data?.title ?? item.title)
      item.updatedAt = new Date().toISOString()
      localStorage.setItem('presentations-list', JSON.stringify(list))
    }
  }
  router.push('/presentations')
}
</script>

<style>
/* Слайдер: высота увеличена, контент презентации занимает больше места */
.presentation-slider-wrap {
  aspect-ratio: 4 / 3;
  max-height: min(72vh, 640px);
  width: 100%;
}
@media (max-width: 1023px) {
  .presentation-slider-wrap {
    min-height: min(60vh, 420px);
    max-height: min(78vh, 560px);
  }
}
.presentation-swiper {
  height: 100%;
}
.presentation-swiper .swiper-slide {
  height: 100%;
}
</style>
