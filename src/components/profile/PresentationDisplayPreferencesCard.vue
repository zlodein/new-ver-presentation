<template>
  <div class="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
    <h4 class="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Выводить в презентации</h4>
    <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
      Выберите, какие данные из вашего профиля будут автоматически подставляться в блок контакты при создании презентации.
    </p>

    <div class="grid gap-8 lg:grid-cols-2 lg:items-start">
      <!-- Левая колонка (ПК): что выводить -->
      <form @submit.prevent="save" class="flex flex-col order-2 lg:order-1">
      <div v-if="prefsError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{{ prefsError }}</div>
      <div class="space-y-6">
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Фото или логотип</p>
          <div class="flex flex-col gap-2">
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.avatarOrLogo === 'none' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="none" v-model="prefsForm.avatarOrLogo" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.avatarOrLogo === 'none' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.avatarOrLogo === 'none' ? 'block' : 'hidden'"></span>
              </span>
              Не выбрано
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.avatarOrLogo === 'personal' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="personal" v-model="prefsForm.avatarOrLogo" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.avatarOrLogo === 'personal' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.avatarOrLogo === 'personal' ? 'block' : 'hidden'"></span>
              </span>
              Личное фото
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.avatarOrLogo === 'company' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="company" v-model="prefsForm.avatarOrLogo" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.avatarOrLogo === 'company' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.avatarOrLogo === 'company' ? 'block' : 'hidden'"></span>
              </span>
              Логотип компании
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">ФИО или название организации</p>
          <div class="flex flex-col gap-2">
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.nameOrOrg === 'none' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="none" v-model="prefsForm.nameOrOrg" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.nameOrOrg === 'none' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.nameOrOrg === 'none' ? 'block' : 'hidden'"></span>
              </span>
              Не выбрано
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.nameOrOrg === 'personal' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="personal" v-model="prefsForm.nameOrOrg" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.nameOrOrg === 'personal' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.nameOrOrg === 'personal' ? 'block' : 'hidden'"></span>
              </span>
              Личные данные
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.nameOrOrg === 'company' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="company" v-model="prefsForm.nameOrOrg" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.nameOrOrg === 'company' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.nameOrOrg === 'company' ? 'block' : 'hidden'"></span>
              </span>
              Название организации
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Данные о себе / должность</p>
          <div class="flex flex-col gap-2">
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.aboutType === 'none' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="none" v-model="prefsForm.aboutType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.aboutType === 'none' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.aboutType === 'none' ? 'block' : 'hidden'"></span>
              </span>
              Не выбрано
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.aboutType === 'about' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="about" v-model="prefsForm.aboutType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.aboutType === 'about' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.aboutType === 'about' ? 'block' : 'hidden'"></span>
              </span>
              Данные о себе
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.aboutType === 'position' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="position" v-model="prefsForm.aboutType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.aboutType === 'position' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.aboutType === 'position' ? 'block' : 'hidden'"></span>
              </span>
              Должность
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Телефон</p>
          <div class="flex flex-col gap-2">
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.phoneType === 'none' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="none" v-model="prefsForm.phoneType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.phoneType === 'none' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.phoneType === 'none' ? 'block' : 'hidden'"></span>
              </span>
              Не выбрано
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.phoneType === 'personal' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="personal" v-model="prefsForm.phoneType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.phoneType === 'personal' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.phoneType === 'personal' ? 'block' : 'hidden'"></span>
              </span>
              Личный номер
            </label>
            <label class="relative flex items-center gap-3 text-sm font-medium cursor-pointer select-none" :class="prefsForm.phoneType === 'work' ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'">
              <input class="sr-only" type="radio" value="work" v-model="prefsForm.phoneType" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full border-[1.25px]" :class="prefsForm.phoneType === 'work' ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span class="w-2 h-2 bg-white rounded-full" :class="prefsForm.phoneType === 'work' ? 'block' : 'hidden'"></span>
              </span>
              Рабочий номер
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Выводить мессенджеры</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Отметьте мессенджеры, которые нужно подставлять в блок контактов презентации.</p>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="item in messengerItems"
              :key="item.key"
              type="button"
              :title="item.title"
              @click="toggleMessenger(item.key)"
              class="relative flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              :class="isMessengerSelected(item.key)
                ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'"
            >
              <img :src="item.icon" :alt="item.title" class="w-6 h-6 object-contain pointer-events-none" />
              <span v-if="isMessengerSelected(item.key)" class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                <svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-6 lg:justify-end">
        <button
          type="submit"
          :disabled="prefsLoading"
          class="flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 sm:w-auto transition-colors"
          :class="justSaved ? 'bg-success-500 hover:bg-success-600' : 'bg-brand-500 hover:bg-brand-600'"
        >
          {{ prefsLoading ? 'Сохранение...' : justSaved ? 'Сохранено' : 'Сохранить' }}
        </button>
      </div>
      </form>

      <!-- Правая колонка (ПК): что будет выводиться -->
      <div class="order-1 lg:order-2">
        <div class="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h5 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Что будет выводиться в презентации</h5>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p class="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Изображение</p>
              <div v-if="previewImageUrl" class="flex items-center gap-2">
                <img :src="previewImageUrl" alt="" class="h-12 w-12 rounded-lg object-cover" />
                <span class="text-sm text-gray-800 dark:text-gray-200">{{ previewImageLabel }}</span>
              </div>
              <p v-else class="text-sm text-gray-400 dark:text-gray-500">— не выбрано</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p class="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">ФИО / компания</p>
              <p class="text-sm text-gray-800 dark:text-gray-200">{{ previewNameOrOrg || '— не выбрано' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p class="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Данные о себе / должность</p>
              <p class="text-sm text-gray-800 dark:text-gray-200">{{ previewAbout || '— не выбрано' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p class="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Телефон</p>
              <p class="text-sm text-gray-800 dark:text-gray-200">{{ previewPhone || '— не выбрано' }}</p>
            </div>
          </div>
          <div v-if="previewMessengerKeys.length" class="mt-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
            <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Мессенджеры</p>
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="key in previewMessengerKeys"
                :key="key"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <img v-if="messengerItemByKey(key)" :src="messengerItemByKey(key)?.icon" :alt="messengerItemByKey(key)?.title" class="h-4 w-4 object-contain" />
                {{ messengerItemByKey(key)?.title ?? key }}
              </span>
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-gray-400 dark:text-gray-500">Мессенджеры не выбраны.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { api, ApiError } from '@/api/client'
import type { PresentationDisplayPreferences } from '@/api/client'

const messengerItems = [
  { key: 'twitter', title: 'Twitter', icon: '/images/icons/twitter-color.svg' },
  { key: 'whatsapp', title: 'WhatsApp', icon: '/images/icons/whatsapp-color.svg' },
  { key: 'telegram', title: 'Telegram', icon: '/images/icons/telegram-color.svg' },
  { key: 'viber', title: 'Viber', icon: '/images/icons/viber-color.svg' },
  { key: 'instagram', title: 'Instagram', icon: '/images/icons/instagram-color.svg' },
  { key: 'vk', title: 'Vk', icon: '/images/icons/vk-color.svg' },
  { key: 'max', title: 'Max', icon: '/images/icons/max-color.svg' },
  { key: 'x', title: 'X', icon: '/images/icons/x-color.svg' },
]

const { currentUser, fetchUser } = useAuth()
const prefsLoading = ref(false)
const prefsError = ref('')
const justSaved = ref(false)

const prefsForm = ref<PresentationDisplayPreferences & { avatarOrLogo?: string; nameOrOrg?: string; phoneType?: string; aboutType?: string; showMessengerKeys?: string[] }>({
  avatarOrLogo: 'none',
  nameOrOrg: 'none',
  aboutType: 'none',
  phoneType: 'none',
  showMessengerKeys: [],
})

function isMessengerSelected(key: string) {
  return (prefsForm.value.showMessengerKeys ?? []).includes(key)
}

function messengerItemByKey(key: string) {
  return messengerItems.find((m) => m.key === key)
}

const u = () => currentUser.value

/** Для наглядности: что будет выводиться по текущим настройкам */
const previewImageUrl = computed(() => {
  const choice = prefsForm.value.avatarOrLogo
  if (!choice || choice === 'none') return null
  if (choice === 'personal' && u()?.user_img) {
    const img = String(u()!.user_img!).trim()
    return img.startsWith('/') ? img : `/${img}`
  }
  if (choice === 'company' && u()?.company_logo) {
    const img = String(u()!.company_logo!).trim()
    return img.startsWith('/') ? img : `/${img}`
  }
  return null
})

const previewImageLabel = computed(() => {
  const choice = prefsForm.value.avatarOrLogo
  if (choice === 'personal') return 'Личное фото'
  if (choice === 'company') return 'Логотип компании'
  return ''
})

const previewNameOrOrg = computed(() => {
  const choice = prefsForm.value.nameOrOrg
  if (!choice || choice === 'none') return ''
  if (choice === 'personal') {
    const name = u()?.name ?? ''
    const last = u()?.last_name ?? ''
    const middle = u()?.middle_name ?? ''
    return [name, middle, last].filter(Boolean).join(' ') || (u()?.email ?? '')
  }
  if (choice === 'company') return u()?.company_name?.trim() ?? ''
  return ''
})

const previewAbout = computed(() => {
  const choice = prefsForm.value.aboutType
  if (!choice || choice === 'none') return ''
  if (choice === 'about') return u()?.position?.trim() ?? ''
  if (choice === 'position') return u()?.work_position?.trim() ?? ''
  return ''
})

const previewPhone = computed(() => {
  const choice = prefsForm.value.phoneType
  if (!choice || choice === 'none') return ''
  if (choice === 'personal') return u()?.personal_phone?.trim() ?? ''
  if (choice === 'work') return u()?.work_phone?.trim() ?? ''
  return ''
})

const previewMessengerKeys = computed(() => prefsForm.value.showMessengerKeys ?? [])

function toggleMessenger(key: string) {
  const keys = [...(prefsForm.value.showMessengerKeys ?? [])]
  const idx = keys.indexOf(key)
  if (idx >= 0) keys.splice(idx, 1)
  else keys.push(key)
  prefsForm.value.showMessengerKeys = keys
}

function initForm() {
  if (currentUser.value?.presentation_display_preferences) {
    const p = currentUser.value.presentation_display_preferences
    const aboutType = p.aboutType ?? (p.showAbout ? 'about' : 'none')
    const showMessengerKeys = Array.isArray(p.showMessengerKeys) ? p.showMessengerKeys : (p.showMessengers ? messengerItems.map(m => m.key) : [])
    prefsForm.value = {
      avatarOrLogo: p.avatarOrLogo ?? 'none',
      nameOrOrg: p.nameOrOrg ?? 'none',
      aboutType,
      phoneType: p.phoneType ?? 'none',
      showMessengerKeys,
    }
  } else {
    prefsForm.value = { avatarOrLogo: 'none', nameOrOrg: 'none', aboutType: 'none', phoneType: 'none', showMessengerKeys: [] }
  }
  prefsError.value = ''
}

watch(currentUser, () => initForm(), { deep: true })

async function save() {
  prefsError.value = ''
  prefsLoading.value = true
  try {
    const keys = prefsForm.value.showMessengerKeys ?? []
    const payload: PresentationDisplayPreferences = {
      avatarOrLogo: prefsForm.value.avatarOrLogo === 'none' ? undefined : (prefsForm.value.avatarOrLogo as 'personal' | 'company'),
      nameOrOrg: prefsForm.value.nameOrOrg === 'none' ? undefined : (prefsForm.value.nameOrOrg as 'personal' | 'company'),
      aboutType: prefsForm.value.aboutType === 'none' ? undefined : (prefsForm.value.aboutType as 'about' | 'position'),
      phoneType: prefsForm.value.phoneType === 'none' ? undefined : (prefsForm.value.phoneType as 'personal' | 'work'),
      showMessengers: keys.length > 0 || undefined,
      showMessengerKeys: keys.length > 0 ? keys : undefined,
    }
    await api.put('/api/auth/profile', { presentation_display_preferences: payload })
    await fetchUser()
    justSaved.value = true
    setTimeout(() => { justSaved.value = false }, 2500)
  } catch (e) {
    if (e instanceof ApiError) {
      prefsError.value = e.message || 'Ошибка сохранения'
    } else {
      prefsError.value = 'Ошибка соединения с сервером'
    }
  } finally {
    prefsLoading.value = false
  }
}

onMounted(async () => {
  await fetchUser()
  initForm()
})
</script>
