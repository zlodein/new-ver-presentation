<template>
  <AdminLayout>
    <div class="flex flex-col gap-4">
      <!-- Презентация не найдена (404) -->
      <div
        v-if="presentationNotFound"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"
        role="alert"
      >
        <p class="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
          Презентация не найдена или у вас нет к ней доступа.
        </p>
        <RouterLink
          to="/dashboard/presentations"
          class="text-sm font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          Вернуться к списку презентаций
        </RouterLink>
      </div>

      <!-- Идентификатор презентации (для тех. поддержки) -->
      <div class="rounded-lg md:hidden flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <p class="text-sm font-mono font-semibold text-gray-800 dark:text-white/90">
            {{ presentationMeta.shortId ? `ID=${presentationMeta.shortId}` : '—' }}
          </p>
          <button
          v-if="presentationMeta.shortId"
          type="button"
          class="shrink-0 inline-flex items-center justify-center rounded border border-gray-200 bg-white py-1.5 px-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-white dark:text-gray-600 dark:hover:bg-gray-100"
          :class="{ '!border-transparent !bg-[var(--color-green-600)] !text-white dark:!bg-[var(--color-green-600)]': copyIdCopied }"
          title="Скопировать ID"
          @click="copyShortId"
        >
          <svg class="fill-current h-4 w-4" viewBox="0 0 20 20" fill="none">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z" fill="currentColor" />
          </svg>
        </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Скопируйте идентификатор, при обращении в тех. поддержку</p>
      </div>
      <!-- Публичная ссылка — скрыта на тарифе «Тест драйв» -->
      <div v-if="!isTestDrive" class="rounded-lg md:hidden">
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Публичная ссылка</label>
        <div class="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            :aria-checked="presentationMeta.isPublic"
            :class="[
              'relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors',
              presentationMeta.isPublic
                ? 'border-green-500 bg-green-500'
                : 'border-red-400 bg-red-400 dark:border-red-500 dark:bg-red-500',
            ]"
            @click="toggleShare"
          >
            <span
              :class="[
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                presentationMeta.isPublic ? 'left-6' : 'left-0.5',
              ]"
            />
          </button>
          <div class="relative min-w-0 flex-1">
            <button
              v-if="presentationMeta.isPublic && presentationMeta.publicUrl"
              type="button"
              class="absolute right-1 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-lg border-l border-gray-200 bg-white py-2 pl-2 pr-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white dark:text-gray-400 dark:hover:bg-gray-100"
              :class="{ '!border-transparent !bg-[var(--color-green-600)] !text-white dark:!bg-[var(--color-green-600)]': copyLinkCopied }"
              title="Скопировать ссылку"
              @click="copyPublicLink"
            >
              <svg class="fill-current h-4 w-4" viewBox="0 0 20 20" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z" fill="currentColor" />
              </svg>
            </button>
            <input
              type="url"
              :value="presentationMeta.isPublic ? presentationMeta.publicUrl : ''"
              :disabled="!presentationMeta.isPublic"
              readonly
              class="dark:bg-dark-900 h-10 w-full rounded-lg border py-2 pl-3 text-sm shadow-theme-xs transition-colors"
              :class="[
                presentationMeta.isPublic
                  ? 'border-gray-300 bg-transparent pr-[70px] text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
                  : 'cursor-not-allowed border-gray-200 bg-gray-100 pr-3 text-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-500',
              ]"
            />
          </div>
        </div>
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

      <!-- Панель со слайдами: только на мобильных; на ПК — в сайдбаре справа -->
      <div class="editor-slides-nav flex flex-col gap-0 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden md:flex-row md:items-center md:gap-1.5 md:p-1.5">
        <!-- Мобильная: кнопка «Навигация по слайдам» со стрелкой -->
        <button
          type="button"
          class="editor-slides-nav__mob-trigger flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left md:hidden"
          :class="showMobSlidesNav ? 'bg-gray-100 dark:bg-gray-700' : ''"
          :aria-expanded="showMobSlidesNav"
          @click="showMobSlidesNav = !showMobSlidesNav"
        >
          <span class="text-base font-semibold text-gray-700 dark:text-gray-200">Навигация по слайдам</span>
          <svg
            class="h-6 w-6 shrink-0 text-gray-500 transition-transform dark:text-gray-400"
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
                  'slide-item-mob flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition',
                  activeSlideIndex === index
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                  slide.hidden ? 'opacity-60' : '',
                ]"
                @click="goToSlide(index)"
              >
                <span
                  class="slide-drag-handle flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-400 active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Перетащить"
                  @click.stop
                >
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </span>
                <span
                  class="min-w-0 flex-1 truncate text-left text-lg font-medium"
                  :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ getSlideLabel(slide) }}
                </span>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                    @click.stop="toggleSlideVisibility(index)"
                  >
                    <svg v-if="slide.hidden" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    :disabled="!canAddSlide"
                    :title="!canAddSlide ? 'На тарифе «Тест драйв» не более 4 слайдов' : 'Дублировать'"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    @click.stop="canAddSlide && duplicateSlide(index)"
                  >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    v-if="slides.length > 1"
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    title="Удалить"
                    @click.stop="deleteSlide(index)"
                  >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- ПК: плитка слайдов по левому краю -->
        <div class="hidden md:flex md:flex-1 md:items-center md:gap-1.5">
          <div class="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2 border-r border-gray-200 pr-2 dark:border-gray-700">
            <draggable
              v-model="slides"
              item-key="id"
              handle=".slide-drag-handle"
              @end="onDragEnd"
              @move="onDragMove"
              class="slides-strip flex flex-wrap gap-2"
            >
              <template #item="{ element: slide, index }">
                <div
                  :data-slide-index="index"
                  :class="[
                    'flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 transition shrink-0',
                    activeSlideIndex === index
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                    slide.hidden ? 'opacity-60' : '',
                  ]"
                  @click="goToSlide(index)"
                >
                  <span
                    class="slide-drag-handle cursor-grab touch-none p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Перетащить"
                    @click.stop
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </span>
                  <span
                    class="min-w-0 truncate text-sm font-medium transition whitespace-nowrap"
                    :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                  >
                    {{ getSlideLabel(slide) }}
                  </span>
                  <div class="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                      @click.stop="toggleSlideVisibility(index)"
                    >
                      <svg v-if="slide.hidden" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.031 11.117A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.05 10.05 0 01-1.563 3.029m5.858-.908a3 3 0 11-4.243-4.243M9.88 9.88a4.5 4.5 0 106.262-6.262" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      :disabled="!canAddSlide"
                      :title="!canAddSlide ? 'На тарифе «Тест драйв» не более 4 слайдов' : 'Дублировать'"
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      @click.stop="canAddSlide && duplicateSlide(index)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      v-if="slides.length > 1"
                      type="button"
                      class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
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

        <!-- Шестерёнка и кнопка "Добавить" — только на мобильных (на ПК в сайдбаре) -->
        <div ref="addSlideWrapRef" class="relative hidden shrink-0 items-center gap-3 md:hidden">
          <!-- Иконка шестерёнки: настройки отображения (редактор / просмотр / PDF) -->
          <div class="relative">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Настройки отображения презентации"
              @click="showSettingsMenu = !showSettingsMenu"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div
              v-if="showSettingsMenu"
              ref="settingsMenuRef"
              class="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              @click.stop
            >
              <p class="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Отображение в редакторе / просмотре / PDF</p>
              <div class="space-y-2">
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Шрифт</label>
                  <div class="relative z-20 bg-transparent">
                    <select
                      v-model="presentationSettings.fontFamily"
                      class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="f in FONT_OPTIONS" :key="f.value" :value="f.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ f.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Скругление изображений и карт</label>
                  <div class="relative z-20 bg-transparent">
                    <select
                      v-model="presentationSettings.imageBorderRadius"
                      class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option v-for="r in RADIUS_OPTIONS" :key="r.value" :value="r.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ r.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Название презентации</label>
                  <div class="relative z-20 bg-transparent">
                    <select v-model="presentationSettings.fontSizePresentationTitle" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                      <option v-for="o in FONT_SIZE_HEADING_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Подзаголовок обложки / заголовки слайдов</label>
                  <div class="relative z-20 bg-transparent">
                    <select v-model="presentationSettings.fontSizeHeading" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                      <option v-for="o in FONT_SIZE_HEADING_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Текст</label>
                  <div class="relative z-20 bg-transparent">
                    <select v-model="presentationSettings.fontSizeText" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                      <option v-for="o in FONT_SIZE_TEXT_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Тип сделки и цена</label>
                  <div class="relative z-20 bg-transparent">
                    <select v-model="presentationSettings.fontSizePrice" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                      <option v-for="o in FONT_SIZE_PRICE_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                    </select>
                    <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                @click="resetPresentationSettings"
              >
                Сбросить к исходным
              </button>
            </div>
          </div>
          <div class="relative">
            <button
              type="button"
              :disabled="!canAddSlide"
              :title="!canAddSlide ? 'На тарифе «Тест драйв» допускается не более 4 слайдов' : 'Добавить слайд'"
              class="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="canAddSlide && (showAddSlideMenu = !showAddSlideMenu)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Добавить</span>
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-if="showAddSlideMenu && canAddSlide"
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
      </div>

      <!-- Область превью слайдов: на ПК — слайдер слева + сайдбар справа -->
      <main class="w-full md:flex md:gap-4 md:items-start">
        <div
          class="editor-slider-wrap min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-0 dark:border-gray-800 dark:bg-gray-900/50 md:p-4 lg:p-6"
          @paste.capture="onPasteStripFormat"
        >
          <!-- Высота слайдера ограничена, на мобиле больше места под контент. Настройки шрифта и скруглений применяются здесь и в просмотре/PDF. -->
          <div
            class="presentation-slider-wrap booklet-view mx-auto w-full overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900"
            :style="presentationStyle"
          >
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
                          <template v-if="canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="onSingleImageUpload(slide, $event, 'coverImageUrl')"
                              />
                            </label>
                          </template>
                          <img v-if="slide.data?.coverImageUrl" :src="String(slide.data.coverImageUrl)" alt="">
                        </div>
                        <div class="booklet-main__content">
                          <!-- 1. Подзаголовок (перенос по словам) -->
                          <div class="booklet-main__top">
                            <textarea
                              :value="String(slide.data?.title ?? '')"
                              rows="2"
                              placeholder="ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ"
                              class="booklet-main__top-input w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                              @input="(slide.data as Record<string, string>).title = ($event.target as HTMLTextAreaElement).value"
                            />
                          </div>
                          <!-- 2. Название презентации (перенос по словам) -->
                          <div class="booklet-main__center">
                            <textarea
                              :value="String(slide.data?.subtitle ?? '')"
                              rows="2"
                              placeholder="АБСОЛЮТНО НОВЫЙ ТАУНХАУС НА ПЕРВОЙ ЛИНИИ"
                              class="booklet-main__center-input w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                              @input="(slide.data as Record<string, string>).subtitle = ($event.target as HTMLTextAreaElement).value"
                            />
                          </div>
                          <!-- 3. Краткое описание + кнопка сгенерировать -->
                          <div class="booklet-main__short-desc flex flex-col gap-1">
                            <textarea
                              :value="String(slide.data?.shortDescription ?? '')"
                              rows="3"
                              placeholder="Краткое описание объекта..."
                              class="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-200"
                              @input="(e) => { if (!slide.data) slide.data = {}; (slide.data as Record<string, unknown>).shortDescription = (e.target as HTMLTextAreaElement).value }"
                            />
                            <button
                              type="button"
                              class="booklet-btn-generate mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 dark:from-violet-600 dark:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800"
                              @click="generateCoverShortDescription(slide)"
                            >
                              Сгенерировать описание
                            </button>
                          </div>
                          <!-- 4. Тип сделки и цена и валюта в одной строке -->
                          <div class="booklet-main__bottom">
                            <div class="flex flex-wrap items-end gap-4">
                              <div class="min-w-[140px]">
                                <div class="relative z-20 bg-transparent">
                                  <select
                                    v-model="slide.data.deal_type"
                                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                  >
                                    <option value="Аренда">Аренда</option>
                                    <option value="Продажа">Продажа</option>
                                  </select>
                                  <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                                    <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                  </span>
                                </div>
                              </div>
                              <div class="booklet-main__price w-[120px] min-w-[100px] shrink-0">
                                <input
                                  :value="coverPriceValue(slide)"
                                  type="text"
                                  :placeholder="coverPricePlaceholder(slide)"
                                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                  @input="onCoverPriceInput(slide, ($event.target as HTMLInputElement).value)"
                                />
                              </div>
                              <div class="relative z-20 bg-transparent w-24 shrink-0">
                                <select
                                  :value="slide.data.currency"
                                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                  @change="onCoverCurrencyChange(slide, $event)"
                                >
                                  <option v-for="c in CURRENCIES" :key="c.code" :value="c.code" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ c.symbol }}</option>
                                </select>
                                <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                            <label class="mt-3 flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-400">
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
                          :value="slide.data?.heading ?? 'ОПИСАНИЕ'"
                          type="text"
                          placeholder="ОПИСАНИЕ"
                          class="booklet-info__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                          @input="(slide.data as Record<string, string>).heading = ($event.target as HTMLInputElement).value"
                        />
                        <div v-if="canEditImages" class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-medium text-gray-500">Сетка изображений:</span>
                          <div class="relative z-20 bg-transparent">
                            <select
                              :value="getImageGrid(slide)"
                              class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                              @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                            >
                              <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ opt.label }}</option>
                            </select>
                            <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                              <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div class="booklet-info__text">
                          <textarea
                            :value="String(slide.data?.text ?? '')"
                            placeholder="Подробно опишите объект..."
                            rows="6"
                            class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            @input="(slide.data as Record<string, string>).text = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            class="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
                          <template v-if="canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="onDescriptionImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
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
                        <div v-if="canEditImages" class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-medium text-gray-500">Сетка изображений:</span>
                          <div class="relative z-20 bg-transparent">
                            <select
                              :value="getImageGrid(slide)"
                              class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                              @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                            >
                              <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ opt.label }}</option>
                            </select>
                            <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                              <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div class="booklet-stroen__text">
                          <textarea
                            :value="String(slide.data?.content ?? '')"
                            placeholder="Текст об инфраструктуре..."
                            rows="6"
                            class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            @input="(slide.data as Record<string, string>).content = ($event.target as HTMLTextAreaElement).value"
                          />
                          <button
                            type="button"
                            class="mt-1 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
                          <template v-if="canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="onInfrastructureImageUpload(slide, $event, i)"
                              />
                            </label>
                          </template>
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
                            :key="`${slide.id}-${Number(slide.data?.lat)}-${Number(slide.data?.lng)}`"
                            :lat="Number(slide.data?.lat)"
                            :lng="Number(slide.data?.lng)"
                          />
                        </div>
                      </div>
                      <div class="booklet-map__content flex flex-col gap-2 min-h-0">
                        <div class="booklet-map__info relative flex-shrink-0">
                          <div class="relative mb-2">
                            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Поиск по адресу</label>
                            <div v-if="dadataToken" class="relative">
                              <input
                                :value="String(slide.data?.address ?? '')"
                                type="text"
                                placeholder="ЖК «Успешная продажа»"
                                autocomplete="off"
                                class="location-dadata-input dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                @input="onLocationAddressInput(slide, ($event.target as HTMLInputElement).value)"
                                @focus="onLocationAddressFocus(slide)"
                                @blur="onLocationAddressBlur"
                              />
                              <div
                                v-if="dadataLoadingBySlideId[slide.id]"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
                              >
                                Поиск...
                              </div>
                              <ul
                                v-if="(dadataSuggestionsBySlideId[slide.id]?.length ?? 0) > 0"
                                class="location-dadata-suggestions absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                              >
                                <li
                                  v-for="(item, idx) in dadataSuggestionsBySlideId[slide.id]"
                                  :key="idx"
                                  class="cursor-pointer px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                  @mousedown.prevent
                                  @click="applyDadataSuggestion(slide, item)"
                                >
                                  {{ item.value }}
                                </li>
                              </ul>
                            </div>
                            <template v-else>
                              <input
                                v-model="slide.data.address"
                                type="text"
                                placeholder="ЖК «Успешная продажа»"
                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                              <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">Задайте VITE_DADATA_API_KEY в .env для подсказок Dadata.</p>
                            </template>
                          </div>
                          <button
                            type="button"
                            class="mb-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                            :disabled="locationMetroLoading(slide)"
                            @click="findNearestMetro(slide)"
                          >
                            {{ locationMetroLoading(slide) ? 'Поиск...' : 'Найти ближайшее метро' }}
                          </button>
                          <label class="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-400">
                            <div class="relative">
                              <input v-model="slide.data.show_metro" type="checkbox" class="sr-only" />
                              <div
                                :class="slide.data.show_metro ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'"
                                class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] hover:border-brand-500 dark:hover:border-brand-500"
                              >
                                <span :class="slide.data.show_metro ? '' : 'opacity-0'">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="1.94437" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </span>
                              </div>
                            </div>
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
                      <input
                        v-model="slide.data.heading"
                        type="text"
                        placeholder="ГАЛЕРЕЯ"
                        class="booklet-galery__title w-full flex-shrink-0 border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                      />
                      <div v-if="canEditImages" class="flex items-center gap-2 px-2 py-1 col-span-full">
                        <span class="text-xs font-medium text-gray-500">Сетка изображений:</span>
                        <div class="relative z-20 bg-transparent">
                          <select
                            :value="getImageGrid(slide)"
                            class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                            @input="(slide.data as Record<string, string>).imageGrid = ($event.target as HTMLSelectElement).value"
                          >
                            <option v-for="opt in IMAGE_GRID_OPTIONS" :key="opt.value" :value="opt.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ opt.label }}</option>
                          </select>
                          <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                            <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div class="booklet-galery__grid image-grid-bound" :data-image-grid="getImageGrid(slide)">
                        <div
                          v-for="(img, i) in galleryImages3(slide)"
                          :key="i"
                          class="booklet-galery__img relative"
                        >
                          <template v-if="canEditImages">
                            <label class="booklet-upload-btn cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="onGalleryImageUpload(slide, $event, i)"
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
                  >
                    <div class="booklet-char__wrap">
                      <input
                        v-model="slide.data.heading"
                        type="text"
                        placeholder="ХАРАКТЕРИСТИКИ"
                        class="booklet-char__title w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                      />
                      <div class="booklet-char__img relative">
                        <template v-if="canEditImages">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onSingleImageUpload(slide, $event, 'charImageUrl')"
                            />
                          </label>
                        </template>
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
                            v-if="charItems(slide).length < 13"
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
                        <template v-if="canEditImages">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="onSingleImageUpload(slide, $event, 'layoutImageUrl')"
                            />
                          </label>
                        </template>
                        <img v-if="slide.data?.layoutImageUrl" :src="String(slide.data.layoutImageUrl)" alt="">
                      </div>
                    </div>
                  </div>

                  <!-- 9. Контакты: заголовок «Контакты», блок аватар+имя/о себе, мессенджеры, телефон, email -->
                  <div
                    v-else-if="slide.type === 'contacts'"
                    class="booklet-content booklet-contacts"
                  >
                    <div class="booklet-contacts__wrap">
                      <div class="booklet-contacts__left flex flex-col gap-4">
                        <input
                          v-model="slide.data.heading"
                          type="text"
                          placeholder="Контакты"
                          class="booklet-contacts__title mb-0 w-full flex-shrink-0 border-0 bg-transparent p-0 text-base font-semibold focus:outline-none focus:ring-0"
                        />
                        <div class="flex flex-col items-start gap-4 xl:flex-row xl:items-center">
                          <div class="relative shrink-0">
                            <div class="booklet-contacts__avatar group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-500 text-2xl font-semibold text-white dark:border-gray-800">
                              <template v-if="canEditImages">
                                <label class="booklet-upload-btn absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                  <input type="file" accept="image/*" class="hidden" @change="onContactsAvatarUpload(slide, $event)" />
                                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </label>
                              </template>
                              <img v-if="slide.data?.avatarUrl || slide.data?.logoUrl" :src="String(slide.data?.avatarUrl ?? slide.data?.logoUrl)" alt="" class="h-full w-full object-cover">
                            </div>
                          </div>
                          <div class="order-3 min-w-0 flex-1 xl:order-2">
                            <input
                              v-model="slide.data.contactName"
                              type="text"
                              placeholder="ФИО или название организации"
                              class="mb-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-base font-semibold text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                            <input
                              v-model="slide.data.aboutText"
                              type="text"
                              placeholder="О себе"
                              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                          </div>
                        </div>
                        <div v-if="slide.data?.messengers && Object.keys(slide.data.messengers as object).length" class="flex items-center gap-2">
                          <MessengerIcons :messengers="(slide.data.messengers as Record<string, string>) || undefined" />
                        </div>
                        <div class="booklet-contacts__block booklet-contacts__content flex flex-col gap-1">
                          <input
                            v-model="slide.data.phone"
                            type="text"
                            placeholder="Телефон"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                          <input
                            v-model="slide.data.email"
                            type="text"
                            placeholder="Email"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                          <input
                            v-model="slide.data.address"
                            type="text"
                            placeholder="Адрес"
                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          />
                        </div>
                      </div>
                      <div class="booklet-contacts__block booklet-contacts__img relative">
                        <template v-if="canEditImages">
                          <label class="booklet-upload-btn cursor-pointer">
                            <input type="file" accept="image/*" class="hidden" @change="onContactsImageUpload(slide, $event, 0)" />
                          </label>
                        </template>
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
                :disabled="!canAddSlide"
                :title="!canAddSlide ? 'На тарифе «Тест драйв» допускается не более 4 слайдов' : 'Добавить слайд'"
                class="mob-editor-buttons__add flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
                @click.stop="canAddSlide && (showAddSlideMenu = !showAddSlideMenu)"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <div
                v-if="showAddSlideMenu && canAddSlide"
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
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Сохранить"
              :disabled="saving"
              @click="savePresentation"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
            <template v-if="presentationMeta.status === 'published'">
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
            </template>
            <button
              v-else
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              title="Опубликовать"
              @click="publishPresentation"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Сайдбар справа от слайдера (только десктоп) -->
        <aside class="editor-sidebar hidden w-72 shrink-0 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:block">
          <!-- Идентификатор презентации (для тех. поддержки) -->
          <div class="border-b border-gray-200 p-3 dark:border-gray-700 flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-mono font-semibold text-gray-800 dark:text-white/90 min-w-0 truncate">
                {{ presentationMeta.shortId ? `ID=${presentationMeta.shortId}` : '—' }}
              </p>
              <button
              v-if="presentationMeta.shortId"
              type="button"
              class="shrink-0 inline-flex items-center justify-center rounded border border-gray-200 bg-white py-1.5 px-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-white dark:text-gray-600 dark:hover:bg-gray-100"
              :class="{ '!border-transparent !bg-[var(--color-green-600)] !text-white dark:!bg-[var(--color-green-600)]': copyIdCopied }"
              title="Скопировать ID"
              @click="copyShortId"
            >
              <svg class="fill-current h-4 w-4" viewBox="0 0 20 20" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z" fill="currentColor" />
              </svg>
            </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Скопируйте идентификатор, при обращении в тех. поддержку</p>
          </div>
          <!-- Публичная ссылка — скрыта на тарифе «Тест драйв» -->
          <div v-if="!isTestDrive" class="border-b border-gray-200 p-3 dark:border-gray-700">
            <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Публичная ссылка</label>
            <div class="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                :aria-checked="presentationMeta.isPublic"
                :class="[
                  'relative h-6 w-10 shrink-0 rounded-full border-2 transition-colors',
                  presentationMeta.isPublic
                    ? 'border-green-500 bg-green-500'
                    : 'border-red-400 bg-red-400 dark:border-red-500 dark:bg-red-500',
                ]"
                @click="toggleShare"
              >
                <span
                  :class="[
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    presentationMeta.isPublic ? 'left-5' : 'left-0.5',
                  ]"
                />
              </button>
              <div class="relative min-w-0 flex-1">
                <button
                  v-if="presentationMeta.isPublic && presentationMeta.publicUrl"
                  type="button"
                  class="absolute right-1 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-lg border-l border-gray-200 bg-white py-2 pl-2 pr-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-white dark:text-gray-400 dark:hover:bg-gray-100"
                  :class="{ '!border-transparent !bg-[var(--color-green-600)] !text-white dark:!bg-[var(--color-green-600)]': copyLinkCopied }"
                  title="Скопировать"
                  @click="copyPublicLink"
                >
                  <svg class="fill-current h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z" fill="currentColor" />
                  </svg>
                </button>
                <input
                  type="url"
                  :value="presentationMeta.isPublic ? presentationMeta.publicUrl : ''"
                  :disabled="!presentationMeta.isPublic"
                  readonly
                  class="h-9 w-full rounded-lg border py-2 pl-3 text-xs transition-colors"
                  :class="[
                    presentationMeta.isPublic
                      ? 'border-gray-300 bg-transparent pr-9 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
                      : 'cursor-not-allowed border-gray-200 bg-gray-100 pr-3 text-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-500',
                  ]"
                />
              </div>
            </div>
          </div>

          <!-- Кнопки: настройки и добавить слайд -->
          <div class="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
            <div class="relative">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Настройки отображения"
                @click="showSettingsMenu = !showSettingsMenu"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div
                v-if="showSettingsMenu"
                ref="settingsMenuRef"
                class="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                @click.stop
              >
                <p class="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Отображение в редакторе / просмотре / PDF</p>
                <div class="space-y-2">
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Шрифт</label>
                    <div class="relative z-20 bg-transparent">
                      <select
                        v-model="presentationSettings.fontFamily"
                        class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option v-for="f in FONT_OPTIONS" :key="f.value" :value="f.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ f.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Скругление изображений</label>
                    <div class="relative z-20 bg-transparent">
                      <select
                        v-model="presentationSettings.imageBorderRadius"
                        class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option v-for="r in RADIUS_OPTIONS" :key="r.value" :value="r.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ r.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Название презентации</label>
                    <div class="relative z-20 bg-transparent">
                      <select v-model="presentationSettings.fontSizePresentationTitle" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                        <option v-for="o in FONT_SIZE_HEADING_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Подзаголовок обложки / заголовки слайдов</label>
                    <div class="relative z-20 bg-transparent">
                      <select v-model="presentationSettings.fontSizeHeading" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                        <option v-for="o in FONT_SIZE_HEADING_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Текст</label>
                    <div class="relative z-20 bg-transparent">
                      <select v-model="presentationSettings.fontSizeText" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                        <option v-for="o in FONT_SIZE_TEXT_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="settings-select-label mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Тип сделки и цена</label>
                    <div class="relative z-20 bg-transparent">
                      <select v-model="presentationSettings.fontSizePrice" class="settings-select dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                        <option v-for="o in FONT_SIZE_PRICE_OPTIONS" :key="o.value" :value="o.value" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">{{ o.label }}</option>
                      </select>
                      <span class="absolute z-30 text-gray-700 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                        <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  @click="resetPresentationSettings"
                >
                  Сбросить к исходным
                </button>
              </div>
            </div>
            <div class="relative flex-1">
              <button
                type="button"
                :disabled="!canAddSlide"
                :title="!canAddSlide ? 'На тарифе «Тест драйв» допускается не более 4 слайдов' : 'Добавить слайд'"
                class="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="canAddSlide && (showAddSlideMenu = !showAddSlideMenu)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Добавить слайд
              </button>
              <div
                v-if="showAddSlideMenu && canAddSlide"
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

          <!-- Навигация по слайдам (список) -->
          <div class="max-h-[60vh] overflow-y-auto p-3">
            <draggable
              v-model="slides"
              item-key="id"
              handle=".slide-drag-handle"
              @end="onDragEnd"
              @move="onDragMove"
              class="flex flex-col gap-2"
            >
              <template #item="{ element: slide, index }">
                <div
                  :data-slide-index="index"
                  :class="[
                    'slide-item flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition',
                    activeSlideIndex === index
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                    slide.hidden ? 'opacity-60' : '',
                  ]"
                  @click="goToSlide(index)"
                >
                  <span
                    class="slide-drag-handle flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-400 active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Перетащить"
                    @click.stop
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </span>
                  <span
                    class="min-w-0 flex-1 truncate text-left text-sm font-medium"
                    :class="activeSlideIndex === index ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'"
                  >
                    {{ getSlideLabel(slide) }}
                  </span>
                  <div class="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      :title="slide.hidden ? 'Показать слайд' : 'Скрыть слайд'"
                      @click.stop="toggleSlideVisibility(index)"
                    >
                      <svg v-if="slide.hidden" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      :disabled="!canAddSlide"
                      :title="!canAddSlide ? 'На тарифе «Тест драйв» не более 4 слайдов' : 'Дублировать'"
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      @click.stop="canAddSlide && duplicateSlide(index)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      v-if="slides.length > 1"
                      type="button"
                      class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
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

          <!-- Кнопки Просмотр, Сохранить, Опубликовать / Экспорт в PDF -->
          <div class="flex flex-col gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
            <div class="flex w-full flex-wrap gap-2">
              <button
                type="button"
                class="h-8 flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="openViewPage"
              >
                Просмотр
              </button>
              <button
                type="button"
                class="h-8 flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                :disabled="saving"
                @click="savePresentation"
              >
                Сохранить
              </button>
              <template v-if="presentationMeta.status === 'published'">
                <button
                  type="button"
                  class="h-8 flex-1 min-w-0 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  @click="exportToPDF"
                  title="Экспортировать презентацию в PDF"
                >
                  Экспорт в PDF
                </button>
              </template>
              <button
                v-else
                type="button"
                class="h-8 flex-1 min-w-0 rounded-lg border border-green-600 bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                @click="publishPresentation"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </aside>
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
import MessengerIcons from '@/components/profile/MessengerIcons.vue'
import { SuccessIcon, ErrorIcon, InfoCircleIcon } from '@/icons'
import { api, hasApi, getToken, getApiBase, ApiError } from '@/api/client'
import type { PresentationFull } from '@/api/client'
import { useAuth } from '@/composables/useAuth'

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
const showAddSlideMenu = ref(false)
const showSettingsMenu = ref(false)
const showMobSlidesNav = ref(false)
const settingsMenuRef = ref<HTMLElement | null>(null)

/** Настройки отображения презентации (редактор / просмотр / публичная ссылка / PDF). Шрифты с кириллицей (Google Fonts). */
const FONT_OPTIONS = [
  { value: 'system-ui', label: 'Системный' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: '"Montserrat", sans-serif', label: 'Montserrat' },
  { value: '"Raleway", sans-serif', label: 'Raleway' },
  { value: '"Rubik", sans-serif', label: 'Rubik' },
  { value: '"Source Sans 3", sans-serif', label: 'Source Sans Pro' },
]
const RADIUS_OPTIONS = [
  { value: '0', label: 'Без скругления' },
  { value: '4px', label: '4 px' },
  { value: '8px', label: '8 px' },
  { value: '12px', label: '12 px' },
  { value: '16px', label: '16 px' },
  { value: '9999px', label: 'Круглые' },
]
const FONT_SIZE_HEADING_OPTIONS = [
  { value: '28px', label: '28 px' },
  { value: '38px', label: '38 px' },
  { value: '44px', label: '44 px' },
  { value: '52px', label: '52 px' },
  { value: '60px', label: '60 px' },
]
const FONT_SIZE_TEXT_OPTIONS = [
  { value: '16px', label: '16 px' },
  { value: '18px', label: '18 px' },
  { value: '20px', label: '20 px' },
  { value: '22px', label: '22 px' },
]
const FONT_SIZE_PRICE_OPTIONS = [
  { value: '16px', label: '16 px' },
  { value: '18px', label: '18 px' },
  { value: '20px', label: '20 px' },
  { value: '22px', label: '22 px' },
  { value: '24px', label: '24 px' },
  { value: '26px', label: '26 px' },
  { value: '28px', label: '28 px' },
]
const DEFAULT_PRESENTATION_SETTINGS = {
  fontFamily: 'system-ui',
  imageBorderRadius: '8px',
  fontSizePresentationTitle: '38px',
  fontSizeHeading: '38px',
  fontSizeText: '22px',
  fontSizePrice: '18px',
}
const presentationSettings = ref({ ...DEFAULT_PRESENTATION_SETTINGS })

function resetPresentationSettings() {
  presentationSettings.value = { ...DEFAULT_PRESENTATION_SETTINGS }
}

const presentationStyle = computed(() => ({
  fontFamily: presentationSettings.value.fontFamily,
  '--booklet-image-radius': presentationSettings.value.imageBorderRadius,
  '--booklet-font-size-presentation-title': presentationSettings.value.fontSizePresentationTitle,
  '--booklet-font-size-heading': presentationSettings.value.fontSizeHeading,
  '--booklet-font-size-text': presentationSettings.value.fontSizeText,
  '--booklet-font-size-price': presentationSettings.value.fontSizePrice,
} as Record<string, string>))

/** Мета презентации: статус, публичная ссылка, shortId (только владелец) */
const presentationMeta = ref<{
  status: string
  isPublic: boolean
  publicUrl: string
  publicHash: string
  shortId: string
}>({
  status: 'draft',
  isPublic: false,
  publicUrl: '',
  publicHash: '',
  shortId: '',
})

/** Презентация опубликована — замена изображений недоступна владельцу (администратор может менять) */
const isPublished = computed(() => presentationMeta.value.status === 'published')

/** Успешное копирование: подсветка кнопки (публичная ссылка / ID) */
const copyLinkCopied = ref(false)
const copyIdCopied = ref(false)

/** Идёт сохранение по кнопке «Сохранить» */
const saving = ref(false)

/** Статус автосохранения */
const autoSaveStatus = ref('')
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
/** Интервал автосохранения после последнего изменения (промежуточное сохранение без кнопки) */
const AUTO_SAVE_INTERVAL_MS = 12000
const initialLoadDone = ref(false)
const presentationNotFound = ref(false)

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

/** Генерация краткого описания для обложки (заполняет шаблон по данным слайда) */
function generateCoverShortDescription(slide: SlideItem) {
  const subtitle = String(slide.data?.subtitle || '').trim()
  const title = String(slide.data?.title || '').trim()
  const dealType = slide.data?.deal_type === 'Продажа' ? 'продаже' : 'аренде'
  const base = subtitle || title || 'Объект недвижимости'
  const generated = `Эксклюзивное предложение: ${base}. Уникальный объект на ${dealType}. Подробности в презентации.`
  if (!slide.data) slide.data = {}
  slide.data.shortDescription = (slide.data.shortDescription ? String(slide.data.shortDescription).trim() + '\n\n' : '') + generated
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

// Местоположение и генерация: базовый URL API (геокодер, метро)
const EDITOR_API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : '/api'

const dadataToken = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DADATA_API_KEY
  ? String(import.meta.env.VITE_DADATA_API_KEY)
  : ''
).trim()

const locationGeocodeTimerBySlideId = ref<Record<string, ReturnType<typeof setTimeout>>>({})

// Подсказки Dadata через JavaScript API (без vue-dadata)
type DadataSuggestionItem = { value: string; geo_lat?: number; geo_lon?: number }
const dadataSuggestionsBySlideId = ref<Record<string, DadataSuggestionItem[]>>({})
const dadataLoadingBySlideId = ref<Record<string, boolean>>({})
const dadataDebounceBySlideId = ref<Record<string, ReturnType<typeof setTimeout>>>({})
const dadataBlurTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

async function fetchDadataSuggestions(slideId: string, query: string): Promise<void> {
  if (!dadataToken || !query.trim()) {
    dadataSuggestionsBySlideId.value[slideId] = []
    return
  }
  dadataLoadingBySlideId.value[slideId] = true
  try {
    const res = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${dadataToken}`,
      },
      body: JSON.stringify({ query: query.trim(), count: 10 }),
    })
    if (!res.ok) {
      dadataSuggestionsBySlideId.value[slideId] = []
      return
    }
    const data = (await res.json()) as {
      suggestions?: Array<{
        value?: string
        data?: { geo_lat?: string | null; geo_lon?: string | null }
      }>
    }
    const list = (data.suggestions ?? []).map((s) => {
      const value = s.value ?? ''
      const latRaw = s.data?.geo_lat
      const lonRaw = s.data?.geo_lon
      const geo_lat = latRaw != null && latRaw !== '' ? parseFloat(String(latRaw)) : undefined
      const geo_lon = lonRaw != null && lonRaw !== '' ? parseFloat(String(lonRaw)) : undefined
      return { value, geo_lat: Number.isFinite(geo_lat) ? geo_lat : undefined, geo_lon: Number.isFinite(geo_lon) ? geo_lon : undefined }
    })
    dadataSuggestionsBySlideId.value[slideId] = list
  } catch {
    dadataSuggestionsBySlideId.value[slideId] = []
  } finally {
    dadataLoadingBySlideId.value[slideId] = false
  }
}

function onLocationAddressInput(slide: SlideItem, v: string) {
  const idx = slides.value.findIndex((item) => item.id === slide.id)
  if (idx === -1) return
  const target = slides.value[idx]
  if (!target.data) target.data = {} as Record<string, unknown>
  ;(target.data as Record<string, unknown>).address = v

  const tid = dadataDebounceBySlideId.value[slide.id]
  if (tid) clearTimeout(tid)
  if (v.trim().length < 3) {
    dadataSuggestionsBySlideId.value[slide.id] = []
    return
  }
  dadataDebounceBySlideId.value[slide.id] = setTimeout(() => {
    delete dadataDebounceBySlideId.value[slide.id]
    fetchDadataSuggestions(slide.id, v)
  }, 300)

  const geocodeTid = locationGeocodeTimerBySlideId.value[slide.id]
  if (geocodeTid) clearTimeout(geocodeTid)
  if (v.trim().length < 5) return
  locationGeocodeTimerBySlideId.value[slide.id] = setTimeout(() => {
    delete locationGeocodeTimerBySlideId.value[slide.id]
    const t = slides.value.find((item) => item.id === slide.id)
    if (t?.data && String((t.data as Record<string, unknown>).address ?? '').trim().length >= 5) {
      const lat = Number((t.data as Record<string, unknown>).lat)
      const lng = Number((t.data as Record<string, unknown>).lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) geocodeAddress(t)
    }
  }, 500)
}

function onLocationAddressFocus(_slide: SlideItem) {
  if (dadataBlurTimer.value) {
    clearTimeout(dadataBlurTimer.value)
    dadataBlurTimer.value = null
  }
}

function onLocationAddressBlur() {
  dadataBlurTimer.value = setTimeout(() => {
    dadataSuggestionsBySlideId.value = {}
    dadataBlurTimer.value = null
  }, 200)
}

function applyDadataSuggestion(slide: SlideItem, item: DadataSuggestionItem) {
  const tid = locationGeocodeTimerBySlideId.value[slide.id]
  if (tid) {
    clearTimeout(tid)
    delete locationGeocodeTimerBySlideId.value[slide.id]
  }
  const idx = slides.value.findIndex((s) => s.id === slide.id)
  if (idx === -1) return
  const target = slides.value[idx]
  const prevData = (target.data || {}) as Record<string, unknown>
  const hasCoords = item.geo_lat != null && item.geo_lon != null
  target.data = {
    ...prevData,
    address: item.value,
    ...(hasCoords ? { lat: item.geo_lat, lng: item.geo_lon } : {}),
  }
  dadataSuggestionsBySlideId.value[slide.id] = []
  if (!hasCoords) {
    geocodeAddress(target)
  }
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
      return { heading: 'Контакты', contactName: '', aboutText: '', phone: '', email: '', address: '', messengers: {} as Record<string, string>, messengersText: '', avatarUrl: '', logoUrl: '', contactImageUrl: '', images: [] as string[] }
    default:
      return {}
  }
}

const { currentUser } = useAuth()
const isAdmin = computed(() => (currentUser.value as { role_id?: number } | undefined)?.role_id === 2)
/** Редактирование изображений: либо черновик, либо зашёл администратор */
const canEditImages = computed(() => !isPublished.value || isAdmin.value)
const isTestDrive = computed(() => (currentUser.value as { tariff?: string } | undefined)?.tariff === 'test_drive')
const canAddSlide = computed(() => !isTestDrive.value || slides.value.length < 4)

/** Подстановка данных профиля в слайд «Контакты» по настройкам «Выводить в презентации». */
function applyProfileToContactsSlide(data: Record<string, unknown>) {
  const user = currentUser.value
  const prefs = user?.presentation_display_preferences
  if (!user || !prefs) return

  const toUrl = (v: string | null | undefined) => {
    if (!v || !String(v).trim()) return ''
    const s = String(v).trim()
    return s.startsWith('/') ? s : `/${s}`
  }
  const fullName = [user.name, user.middle_name, user.last_name].filter(Boolean).join(' ') || user.email || ''

  if (prefs.avatarOrLogo === 'personal' && user.user_img) {
    data.avatarUrl = toUrl(user.user_img)
    data.logoUrl = ''
  } else if (prefs.avatarOrLogo === 'company' && user.company_logo) {
    data.logoUrl = toUrl(user.company_logo)
    data.avatarUrl = ''
  }

  data.heading = 'Контакты'
  if (prefs.nameOrOrg === 'personal' && fullName) data.contactName = fullName
  else if (prefs.nameOrOrg === 'company' && user.company_name) data.contactName = String(user.company_name).trim()

  if (prefs.showAbout && user.position) data.aboutText = String(user.position).trim()

  if (prefs.phoneType === 'personal' && user.personal_phone) data.phone = String(user.personal_phone).trim()
  else if (prefs.phoneType === 'work' && user.work_phone) data.phone = String(user.work_phone).trim()

  const email = prefs.nameOrOrg === 'company' && user.work_email ? user.work_email : user.email
  if (email) data.email = String(email).trim()

  if (prefs.showMessengers && user.messengers && typeof user.messengers === 'object') {
    const out: Record<string, string> = {}
    Object.entries(user.messengers).forEach(([k, v]) => {
      if (v && String(v).trim()) out[k] = String(v).trim()
    })
    if (Object.keys(out).length) data.messengers = out
  }
}

function addSlide(type: string) {
  if (isTestDrive.value && slides.value.length >= 4) {
    alert('На тарифе «Тест драйв» допускается не более 4 слайдов. Перейдите на тариф «Эксперт» для расширенных возможностей.')
    return
  }
  const defaultData = getDefaultDataForType(type)
  const newSlide: SlideItem = {
    id: genSlideId(),
    type,
    data: defaultData,
    hidden: false,
  }
  if (type === 'contacts') applyProfileToContactsSlide(newSlide.data)
  slides.value.push(newSlide)
  const idx = slides.value.length - 1

  activeSlideIndex.value = idx
  nextTick(() => goToSlide(idx))
}

function duplicateSlide(index: number) {
  if (isTestDrive.value && slides.value.length >= 4) {
    alert('На тарифе «Тест драйв» допускается не более 4 слайдов.')
    return
  }
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

function onDragMove(_event: { relatedContext: { index: number } }) {
  // Прокрутка отключена — слайды выводятся плиткой
}

const MAX_CHARACTERISTICS = 13

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

watch(presentationSettings, () => {
  if (initialLoadDone.value) scheduleAutoSave()
}, { deep: true })

function backupToLocalStorage() {
  try {
    const title = (slides.value[0]?.type === 'cover' && slides.value[0]?.data?.title)
      ? String(slides.value[0].data.title).trim() || 'Без названия'
      : 'Без названия'
    localStorage.setItem(`presentation-${presentationId.value}`, JSON.stringify({ slides: slides.value, settings: { ...presentationSettings.value } }))
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

// Обработчик клика вне меню "Добавить слайд"
const addSlideMenuRef = ref<HTMLElement | null>(null)
const addSlideWrapRef = ref<HTMLElement | null>(null)
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const inDesktopWrap = addSlideWrapRef.value?.contains(target)
  const inSidebar = target.closest('.editor-sidebar')
  const inMobileAdd = target.closest('.mob-editor-buttons__add') || target.closest('[data-mob-add-menu]')
  if (inDesktopWrap || inSidebar || inMobileAdd) return
  showAddSlideMenu.value = false
  showSettingsMenu.value = false
}

let editorMounted = true
onMounted(async () => {
  // Обработчик клика вне меню
  document.addEventListener('click', handleClickOutside)

  if (route.path === '/dashboard/presentations/new') {
    router.replace('/dashboard/presentations')
    return
  }
  const id = presentationId.value
  if (hasApi() && getToken()) {
    try {
      const data = await api.get<PresentationFull & { status?: string; isPublic?: boolean; publicUrl?: string; publicHash?: string; shortId?: string }>(`/api/presentations/${id}`)
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
      if (data?.shortId != null) presentationMeta.value.shortId = data.shortId
      const contentWithSettings = data?.content as { slides?: unknown[]; settings?: Record<string, string> } | undefined
      if (contentWithSettings?.settings && typeof contentWithSettings.settings === 'object') {
        const s = contentWithSettings.settings
        if (s.fontFamily != null) presentationSettings.value.fontFamily = s.fontFamily
        if (s.imageBorderRadius != null) presentationSettings.value.imageBorderRadius = s.imageBorderRadius
        if (s.fontSizePresentationTitle != null) presentationSettings.value.fontSizePresentationTitle = s.fontSizePresentationTitle
        if (s.fontSizeHeading != null) presentationSettings.value.fontSizeHeading = s.fontSizeHeading
        if (s.fontSizeText != null) presentationSettings.value.fontSizeText = s.fontSizeText
        if (s.fontSizePrice != null) presentationSettings.value.fontSizePrice = s.fontSizePrice
      }
    } catch (err) {
      if (editorMounted) {
        if (err instanceof ApiError && err.status === 404) {
          presentationNotFound.value = true
        } else {
          loadFromLocalStorage()
        }
      }
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
  Object.values(locationGeocodeTimerBySlideId.value).forEach((tid) => clearTimeout(tid))
  Object.values(dadataDebounceBySlideId.value).forEach((tid) => clearTimeout(tid))
  if (dadataBlurTimer.value) clearTimeout(dadataBlurTimer.value)
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
      if (saved.settings && typeof saved.settings === 'object') {
        const s = saved.settings as Record<string, string>
        if (s.fontFamily != null) presentationSettings.value.fontFamily = s.fontFamily
        if (s.imageBorderRadius != null) presentationSettings.value.imageBorderRadius = s.imageBorderRadius
        if (s.fontSizePresentationTitle != null) presentationSettings.value.fontSizePresentationTitle = s.fontSizePresentationTitle
        if (s.fontSizeHeading != null) presentationSettings.value.fontSizeHeading = s.fontSizeHeading
        if (s.fontSizeText != null) presentationSettings.value.fontSizeText = s.fontSizeText
        if (s.fontSizePrice != null) presentationSettings.value.fontSizePrice = s.fontSizePrice
      }
    }
  } catch {
    // keep default slides
  }
}

async function doSave(options?: { status?: string; skipRedirect?: boolean; createNotification?: boolean }) {
  const cover = slides.value.find((s) => s.type === 'cover')
  const title = (cover?.type === 'cover' && cover.data?.title)
    ? String(cover.data.title).trim() || 'Без названия'
    : 'Без названия'
  const coverImage = (cover?.type === 'cover' && cover.data?.coverImageUrl) ? String(cover.data.coverImageUrl) : undefined
  const content = { slides: slides.value, settings: { ...presentationSettings.value } }
  const status = options?.status
  const skipRedirect = options?.skipRedirect ?? false
  const createNotification = options?.createNotification ?? false

  if (hasApi() && getToken()) {
    try {
      const body: { title: string; coverImage?: string; content: { slides: SlideItem[] }; status?: string; createNotification?: boolean } = { title, coverImage, content }
      if (status !== undefined) body.status = status
      if (createNotification) body.createNotification = true
      const data = await api.put<PresentationFull & { status?: string; isPublic?: boolean; publicUrl?: string; publicHash?: string; shortId?: string }>(`/api/presentations/${presentationId.value}`, body)
      if (data?.status != null) presentationMeta.value.status = data.status
      if (data?.isPublic != null) presentationMeta.value.isPublic = data.isPublic
      if (data?.publicUrl != null) presentationMeta.value.publicUrl = data.publicUrl
      if (data?.publicHash != null) presentationMeta.value.publicHash = data.publicHash
      if (data?.shortId != null) presentationMeta.value.shortId = data.shortId
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

const PUBLISH_WARNING = 'После нажатия кнопки публикации невозможно будет заменить изображения в презентации. Презентация будет опубликована. Замена изображений возможна только через техническую поддержку.\n\nПродолжить публикацию?'

async function savePresentation() {
  if (saving.value) return
  saving.value = true
  autoSaveStatus.value = 'Сохранение...'
  try {
    const ok = await doSave({ skipRedirect: true, createNotification: false })
    autoSaveStatus.value = ok ? 'Сохранено' : 'Ошибка сохранения'
    if (ok) setTimeout(() => { autoSaveStatus.value = '' }, 2000)
  } finally {
    saving.value = false
  }
}

async function publishPresentation() {
  if (!confirm(PUBLISH_WARNING)) return
  autoSaveStatus.value = 'Публикация...'
  const ok = await doSave({ status: 'published', skipRedirect: true, createNotification: true })
  autoSaveStatus.value = ok ? 'Опубликовано' : 'Ошибка'
  if (ok) setTimeout(() => { autoSaveStatus.value = '' }, 2000)
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    await doSave({ skipRedirect: true, createNotification: false })
  }, AUTO_SAVE_INTERVAL_MS)
}

function saveToLocalStorage(skipRedirect = false) {
  const title = (slides.value[0]?.type === 'cover' && slides.value[0]?.data?.title)
    ? String(slides.value[0].data.title).trim() || 'Без названия'
    : 'Без названия'
  localStorage.setItem(
    `presentation-${presentationId.value}`,
    JSON.stringify({ slides: slides.value, settings: { ...presentationSettings.value } })
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
    copyLinkCopied.value = true
    setTimeout(() => { copyLinkCopied.value = false }, 2000)
  } catch {
    alert('Не удалось скопировать ссылку')
  }
}

/** Скопировать ID презентации в буфер */
async function copyShortId() {
  const id = presentationMeta.value.shortId
  if (!id) return
  try {
    await navigator.clipboard.writeText(id)
    copyIdCopied.value = true
    setTimeout(() => { copyIdCopied.value = false }, 2000)
  } catch {
    alert('Не удалось скопировать ID')
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
/* Слайдер: единый формат 1123×794 (из booklet-slides.css), width для гибкости в редакторе */
.presentation-slider-wrap {
  width: 100%;
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
  
  /* Улучшаем поля ввода в слайдах (размер шрифта — из настроек презентации) */
  .presentation-slider-wrap.booklet-view .booklet-main__content input,
  .presentation-slider-wrap.booklet-view .booklet-info__text textarea,
  .presentation-slider-wrap.booklet-view .booklet-stroen__text textarea {
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

      /* На мобильных отключаем единый формат — высота задаётся min/max, контент с прокруткой */
      .presentation-slider-wrap.booklet-view {
        aspect-ratio: auto;
        max-width: none;
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
