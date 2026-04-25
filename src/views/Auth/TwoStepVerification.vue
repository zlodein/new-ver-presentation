<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <router-link
              to="/dashboard"
              class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg class="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Назад в панель
            </router-link>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div class="mb-5 sm:mb-8">
              <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                {{ type === 'password_reset' ? 'Подтверждение восстановления' : 'Two Step Verification' }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{
                  type === 'password_reset'
                    ? `Код отправлен на ${maskedEmail}. Введите его в поле ниже.`
                    : 'A verification code has been sent to your email. Please enter it in the field below.'
                }}
              </p>
            </div>

            <form @submit.prevent="handleVerify" class="space-y-5">
              <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {{ error }}
              </div>
              <div v-if="success" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                {{ success }}
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Type your 6 digits security code
                </label>
                <div class="grid grid-cols-6 gap-2 sm:gap-3">
                  <input
                    v-for="(_, i) in 6"
                    :key="i"
                    :ref="(el) => setInputRef(el, i)"
                    v-model="digits[i]"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="h-11 w-full rounded-lg border border-gray-300 bg-transparent text-center text-base font-semibold text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:h-12 sm:text-lg"
                    @input="onDigitInput($event, i)"
                    @keydown="onDigitKeydown($event, i)"
                    @paste="onPaste"
                  />
                </div>
              </div>

              <button
                type="submit"
                :disabled="loading || code.length !== 6"
                class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ loading ? 'Проверка...' : (type === 'password_reset' ? 'Подтвердить и сменить пароль' : 'Verify My Account') }}
              </button>

              <p class="text-sm text-center text-gray-500 dark:text-gray-400">
                Didn’t get the code?
                <button
                  type="button"
                  @click="resendCode"
                  :disabled="resendCooldown > 0 || resendLoading"
                  class="text-brand-500 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ resendCooldown > 0 ? `Resend (${resendCooldown}s)` : (resendLoading ? 'Sending...' : 'Resend') }}
                </button>
              </p>
            </form>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid"
        >
          <div class="flex items-center justify-center z-1">
            <common-grid-shape />
            <div class="flex flex-col items-center max-w-xs">
              <router-link to="/" class="block mb-4">
                <img width="{231}" height="{48}" :src="logoUrl('auth-logo.svg')" alt="Logo" />
              </router-link>
              <p class="text-center text-gray-400 dark:text-white/60">
                Free and Open-Source Tailwind CSS Admin Dashboard Template
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import { api, hasApi, ApiError, setToken } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { logoUrl } from '@/config/logos'

const route = useRoute()
const router = useRouter()
const { fetchUser } = useAuth()

const type = computed(() => (route.query.type as string) || 'email_verification')
const email = computed(() => (route.query.email as string) || '')
const maskedEmail = computed(() => {
  const e = email.value
  if (!e) return 'ваш email'
  const [local, domain] = e.split('@')
  if (!domain) return e
  const masked = local.length > 2 ? local.slice(0, 2) + '***' : '***'
  return `${masked}@${domain}`
})

const digits = ref<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<(HTMLInputElement | null)[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const resendLoading = ref(false)
const resendCooldown = ref(0)

const code = computed(() => digits.value.join(''))

function setInputRef(el: unknown, i: number) {
  if (el) (inputRefs.value[i] as HTMLInputElement) = el as HTMLInputElement
}

function onDigitInput(ev: Event, i: number) {
  const val = (ev.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1)
  digits.value[i] = val
  if (val && i < 5) {
    inputRefs.value[i + 1]?.focus()
  }
}

function onDigitKeydown(ev: KeyboardEvent, i: number) {
  if (ev.key === 'Backspace' && !digits.value[i] && i > 0) {
    inputRefs.value[i - 1]?.focus()
  }
}

function onPaste(ev: ClipboardEvent) {
  ev.preventDefault()
  const pasted = (ev.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    digits.value[i] = pasted[i] || ''
  }
  const next = Math.min(pasted.length, 5)
  inputRefs.value[next]?.focus()
}

async function handleVerify() {
  if (!email.value || code.value.length !== 6) return
  if (!hasApi()) {
    error.value = 'API не настроен'
    return
  }
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (type.value === 'password_reset') {
      const res = await api.post<{ token: string; resetLink: string }>('/api/auth/verify-reset-code', {
        email: email.value.trim(),
        code: code.value,
      })
      router.replace({ path: '/reset-password', query: { token: res.token } })
      return
    }
    const res = await api.post<{ user: unknown; token: string }>('/api/auth/verify-email', {
      email: email.value.trim(),
      code: code.value,
    })
    setToken(res.token)
    await fetchUser()
    router.replace('/dashboard')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка проверки кода'
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  if (!email.value || resendLoading.value || resendCooldown.value > 0) return
  if (!hasApi()) return
  error.value = ''
  resendLoading.value = true
  try {
    await api.post('/api/auth/resend-code', {
      email: email.value.trim(),
      type: type.value,
    })
    success.value = 'Код отправлен повторно'
    resendCooldown.value = 60
    const t = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(t)
    }, 1000)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка отправки'
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  if (!email.value) {
    router.replace(type.value === 'password_reset' ? '/reset-password' : '/signup')
    return
  }
  inputRefs.value[0]?.focus()
})
</script>
