<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Пользователи">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div v-if="loading" class="p-8 text-center text-gray-500">
            Загрузка...
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">
            {{ error }}
          </div>
          <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Пользователь
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Email
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Дата регистрации
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Последняя авторизация
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Статус
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Презентаций
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Действия
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  @click="openUserModal(user)"
                >
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        <img
                          :src="getAvatarUrl(user.user_img)"
                          :alt="getFullName(user)"
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {{ getFullName(user) || '—' }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ user.email }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ formatDate(user.created_at) }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ formatDateTime(user.last_login_at) }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <span
                      :class="[
                        'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                        user.is_active
                          ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                          : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
                      ]"
                    >
                      {{ user.is_active ? 'Активен' : 'Не активен' }}
                    </span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ user.presentations_count ?? 0 }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6" @click.stop>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="toggleActive(user)"
                        :disabled="deactivatingId === user.id || (user.role_id === 2 && !!user.is_active)"
                        class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="user.is_active
                          ? 'border-error-300 bg-white text-error-600 hover:bg-error-50 dark:border-error-800 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-500/15'
                          : 'border-success-300 bg-white text-success-600 hover:bg-success-50 dark:border-success-800 dark:bg-gray-800 dark:text-success-400 dark:hover:bg-success-500/15'"
                        :title="user.is_active ? 'Деактивировать' : 'Активировать'"
                      >
                        {{ user.is_active ? 'Деактивировать' : 'Активировать' }}
                      </button>
                      <button
                        type="button"
                        @click="impersonate(user)"
                        :disabled="impersonatingId === user.id || !user.is_active"
                        class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Войти под учёткой"
                      >
                        {{ impersonatingId === user.id ? '...' : 'Войти' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </div>

    <AdminUserDetailModal
      v-if="selectedUser"
      :visible="true"
      :user="selectedUser"
      @close="selectedUser = null"
      @saved="onUserSaved"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import AdminUserDetailModal from './AdminUserDetailModal.vue'
import { api, getApiBase, setToken, ApiError } from '@/api/client'
import { useAuth } from '@/composables/useAuth'

interface AdminUser {
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
  created_at?: string | null
  last_login_at?: string | null
  is_active?: number
  role_id?: number
  presentations_count?: number
}

const router = useRouter()
const { fetchUser } = useAuth()
const currentPageTitle = ref('Пользователи')
const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')
const selectedUser = ref<AdminUser | null>(null)
const deactivatingId = ref<string | null>(null)
const impersonatingId = ref<string | null>(null)

function getFullName(u: AdminUser) {
  const parts = [u.name, u.last_name, u.middle_name].filter(Boolean)
  return parts.join(' ').trim()
}

function getAvatarUrl(userImg: string | null) {
  if (!userImg || !userImg.trim()) return '/images/user/user-17.jpg'
  if (userImg.startsWith('http')) return userImg
  const base = getApiBase()
  return base ? `${base.replace(/\/$/, '')}${userImg.startsWith('/') ? '' : '/'}${userImg}` : userImg
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    return `${day}.${month}.${year}`
  } catch {
    return '—'
  }
}

function formatDateTime(val: string | null | undefined): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} в ${h}:${m}`
  } catch {
    return '—'
  }
}

async function openUserModal(user: AdminUser) {
  try {
    const full = await api.get<AdminUser>(`/api/admin/users/${user.id}`)
    selectedUser.value = full
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователя'
  }
}

function onUserSaved(updated: AdminUser) {
  const idx = users.value.findIndex((u) => u.id === updated.id)
  if (idx >= 0) users.value[idx] = { ...users.value[idx], ...updated }
  selectedUser.value = null
}

async function toggleActive(user: AdminUser) {
  if (deactivatingId.value) return
  const isAdmin = user.role_id === 2
  if (isAdmin && user.is_active) {
    error.value = 'Нельзя деактивировать администратора'
    return
  }
  deactivatingId.value = user.id
  error.value = ''
  try {
    await api.patch(`/api/admin/users/${user.id}/active`, {
      is_active: user.is_active ? 0 : 1,
    })
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx >= 0) users.value[idx] = { ...users.value[idx], is_active: user.is_active ? 0 : 1 }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка обновления статуса'
  } finally {
    deactivatingId.value = null
  }
}

async function impersonate(user: AdminUser) {
  if (impersonatingId.value || !user.is_active) return
  impersonatingId.value = user.id
  error.value = ''
  try {
    const res = await api.post<{ token: string; user?: unknown }>(`/api/admin/users/${user.id}/impersonate`, {})
    setToken(res.token)
    await fetchUser()
    router.push('/dashboard')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Ошибка входа под пользователем')
  } finally {
    impersonatingId.value = null
  }
}

onMounted(async () => {
  try {
    const data = await api.get('/api/admin/users') as AdminUser[]
    users.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
  } finally {
    loading.value = false
  }
})
</script>
