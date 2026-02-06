<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <router-link
              to="/"
              class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg
                class="stroke-current"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                  stroke=""
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              На главную
            </router-link>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  Вход
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Введите email и пароль для входа
                </p>
              </div>
              <div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                  <a
                    :href="oauthUrl('yandex')"
                    class="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                  >
                    <!-- Иконка Яндекса (официальные цвета) -->
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D"/>
                      <path d="M12 6.36v4.32l3.24-4.32H12zM6.36 12v5.64h2.28V12H6.36zm5.64 0v5.64h5.64v-2.28h-3.36V12H12z" fill="#fff"/>
                    </svg>
                    Войти через Яндекс
                  </a>
                  <a
                    :href="oauthUrl('vk')"
                    class="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                  >
                    <!-- Иконка ВКонтакте (логотип VK, синий #07F) -->
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.8 15.2h1.2s.36-.04.54-.28c.18-.24.18-.54.18-.54s-.02-1.35.64-1.54c.66-.2 1.5 1.26 2.35 1.8.66.46 1.14.36 1.14.36l2.2-.03s1.12-.07.58-.94c-.28-.44-1.32-1.94-1.32-1.94s-.76-1.1.42-2.92c.9-1.38 1.26-2.16 1.15-2.5-.12-.34-.82-.25-.82-.25l-2.4.02s-.18-.02-.3.08c-.12.1-.18.22-.18.22s-.32.96-.74 2.1c-.9 2.4-1.26 2.52-1.42 2.4-.34-.26-.25-1.03-.25-1.58 0-1.65.25-2.33-.49-2.51-.24-.06-.42-.1-1.03-.12-.9-.01-1.62.003-2.04.19-.28.14-.48.42-.35.44.16.02.52.1.72.35.26.33.24 1.04.24 1.04s.14 1.95-.3 2.19c-.3.16-.72-.18-1.6-1.75-.46-.82-.8-1.72-.8-1.72s-.06-.16-.15-.25c-.12-.1-.34-.14-.34-.14l-2.28.01s-.34 0-.46.15c-.12.15-.01.4-.01.4s.78 3.6 1.68 4.9c.9 1.28 1.58 1.9 2.76 1.9h.66s.28-.02.38-.1c.1-.08.1-.2.1-.2s-.02-1.1.48-1.58c.5-.48 1.34-.48 1.34-.48h1.14s.28 0 .38.1c.1.1.1.28 0 .38l-.48.76s-.28.48-.28.66c0 .18.1.36.28.46.2.2.48.28.76.46.48.22.96.46 1.34.76.48.38.76.76.96.88.2.18.38.18.38.18h2.4s.48 0 .58-.18c.1-.18.1-.38 0-.48-.18-.28-.66-.76-1.14-1.24-.3-.28-.48-.46-.48-.46s0-.1.1-.18c.1-.08.2-.1.2-.1h1.72s.48 0 .58-.1c.1-.1.2-.18.2-.18V12s-2.1-2.88-2.88-3.84c-.76-.96-1.62-1.34-1.62-1.34s-.1 0-.18.08c-.08.08 0 .18 0 .28.1.46.36 1.32.36 1.32s.1.18 0 .28c-.1.1-.18.18-.18.18l-.28.1s-1.44.86-2.02 1.24c-.28.2-.48.28-.48.28s-.1.08 0 .18c.1.1.28.18.48.28.36.18.86.36 1.14.46.1.08.28.08.28.08h.46z" fill="#07F"/>
                    </svg>
                    Войти через ВКонтакте
                  </a>
                </div>
                <div class="relative py-3 sm:py-5">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2"
                      >Или</span
                    >
                  </div>
                </div>
                <form @submit.prevent="handleSubmit">
                  <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {{ error }}
                  </div>
                  <div class="space-y-5">
                    <!-- Email -->
                    <div>
                      <label
                        for="email"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Email<span class="text-error-500">*</span>
                      </label>
                      <input
                        v-model="email"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="info@gmail.com"
                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      />
                    </div>
                    <!-- Password -->
                    <div>
                      <label
                        for="password"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Пароль<span class="text-error-500">*</span>
                      </label>
                      <div class="relative">
                        <input
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          id="password"
                          placeholder="Введите пароль"
                          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                        <span
                          @click="togglePasswordVisibility"
                          class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400"
                        >
                          <svg
                            v-if="!showPassword"
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                              fill="#98A2B3"
                            />
                          </svg>
                          <svg
                            v-else
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                              fill="#98A2B3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <!-- Checkbox -->
                    <div class="flex items-center justify-between">
                      <div>
                        <label
                          for="keepLoggedIn"
                          class="flex items-center text-sm font-normal text-gray-700 cursor-pointer select-none dark:text-gray-400"
                        >
                          <div class="relative">
                            <input
                              v-model="keepLoggedIn"
                              type="checkbox"
                              id="keepLoggedIn"
                              class="sr-only"
                            />
                            <div
                              :class="
                                keepLoggedIn
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              "
                              class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]"
                            >
                              <span :class="keepLoggedIn ? '' : 'opacity-0'">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                    stroke="white"
                                    stroke-width="1.94437"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          Запомнить меня
                        </label>
                      </div>
                      <router-link
                        to="/reset-password"
                        class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >Забыли пароль?</router-link
                      >
                    </div>
                    <!-- Button -->
                    <div>
                      <button
                        type="submit"
                        :disabled="loading"
                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
                      >
                        {{ loading ? 'Вход...' : 'Войти' }}
                      </button>
                    </div>
                  </div>
                </form>
                <div class="mt-5">
                  <p
                    class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start"
                  >
                    Нет аккаунта?
                    <router-link
                      to="/signup"
                      class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >Регистрация</router-link
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid"
        >
          <div class="flex items-center justify-center z-1">
            <common-grid-shape />
            <div class="flex flex-col items-center max-w-xs">
              <router-link to="/" class="block mb-4">
                <img width="{231}" height="{48}" src="/images/logo/auth-logo.svg" alt="Logo" />
              </router-link>
              <p class="text-center text-gray-400 dark:text-white/60">
                Бесплатный шаблон админ-панели на Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { ApiError, getApiBase, setToken } from '@/api/client'

const router = useRouter()
const route = useRoute()
const { login, hasApi, fetchUser } = useAuth()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const keepLoggedIn = ref(false)
const error = ref('')
const loading = ref(false)

/** URL для редиректа на OAuth провайдера (Яндекс или VK). */
function oauthUrl(provider: 'yandex' | 'vk'): string {
  const base = getApiBase()
  const path = `/api/auth/oauth/${provider}`
  return base ? `${base.replace(/\/$/, '')}${path}` : path
}

const oauthErrorMessages: Record<string, string> = {
  oauth_cancelled: 'Вход через соцсеть отменён.',
  oauth_not_configured: 'OAuth не настроен на сервере.',
  unknown_provider: 'Неизвестный провайдер входа.',
  missing_code: 'Ошибка авторизации: отсутствует код.',
  token_exchange_failed: 'Не удалось получить токен. Попробуйте снова.',
  no_access_token: 'Не получен токен доступа.',
  user_info_failed: 'Не удалось загрузить данные профиля.',
  email_required: 'Предоставьте доступ к email в настройках аккаунта.',
  oauth_failed: 'Ошибка входа через соцсеть. Попробуйте снова.',
  create_user_failed: 'Ошибка создания учётной записи.',
  no_database: 'Сервер не настроен для входа.',
}

onMounted(async () => {
  const errorFromQuery = route.query.error as string | undefined
  if (errorFromQuery) {
    error.value = oauthErrorMessages[errorFromQuery] || 'Ошибка входа. Попробуйте снова.'
  }
  const tokenFromQuery = route.query.token as string | undefined
  if (tokenFromQuery) {
    setToken(tokenFromQuery)
    try {
      await fetchUser()
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.replace(redirect)
    } catch {
      error.value = 'Не удалось войти по ссылке. Попробуйте снова.'
    }
  }
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  error.value = ''
  if (!email.value?.trim() || !password.value) {
    error.value = 'Введите email и пароль'
    return
  }
  if (!hasApi()) {
    error.value = 'API не настроен. Укажите VITE_API_URL в .env'
    return
  }
  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    await fetchUser()
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message || 'Ошибка входа'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}
</script>
