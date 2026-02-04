<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="relative flex flex-col justify-center w-full min-h-screen dark:bg-gray-900">
        <div class="w-full max-w-md pt-10 mx-auto">
          <router-link
            to="/signin"
            class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg class="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Назад к входу
          </router-link>
        </div>
        <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 pb-16">
          <div class="mb-5 sm:mb-8">
            <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {{ hasToken ? 'Новый пароль' : 'Восстановление пароля' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ hasToken ? 'Введите новый пароль (не менее 6 символов)' : 'Введите email — мы отправим ссылку для сброса пароля (в режиме разработки ссылка появится на странице)' }}
            </p>
          </div>

          <!-- Запрос ссылки (нет токена) -->
          <form v-if="!hasToken" @submit.prevent="requestReset" class="space-y-5">
            <div v-if="requestError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {{ requestError }}
            </div>
            <div v-if="requestSuccess" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              {{ requestSuccess }}
              <a v-if="resetLink" :href="resetLink" class="mt-2 block break-all text-brand-500 hover:underline">{{ resetLink }}</a>
            </div>
            <div>
              <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email<span class="text-error-500">*</span></label>
              <input
                v-model="email"
                type="email"
                id="email"
                placeholder="ваш@email.com"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            >
              {{ loading ? 'Отправка...' : 'Отправить ссылку' }}
            </button>
          </form>

          <!-- Установка нового пароля (есть токен) -->
          <form v-else @submit.prevent="submitReset" class="space-y-5">
            <div v-if="resetError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {{ resetError }}
            </div>
            <div v-if="resetSuccess" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              {{ resetSuccess }}
              <router-link to="/signin" class="mt-2 inline-block text-brand-500 hover:underline">Войти</router-link>
            </div>
            <div>
              <label for="newPassword" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Новый пароль<span class="text-error-500">*</span></label>
              <input
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                id="newPassword"
                placeholder="Не менее 6 символов"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <button
              type="submit"
              :disabled="loading || newPassword.length < 6"
              class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            >
              {{ loading ? 'Сохранение...' : 'Сохранить пароль' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { api, hasApi, ApiError } from '@/api/client'

const route = useRoute()
const email = ref('')
const newPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const requestError = ref('')
const requestSuccess = ref('')
const resetLink = ref('')
const resetError = ref('')
const resetSuccess = ref('')

const tokenFromQuery = ref('')
const hasToken = computed(() => !!tokenFromQuery.value)

onMounted(() => {
  const t = route.query.token as string
  if (t) tokenFromQuery.value = t
})

async function requestReset() {
  requestError.value = ''
  requestSuccess.value = ''
  resetLink.value = ''
  if (!email.value?.trim()) {
    requestError.value = 'Введите email'
    return
  }
  if (!hasApi()) {
    requestError.value = 'API не настроен. Укажите VITE_API_URL в .env'
    return
  }
  loading.value = true
  try {
    const res = await api.post<{ message: string; resetLink?: string; token?: string }>('/api/auth/forgot-password', { email: email.value.trim() })
    requestSuccess.value = res.message || 'Готово. В режиме разработки ссылка ниже.'
    if (res.resetLink) resetLink.value = res.resetLink
  } catch (e) {
    requestError.value = e instanceof ApiError ? e.message : 'Ошибка запроса'
  } finally {
    loading.value = false
  }
}

async function submitReset() {
  resetError.value = ''
  resetSuccess.value = ''
  if (newPassword.value.length < 6) {
    resetError.value = 'Пароль не менее 6 символов'
    return
  }
  if (!hasApi()) {
    resetError.value = 'API не настроен'
    return
  }
  loading.value = true
  try {
    await api.post<{ message: string }>('/api/auth/reset-password', {
      token: tokenFromQuery.value,
      newPassword: newPassword.value,
    })
    resetSuccess.value = 'Пароль изменён. '
  } catch (e) {
    resetError.value = e instanceof ApiError ? e.message : 'Ошибка сброса пароля'
  } finally {
    loading.value = false
  }
}
</script>
