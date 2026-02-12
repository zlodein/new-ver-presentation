<template>
  <Modal v-if="visible" @close="$emit('close')">
    <template #body>
      <div
        class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
      >
        <button
          @click="$emit('close')"
          class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
        >
          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z" fill="" />
          </svg>
        </button>
        <div class="px-2 pr-14">
          <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ getFullName(user) || user.email }}
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Редактирование данных пользователя
          </p>
        </div>
        <form @submit.prevent="save" class="flex flex-col">
          <div v-if="error" class="mb-4 mx-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {{ error }}
          </div>
          <div class="custom-scrollbar max-h-[458px] overflow-y-auto p-2">
            <div class="mt-7">
              <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Персональные данные
              </h5>
              <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Имя</label>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="Введите имя"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Фамилия</label>
                  <input
                    v-model="formData.last_name"
                    type="text"
                    placeholder="Введите фамилию"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Отчество</label>
                  <input
                    v-model="formData.middle_name"
                    type="text"
                    placeholder="Введите отчество"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="Введите email"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Телефон</label>
                  <input
                    v-model="formData.personal_phone"
                    type="tel"
                    placeholder="+7 (000) 000-00-00"
                    @input="handlePhoneInput"
                    maxlength="18"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">О себе</label>
                  <input
                    v-model="formData.position"
                    type="text"
                    placeholder="Введите описание"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 flex items-center gap-3">
                  <input
                    v-model="formData.available_in_chat"
                    type="checkbox"
                    id="admin-available-in-chat"
                    class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <label for="admin-available-in-chat" class="text-sm font-medium text-gray-700 dark:text-gray-400">
                    Доступен в чате — отображается в списке пользователей для начала диалога
                  </label>
                </div>
              </div>
            </div>
            <div class="mt-7">
              <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Место работы
              </h5>
              <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Компания</label>
                  <input
                    v-model="formData.company_name"
                    type="text"
                    placeholder="Название компании"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Должность</label>
                  <input
                    v-model="formData.work_position"
                    type="text"
                    placeholder="Должность"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Рабочая почта</label>
                  <input
                    v-model="formData.work_email"
                    type="email"
                    placeholder="work@example.com"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Рабочий телефон</label>
                  <input
                    v-model="formData.work_phone"
                    type="tel"
                    placeholder="+7 (000) 000-00-00"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="col-span-2">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Сайт компании</label>
                  <input
                    v-model="formData.work_website"
                    type="url"
                    placeholder="https://..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
            <div class="mt-7">
              <h5 class="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Мессенджеры
              </h5>
              <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">WhatsApp</label>
                  <input
                    v-model="formData.messengers.whatsapp"
                    type="url"
                    placeholder="https://wa.me/..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Telegram</label>
                  <input
                    v-model="formData.messengers.telegram"
                    type="url"
                    placeholder="https://t.me/..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Viber</label>
                  <input
                    v-model="formData.messengers.viber"
                    type="url"
                    placeholder="viber://chat?number=..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Instagram</label>
                  <input
                    v-model="formData.messengers.instagram"
                    type="url"
                    placeholder="https://instagram.com/..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Twitter</label>
                  <input
                    v-model="formData.messengers.twitter"
                    type="url"
                    placeholder="https://twitter.com/..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">X</label>
                  <input
                    v-model="formData.messengers.x"
                    type="url"
                    placeholder="https://x.com/..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <button
              type="button"
              @click="$emit('close')"
              class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Закрыть
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
            >
              {{ loading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/profile/Modal.vue'
import { api, ApiError } from '@/api/client'
import { usePhoneMask } from '@/composables/usePhoneMask'

const props = defineProps<{
  visible: boolean
  user: AdminUserFull
}>()

const emit = defineEmits<{
  close: []
  saved: [AdminUserFull]
}>()

interface AdminUserFull {
  id: string
  email: string
  name: string
  last_name: string | null
  middle_name: string | null
  user_img: string | null
  work_position: string | null
  personal_phone?: string | null
  position?: string | null
  company_name?: string | null
  work_email?: string | null
  work_phone?: string | null
  work_website?: string | null
  messengers?: Record<string, string> | null
  available_in_chat?: number | boolean | null
  created_at?: string | null
  last_login_at?: string | null
  is_active?: number
  presentations_count?: number
}

const { formatPhone } = usePhoneMask()
const loading = ref(false)
const error = ref('')

const formData = ref({
  name: '',
  last_name: '',
  middle_name: '',
  email: '',
  personal_phone: '',
  position: '',
  available_in_chat: false,
  company_name: '',
  work_position: '',
  work_email: '',
  work_phone: '',
  work_website: '',
  messengers: {
    whatsapp: '',
    telegram: '',
    viber: '',
    instagram: '',
    twitter: '',
    x: '',
  },
})

function getFullName(u: AdminUserFull) {
  const parts = [u.name, u.last_name, u.middle_name].filter(Boolean)
  return parts.join(' ').trim()
}

watch(
  () => [props.visible, props.user],
  () => {
    if (props.visible && props.user) {
      const u = props.user
      const phone = u.personal_phone || ''
      const avail = u.available_in_chat
      formData.value = {
        name: u.name || '',
        last_name: u.last_name || '',
        middle_name: u.middle_name || '',
        email: u.email || '',
        personal_phone: phone ? formatPhone(phone) : '',
        position: u.position || '',
        available_in_chat: !!avail || (typeof avail === 'number' && avail !== 0),
        company_name: u.company_name || '',
        work_position: u.work_position || '',
        work_email: u.work_email || '',
        work_phone: u.work_phone || '',
        work_website: u.work_website || '',
        messengers: {
          whatsapp: u.messengers?.whatsapp || '',
          telegram: u.messengers?.telegram || '',
          viber: u.messengers?.viber || '',
          instagram: u.messengers?.instagram || '',
          twitter: u.messengers?.twitter || '',
          x: u.messengers?.x || '',
        },
      }
      error.value = ''
    }
  },
  { immediate: true }
)

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const formatted = formatPhone(input.value)
  formData.value.personal_phone = formatted
  input.value = formatted
}

const save = async () => {
  error.value = ''
  loading.value = true
  try {
    const messengers: Record<string, string> = {}
    Object.entries(formData.value.messengers).forEach(([k, v]) => {
      if (v?.trim()) messengers[k] = v.trim()
    })
    const updated = await api.put(`/api/admin/users/${props.user.id}`, {
      name: formData.value.name.trim() || undefined,
      last_name: formData.value.last_name.trim() || undefined,
      middle_name: formData.value.middle_name.trim() || undefined,
      email: formData.value.email.trim() || undefined,
      personal_phone: formData.value.personal_phone.replace(/\D/g, '') || undefined,
      position: formData.value.position.trim() || undefined,
      available_in_chat: formData.value.available_in_chat,
      company_name: formData.value.company_name.trim() || undefined,
      work_position: formData.value.work_position.trim() || undefined,
      work_email: formData.value.work_email.trim() || undefined,
      work_phone: formData.value.work_phone.trim() || undefined,
      work_website: formData.value.work_website.trim() || undefined,
      messengers: Object.keys(messengers).length ? messengers : undefined,
    }) as AdminUserFull
    emit('saved', updated)
    emit('close')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}
</script>
