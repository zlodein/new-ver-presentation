<template>
  <div>
    <div class="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <!-- Блок логотипа компании (редактируемый, по аналогии с профилем) -->
          <div class="relative">
            <div
              class="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-brand-500 text-white font-semibold text-2xl cursor-pointer group relative"
              @click="companyLogoInputRef?.click()"
            >
              <img
                v-if="companyLogoDisplayUrl"
                :src="companyLogoDisplayUrl"
                alt="Лого компании"
                class="w-full h-full object-cover"
              />
              <span v-else class="select-none text-sm">Лого</span>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input
              ref="companyLogoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onCompanyLogoFileChange"
            />
          </div>
          <div class="order-3 xl:order-2">
            <h4 class="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {{ currentUser?.company_name || 'Название компании' }}
            </h4>
            <div class="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p v-if="currentUser?.work_website" class="text-sm text-gray-500 dark:text-gray-400">{{ currentUser.work_website }}</p>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">Сайт компании</p>
            </div>
          </div>
        </div>
        <button
          @click="isProfileWorkModal = true"
          class="edit-button flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            class="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Редактировать
        </button>
      </div>
      <div v-if="error && !isProfileWorkModal" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {{ error }}
      </div>
      <!-- Сетка полей: место работы, должность, контакты -->
      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Место работы</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ currentUser?.company_name || '—' }}
            </p>
          </div>
          <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Должность</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ currentUser?.work_position || '—' }}
            </p>
          </div>
          <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Рабочая почта</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ currentUser?.work_email || '—' }}
            </p>
          </div>
          <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Рабочий телефон</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ currentUser?.work_phone || '—' }}
            </p>
          </div>
          <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Сайт компании</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ currentUser?.work_website || '—' }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <Modal v-if="isProfileWorkModal" @close="isProfileWorkModal = false">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <button
            @click="isProfileWorkModal = false"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Редактирование данных о работе
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Обновите рабочие данные для актуальности профиля.
            </p>
          </div>
          <form @submit.prevent="saveWork" class="flex flex-col">
            <div v-if="error" class="mb-4 mx-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {{ error }}
            </div>
            <div class="px-2 overflow-y-auto custom-scrollbar">
              <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Место работы
                  </label>
                  <input
                    v-model="formData.company_name"
                    type="text"
                    placeholder="Название компании"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Должность
                  </label>
                  <input
                    v-model="formData.work_position"
                    type="text"
                    placeholder="Должность"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Пока не привязано к справочнику в базе</p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Рабочая почта
                  </label>
                  <input
                    v-model="formData.work_email"
                    type="email"
                    placeholder="work@company.com"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Рабочий телефон
                  </label>
                  <input
                    v-model="formData.work_phone"
                    type="tel"
                    placeholder="+7 (000) 000-00-00"
                    @input="handleWorkPhoneInput"
                    maxlength="18"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <div class="col-span-2">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Сайт компании
                  </label>
                  <input
                    v-model="formData.work_website"
                    type="url"
                    placeholder="https://company.com"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 mt-6 px-2 lg:justify-end">
              <button
                @click="isProfileWorkModal = false"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Закрыть
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {{ loading ? 'Сохранение...' : 'Сохранить изменения' }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Modal from './Modal.vue'
import { useAuth } from '@/composables/useAuth'
import { api, ApiError } from '@/api/client'
import { usePhoneMask } from '@/composables/usePhoneMask'
import { getToken } from '@/api/client'

const { currentUser, fetchUser } = useAuth()
const isProfileWorkModal = ref(false)
const loading = ref(false)
const error = ref('')

const formData = ref({
  company_name: '',
  work_position: '',
  work_email: '',
  work_phone: '',
  work_website: '',
})

const companyLogoUrl = computed(() => {
  const url = currentUser.value?.company_logo
  if (!url) return ''
  return url.startsWith('/') ? url : `/${url}`
})

const companyLogoInputRef = ref<HTMLInputElement | null>(null)
const companyLogoUploading = ref(false)
const companyLogoDisplayUrl = computed(() => companyLogoUrl.value || '')

async function onCompanyLogoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Размер файла не должен превышать 5MB'
    return
  }
  companyLogoUploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file, file.name)
    const base = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env?.VITE_API_URL?.replace(/\/$/, '') ?? ''
    const res = await fetch(`${base}/api/upload/company-logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken() ?? ''}` },
      body: fd,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Ошибка загрузки логотипа')
    }
    const data = await res.json()
    await api.put('/api/auth/profile', { company_logo: data.url })
    await fetchUser()
  } catch (err) {
    console.error('Ошибка загрузки логотипа:', err)
    error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
  } finally {
    companyLogoUploading.value = false
    input.value = ''
  }
}

const { formatPhone } = usePhoneMask()

watch(isProfileWorkModal, (isOpen) => {
  if (isOpen && currentUser.value) {
    const phone = currentUser.value.work_phone || ''
    formData.value = {
      company_name: currentUser.value.company_name || '',
      work_position: currentUser.value.work_position || '',
      work_email: currentUser.value.work_email || '',
      work_phone: phone ? formatPhone(phone) : '',
      work_website: currentUser.value.work_website || '',
    }
    error.value = ''
  }
})

function handleWorkPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  const formatted = formatPhone(input.value)
  formData.value.work_phone = formatted
  input.value = formatted
}

async function saveWork() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    const cleanPhone = formData.value.work_phone.replace(/\D/g, '')
    await api.put('/api/auth/profile', {
      company_name: formData.value.company_name.trim(),
      work_position: formData.value.work_position.trim(),
      work_email: formData.value.work_email.trim(),
      work_phone: cleanPhone,
      work_website: formData.value.work_website.trim(),
    })
    await fetchUser()
    isProfileWorkModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения данных о работе:', err)
    if (err instanceof ApiError) {
      error.value = err.message || 'Ошибка сохранения'
    } else {
      error.value = err instanceof Error ? err.message : 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>
