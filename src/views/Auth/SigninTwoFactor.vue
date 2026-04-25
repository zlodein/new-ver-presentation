<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <router-link
              to="/signin"
              class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg class="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Назад ко входу
            </router-link>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Двухфакторная авторизация</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Введите 6-значный код из приложения-аутентификатора.
            </p>
            <form @submit.prevent="verify" class="space-y-5">
              <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{{ error }}</div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Введите 6-значный код безопасности
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
              <input v-model="backupCode" type="text" placeholder="Или введите резервный код" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              <button type="submit" :disabled="loading" class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60">
                {{ loading ? 'Проверка...' : 'Подтвердить вход' }}
              </button>
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
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import { api, ApiError, setToken } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { logoUrl } from '@/config/logos'

const route = useRoute()
const router = useRouter()
const { fetchUser } = useAuth()
const loading = ref(false)
const error = ref('')
const digits = ref<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<(HTMLInputElement | null)[]>([])
const backupCode = ref('')

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

async function verify() {
  const pendingToken = String(route.query.pendingToken || '')
  if (!pendingToken) {
    error.value = 'Сессия подтверждения не найдена. Войдите снова.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await api.post<{ token: string }>('/api/auth/2fa/verify-login', {
      pendingToken,
      code: digits.value.join('').trim(),
      backupCode: backupCode.value.trim(),
    })
    setToken(res.token)
    await fetchUser()
    router.replace('/dashboard')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Ошибка подтверждения 2FA'
  } finally {
    loading.value = false
  }
}
</script>
