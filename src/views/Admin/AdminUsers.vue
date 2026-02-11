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
                      Должность
                    </p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                      Email
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-t border-gray-100 dark:border-gray-800"
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
                      {{ user.work_position || '—' }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ user.email }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { api, getApiBase } from '@/api/client'

interface AdminUser {
  id: string
  email: string
  name: string
  last_name: string | null
  middle_name: string | null
  user_img: string | null
  work_position: string | null
  created_at?: string
}

const currentPageTitle = ref('Пользователи')
const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')

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

onMounted(async () => {
  try {
    users.value = await api.get('/api/admin/users') as AdminUser[]
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
  } finally {
    loading.value = false
  }
})
</script>
