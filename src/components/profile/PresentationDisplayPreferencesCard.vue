<template>
  <div class="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
    <h4 class="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">Выводить в презентации</h4>
    <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
      Выберите, какие данные из вашего профиля будут автоматически подставляться в блок контакты при создании презентации.
    </p>
    <form @submit.prevent="save" class="flex flex-col">
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
        <button type="submit" :disabled="prefsLoading" class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto">{{ prefsLoading ? 'Сохранение...' : 'Сохранить' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
