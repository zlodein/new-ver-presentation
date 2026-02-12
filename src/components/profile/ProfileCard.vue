<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <AvatarUpload
            :initials="userInitials"
            :current-image="userImage"
            @uploaded="handleAvatarUploaded"
          />
          <div class="order-3 xl:order-2">
            <h4
              class="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left"
            >
              {{ fullName || 'Пользователь' }}
            </h4>
            <div
              class="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left"
            >
              <p v-if="currentUser?.position" class="text-sm text-gray-500 dark:text-gray-400">{{ currentUser.position }}</p>
            </div>
          </div>
          <div class="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
            <MessengerIcons :messengers="currentUser?.messengers" />
          </div>
        </div>
        <button @click="isPresentationPrefsModal = true" class="edit-button">
          <svg class="fill-current shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15ZM12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 2.5C10.5 1.67157 11.1716 1 12 1C12.8284 1 13.5 1.67157 13.5 2.5V4.5C13.5 5.32843 12.8284 6 12 6C11.1716 6 10.5 5.32843 10.5 4.5V2.5ZM12 8C11.1716 8 10.5 8.67157 10.5 9.5V10.5C10.5 11.3284 11.1716 12 12 12C12.8284 12 13.5 11.3284 13.5 10.5V9.5C13.5 8.67157 12.8284 8 12 8Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6 10.5C6 9.67157 6.67157 9 7.5 9H8.5C9.32843 9 10 9.67157 10 10.5C10 11.3284 9.32843 12 8.5 12H7.5C6.67157 12 6 11.3284 6 10.5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14 10.5C14 9.67157 14.6716 9 15.5 9H16.5C17.3284 9 18 9.67157 18 10.5C18 11.3284 17.3284 12 16.5 12H15.5C14.6716 12 14 11.3284 14 10.5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.5 13.5C2.5 12.6716 3.17157 12 4 12H5C5.82843 12 6.5 12.6716 6.5 13.5C6.5 14.3284 5.82843 15 5 15H4C3.17157 15 2.5 14.3284 2.5 13.5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 13.5C17.5 12.6716 18.1716 12 19 12H20C20.8284 12 21.5 12.6716 21.5 13.5C21.5 14.3284 20.8284 15 20 15H19C18.1716 15 17.5 14.3284 17.5 13.5Z" fill="currentColor"/>
          </svg>
          Данные для презентаций
        </button>
      </div>
    </div>
    <Modal v-if="isPresentationPrefsModal" @close="isPresentationPrefsModal = false">
      <template #body>
        <div class="no-scrollbar relative w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <button
            @click="isPresentationPrefsModal = false"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
            aria-label="Закрыть"
          >
            <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z" fill=""/>
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Выводить в презентации</h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Выберите, какие данные из вашего профиля будут автоматически подставляться в блок контакты при создании презентации.
            </p>
          </div>
          <form @submit.prevent="savePresentationPrefs" class="flex flex-col">
            <div v-if="prefsError" class="mb-4 mx-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{{ prefsError }}</div>
            <div class="custom-scrollbar max-h-[60vh] overflow-y-auto space-y-6 p-2">
              <div>
                <p class="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">Фото или логотип</p>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.avatarOrLogo" type="radio" value="none" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Не выбрано</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.avatarOrLogo" type="radio" value="personal" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Личное фото</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.avatarOrLogo" type="radio" value="company" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Логотип компании</span>
                  </label>
                </div>
              </div>
              <div>
                <p class="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">ФИО или название организации</p>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.nameOrOrg" type="radio" value="none" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Не выбрано</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.nameOrOrg" type="radio" value="personal" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Личные данные</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.nameOrOrg" type="radio" value="company" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Название организации</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="prefsForm.showAbout" type="checkbox" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                  <span class="text-sm font-medium text-gray-800 dark:text-white/90">О себе</span>
                </label>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Выводить данные о себе?</p>
              </div>
              <div>
                <p class="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">Телефон</p>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.phoneType" type="radio" value="none" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Не выбрано</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.phoneType" type="radio" value="personal" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Личный номер</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="prefsForm.phoneType" type="radio" value="work" class="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Рабочий номер</span>
                  </label>
                </div>
              </div>
              <div>
                <p class="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">Мессенджеры</p>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="prefsForm.showMessengers" type="checkbox" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Выводить заполненные мессенджеры</span>
                </label>
              </div>
            </div>
            <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button type="button" @click="isPresentationPrefsModal = false" class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">Отмена</button>
              <button type="submit" :disabled="prefsLoading" class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto">{{ prefsLoading ? 'Сохранение...' : 'Сохранить' }}</button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Modal from './Modal.vue'
import MessengerIcons from './MessengerIcons.vue'
import AvatarUpload from './AvatarUpload.vue'
import { useAuth } from '@/composables/useAuth'
import { api, ApiError } from '@/api/client'
import type { PresentationDisplayPreferences } from '@/api/client'

const { currentUser, fetchUser } = useAuth()
const isPresentationPrefsModal = ref(false)
const prefsLoading = ref(false)
const prefsError = ref('')

const prefsForm = ref<PresentationDisplayPreferences & { avatarOrLogo?: string; nameOrOrg?: string; phoneType?: string }>({
  avatarOrLogo: 'none',
  nameOrOrg: 'none',
  showAbout: false,
  phoneType: 'none',
  showMessengers: false,
})

const handleAvatarUploaded = async () => {
  await fetchUser()
}

watch(isPresentationPrefsModal, (isOpen) => {
  if (isOpen && currentUser.value?.presentation_display_preferences) {
    const p = currentUser.value.presentation_display_preferences
    prefsForm.value = {
      avatarOrLogo: p.avatarOrLogo ?? 'none',
      nameOrOrg: p.nameOrOrg ?? 'none',
      showAbout: p.showAbout ?? false,
      phoneType: p.phoneType ?? 'none',
      showMessengers: p.showMessengers ?? false,
    }
    prefsError.value = ''
  } else if (isOpen) {
    prefsForm.value = { avatarOrLogo: 'none', nameOrOrg: 'none', showAbout: false, phoneType: 'none', showMessengers: false }
    prefsError.value = ''
  }
})

const fullName = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.name || ''
  const last_name = currentUser.value.last_name || ''
  const middle_name = currentUser.value.middle_name || ''
  const parts = [name, middle_name, last_name].filter(Boolean)
  return parts.join(' ') || currentUser.value.email
})

const userInitials = computed(() => {
  if (!currentUser.value) return 'П'
  const name = currentUser.value.name || ''
  const last_name = currentUser.value.last_name || ''
  let initials = ''
  if (name) initials += name.charAt(0).toUpperCase()
  if (last_name) initials += last_name.charAt(0).toUpperCase()
  if (!initials && currentUser.value.email) {
    initials = currentUser.value.email.charAt(0).toUpperCase()
  }
  return initials || 'П'
})

const userImage = computed(() => {
  if (!currentUser.value) return null
  const img = currentUser.value.user_img
  if (img && img.trim()) {
    if (img.startsWith('/uploads/')) return img
    return img.startsWith('/') ? img : `/${img}`
  }
  return null
})

async function savePresentationPrefs() {
  prefsError.value = ''
  prefsLoading.value = true
  try {
    const payload: PresentationDisplayPreferences = {
      avatarOrLogo: prefsForm.value.avatarOrLogo === 'none' ? undefined : (prefsForm.value.avatarOrLogo as 'personal' | 'company'),
      nameOrOrg: prefsForm.value.nameOrOrg === 'none' ? undefined : (prefsForm.value.nameOrOrg as 'personal' | 'company'),
      showAbout: prefsForm.value.showAbout || undefined,
      phoneType: prefsForm.value.phoneType === 'none' ? undefined : (prefsForm.value.phoneType as 'personal' | 'work'),
      showMessengers: prefsForm.value.showMessengers || undefined,
    }
    await api.put('/api/auth/profile', { presentation_display_preferences: payload })
    await fetchUser()
    isPresentationPrefsModal.value = false
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

onMounted(() => {
  fetchUser()
})
</script>
