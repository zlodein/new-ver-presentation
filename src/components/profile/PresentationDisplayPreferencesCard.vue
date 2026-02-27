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
        <div>
          <label class="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-400">
            <div class="relative">
              <input type="checkbox" v-model="prefsForm.showMessengers" class="sr-only" />
              <div class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]" :class="prefsForm.showMessengers ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'">
                <span :class="{ 'opacity-0': !prefsForm.showMessengers }">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="1.94437" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
            Выводить заполненные мессенджеры
          </label>
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

const { currentUser, fetchUser } = useAuth()
const prefsLoading = ref(false)
const prefsError = ref('')

const prefsForm = ref<PresentationDisplayPreferences & { avatarOrLogo?: string; nameOrOrg?: string; phoneType?: string; aboutType?: string }>({
  avatarOrLogo: 'none',
  nameOrOrg: 'none',
  aboutType: 'none',
  phoneType: 'none',
  showMessengers: false,
})

function initForm() {
  if (currentUser.value?.presentation_display_preferences) {
    const p = currentUser.value.presentation_display_preferences
    const aboutType = p.aboutType ?? (p.showAbout ? 'about' : 'none')
    prefsForm.value = {
      avatarOrLogo: p.avatarOrLogo ?? 'none',
      nameOrOrg: p.nameOrOrg ?? 'none',
      aboutType,
      phoneType: p.phoneType ?? 'none',
      showMessengers: p.showMessengers ?? false,
    }
  } else {
    prefsForm.value = { avatarOrLogo: 'none', nameOrOrg: 'none', aboutType: 'none', phoneType: 'none', showMessengers: false }
  }
  prefsError.value = ''
}

watch(currentUser, () => initForm(), { deep: true })

async function save() {
  prefsError.value = ''
  prefsLoading.value = true
  try {
    const payload: PresentationDisplayPreferences = {
      avatarOrLogo: prefsForm.value.avatarOrLogo === 'none' ? undefined : (prefsForm.value.avatarOrLogo as 'personal' | 'company'),
      nameOrOrg: prefsForm.value.nameOrOrg === 'none' ? undefined : (prefsForm.value.nameOrOrg as 'personal' | 'company'),
      aboutType: prefsForm.value.aboutType === 'none' ? undefined : (prefsForm.value.aboutType as 'about' | 'position'),
      phoneType: prefsForm.value.phoneType === 'none' ? undefined : (prefsForm.value.phoneType as 'personal' | 'work'),
      showMessengers: prefsForm.value.showMessengers || undefined,
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
