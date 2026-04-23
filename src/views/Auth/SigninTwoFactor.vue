<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="relative flex flex-col justify-center w-full min-h-screen dark:bg-gray-900">
        <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 pb-16">
          <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Подтверждение 2FA</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Введите 6-значный код из приложения-аутентификатора или резервный код.
          </p>
          <form @submit.prevent="verify" class="space-y-4">
            <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{{ error }}</div>
            <input v-model="code" type="text" inputmode="numeric" maxlength="6" placeholder="123456" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            <input v-model="backupCode" type="text" placeholder="Или backup code" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            <button type="submit" :disabled="loading" class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60">
              {{ loading ? 'Проверка...' : 'Подтвердить вход' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { api, ApiError, setToken } from '@/api/client'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { fetchUser } = useAuth()
const loading = ref(false)
const error = ref('')
const code = ref('')
const backupCode = ref('')

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
      code: code.value.trim(),
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
