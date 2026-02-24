<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Пользователи">
        <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]">
          <div v-if="loading" class="p-8 text-center text-gray-500">
            Загрузка...
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">
            {{ error }}
          </div>
          <div v-else>
            <!-- Toolbar: Show / Search / Скачать -->
            <div
              class="flex flex-col gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="text-gray-500 dark:text-gray-400">Показать</span>
                <div class="relative z-20 bg-transparent">
                  <select
                    v-model.number="perPage"
                    class="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option :value="10" class="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
                    <option :value="25" class="text-gray-500 dark:bg-gray-900 dark:text-gray-400">25</option>
                    <option :value="50" class="text-gray-500 dark:bg-gray-900 dark:text-gray-400">50</option>
                    <option :value="100" class="text-gray-500 dark:bg-gray-900 dark:text-gray-400">100</option>
                  </select>
                  <span
                    class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-2 top-1/2 dark:text-gray-400"
                  >
                    <svg
                      class="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                        stroke=""
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <span class="text-gray-500 dark:text-gray-400">записей</span>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="relative">
                  <span
                    class="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400 pointer-events-none"
                  >
                    <svg
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
                        d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                        fill=""
                      />
                    </svg>
                  </span>
                  <input
                    v-model="search"
                    type="text"
                    placeholder="Поиск..."
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                  />
                </div>

                <button
                  type="button"
                  :disabled="mailTestLoading"
                  @click="testMail"
                  class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-[11px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                  title="Отправить тестовое письмо на info@e-presentation.ru"
                >
                  {{ mailTestLoading ? 'Отправка...' : 'Тест почты' }}
                </button>
                <button
                  type="button"
                  :disabled="downloadLoading || (selectedUsers.length === 0 && filteredUsers.length === 0)"
                  @click="downloadExcel"
                  class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-[11px] text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  {{ downloadLoading ? 'Скачивание...' : 'Скачать' }}
                  <svg
                    v-if="!downloadLoading"
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
                      d="M10.0018 14.083C9.7866 14.083 9.59255 13.9924 9.45578 13.8472L5.61586 10.0097C5.32288 9.71688 5.32272 9.242 5.61552 8.94902C5.90832 8.65603 6.3832 8.65588 6.67618 8.94868L9.25182 11.5227L9.25182 3.33301C9.25182 2.91879 9.5876 2.58301 10.0018 2.58301C10.416 2.58301 10.7518 2.91879 10.7518 3.33301L10.7518 11.5193L13.3242 8.94866C13.6172 8.65587 14.0921 8.65604 14.3849 8.94903C14.6777 9.24203 14.6775 9.7169 14.3845 10.0097L10.5761 13.8154C10.4385 13.979 10.2323 14.083 10.0018 14.083ZM4.0835 13.333C4.0835 12.9188 3.74771 12.583 3.3335 12.583C2.91928 12.583 2.5835 12.9188 2.5835 13.333V15.1663C2.5835 16.409 3.59086 17.4163 4.8335 17.4163H15.1676C16.4102 17.4163 17.4176 16.409 17.4176 15.1663V13.333C17.4176 12.9188 17.0818 12.583 16.6676 12.583C16.2533 12.583 15.9176 12.9188 15.9176 13.333V15.1663C15.9176 15.5806 15.5818 15.9163 15.1676 15.9163H4.8335C4.41928 15.9163 4.0835 15.5806 4.0835 15.1663V13.333Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="w-full min-w-full">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <div class="flex items-center gap-3">
                        <label
                          class="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-400"
                        >
                          <span class="relative">
                            <input
                              type="checkbox"
                              class="sr-only"
                              :checked="selectAll"
                              @change="toggleSelectAll"
                            />
                            <span
                              :class="
                                selectAll
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              "
                              class="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px]"
                            >
                              <span :class="selectAll ? '' : 'opacity-0'">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M10 3L4.5 8.5L2 6"
                                    stroke="white"
                                    stroke-width="1.6666"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </span>
                          </span>
                        </label>
                        <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Пользователь</p>
                      </div>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Email</p>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Дата регистрации</p>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Последняя авторизация</p>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Статус</p>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Презентаций</p>
                    </th>
                    <th class="px-4 py-3 text-left border border-gray-100 dark:border-gray-800">
                      <p class="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Действия</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in paginatedUsers"
                    :key="user.id"
                    :class="{ 'bg-gray-50 dark:bg-gray-900': (user as AdminUserWithSelect).selected }"
                    class="border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    @click="openUserModal(user)"
                  >
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <div class="flex gap-3">
                        <div class="mt-1" @click.stop>
                          <label
                            class="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-400"
                          >
                            <span class="relative">
                              <input
                                type="checkbox"
                                class="sr-only"
                                :checked="(user as AdminUserWithSelect).selected"
                                @change="toggleUserSelect(user)"
                              />
                              <span
                                :class="
                                  (user as AdminUserWithSelect).selected
                                    ? 'border-brand-500 bg-brand-500'
                                    : 'bg-transparent border-gray-300 dark:border-gray-700'
                                "
                                class="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px]"
                              >
                                <span :class="(user as AdminUserWithSelect).selected ? '' : 'opacity-0'">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M10 3L4.5 8.5L2 6"
                                      stroke="white"
                                      stroke-width="1.6666"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg>
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            <img
                              :src="getAvatarUrl(user.user_img)"
                              :alt="getFullName(user)"
                              class="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {{ getFullName(user) || '—' }}
                            </p>
                            <span v-if="user.company_name" class="text-sm text-gray-500 dark:text-gray-400">
                              {{ user.company_name }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <p class="text-gray-700 text-theme-sm dark:text-gray-400">{{ user.email }}</p>
                    </td>
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <p class="text-gray-700 text-theme-sm dark:text-gray-400">{{ formatApiDate(user.created_at) }}</p>
                    </td>
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <p class="text-gray-700 text-theme-sm dark:text-gray-400">{{ formatApiDateTime(user.last_login_at) }}</p>
                    </td>
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
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
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <p class="text-gray-700 text-theme-sm dark:text-gray-400">{{ user.presentations_count ?? 0 }}</p>
                    </td>
                    <td class="px-4 py-3 border border-gray-100 dark:border-gray-800" @click.stop>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          @click="confirmDeleteUser(user)"
                          :disabled="deletingId === user.id || user.role_id === 2 || user.id === currentUserId"
                          class="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-error-50 hover:border-error-300 hover:text-error-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-error-500/15 dark:hover:border-error-800 dark:hover:text-error-400 transition-colors"
                          :title="user.id === currentUserId ? 'Нельзя удалить себя' : 'Удалить пользователя безвозвратно'"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          @click="toggleActive(user)"
                          :disabled="deactivatingId === user.id || user.role_id === 2"
                          class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          :class="
                            user.is_active
                              ? 'border-error-300 bg-white text-error-600 hover:bg-error-50 dark:border-error-800 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-500/15'
                              : 'border-success-300 bg-white text-success-600 hover:bg-success-50 dark:border-success-800 dark:bg-gray-800 dark:text-success-400 dark:hover:bg-success-500/15'
                          "
                          :title="user.is_active ? 'Деактивировать (временно заморозить)' : 'Активировать'"
                        >
                          {{ user.is_active ? 'Деактивировать' : 'Активировать' }}
                        </button>
                        <button
                          type="button"
                          @click="impersonate(user)"
                          :disabled="impersonatingId === user.id || !user.is_active || user.role_id === 2"
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

            <!-- Pagination -->
            <div
              class="border-t border-gray-100 py-4 pl-[18px] pr-4 dark:border-gray-800"
            >
              <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                <p
                  class="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left"
                >
                  Показано {{ startEntry }} — {{ endEntry }} из {{ totalEntries }} записей
                </p>
                <div class="flex items-center justify-center gap-0.5 pt-3 xl:justify-end xl:pt-0">
                  <button
                    type="button"
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    Назад
                  </button>
                  <button
                    v-if="totalPages > 1"
                    type="button"
                    @click="goToPage(1)"
                    :class="currentPage === 1 ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-700 dark:text-gray-400'"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500"
                  >
                    1
                  </button>
                  <span
                    v-if="currentPage > 3"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400"
                  >...</span>
                  <button
                    v-for="page in pagesAroundCurrent"
                    :key="page"
                    type="button"
                    @click="goToPage(page)"
                    :class="
                      currentPage === page
                        ? 'bg-blue-500/[0.08] text-brand-500'
                        : 'text-gray-700 dark:text-gray-400'
                    "
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500"
                  >
                    {{ page }}
                  </button>
                  <span
                    v-if="currentPage < totalPages - 2"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400"
                  >...</span>
                  <button
                    v-if="totalPages > 1"
                    type="button"
                    @click="goToPage(totalPages)"
                    :class="currentPage === totalPages ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-700 dark:text-gray-400'"
                    class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500"
                  >
                    {{ totalPages }}
                  </button>
                  <button
                    type="button"
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="ml-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import AdminUserDetailModal from './AdminUserDetailModal.vue'
import { api, getApiBase, setToken, ApiError } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { formatApiDate, formatApiDateTime } from '@/composables/useApiDate'

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
  company_logo?: string | null
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

interface AdminUserWithSelect extends AdminUser {
  selected?: boolean
}

const router = useRouter()
const { fetchUser, currentUser } = useAuth()
const currentUserId = computed(() => currentUser.value?.id ?? null)
const currentPageTitle = ref('Пользователи')
const users = ref<AdminUserWithSelect[]>([])
const loading = ref(true)
const error = ref('')
const selectedUser = ref<AdminUser | null>(null)
const deactivatingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const impersonatingId = ref<string | null>(null)
const downloadLoading = ref(false)
const mailTestLoading = ref(false)

const search = ref('')
const perPage = ref(10)
const currentPage = ref(1)

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

function userToExcelRow(u: AdminUser): Record<string, string> {
  const messengers = u.messengers ? (typeof u.messengers === 'object' ? u.messengers : {}) : {}
  const messengersStr = Object.entries(messengers)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
  return {
    ID: u.id,
    'ФИО': getFullName(u),
    Email: u.email || '',
    'Личный телефон': u.personal_phone || '',
    'О себе': u.position || '',
    'Компания': u.company_name || '',
    'Должность': u.work_position || '',
    'Рабочая почта': u.work_email || '',
    'Рабочий телефон': u.work_phone || '',
    'Сайт компании': u.work_website || '',
    'Мессенджеры': messengersStr,
    'Дата регистрации': formatApiDate(u.created_at),
    'Последняя авторизация': formatApiDateTime(u.last_login_at),
    'Статус': u.is_active ? 'Активен' : 'Не активен',
    'Презентаций': String(u.presentations_count ?? 0),
  }
}

const filteredUsers = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return users.value
  return users.value.filter(
    (u) =>
      getFullName(u).toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s) ||
      (u.company_name || '').toLowerCase().includes(s)
  )
})

const totalEntries = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalEntries.value / perPage.value)))
const startEntry = computed(() => (currentPage.value - 1) * perPage.value + 1)
const endEntry = computed(() => Math.min(currentPage.value * perPage.value, totalEntries.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredUsers.value.slice(start, start + perPage.value)
})

const pagesAroundCurrent = computed(() => {
  const pages: number[] = []
  const start = Math.max(2, currentPage.value - 2)
  const end = Math.min(totalPages.value - 1, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const selectAll = computed(() => {
  const list = filteredUsers.value
  return list.length > 0 && list.every((u) => u.selected)
})

const selectedUsers = computed(() => users.value.filter((u) => u.selected))

watch([search, perPage], () => {
  currentPage.value = 1
})

function toggleSelectAll() {
  const list = filteredUsers.value
  const next = !selectAll.value
  list.forEach((u) => (u.selected = next))
}

function toggleUserSelect(user: AdminUserWithSelect) {
  user.selected = !user.selected
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

async function testMail() {
  if (mailTestLoading.value) return
  mailTestLoading.value = true
  error.value = ''
  try {
    const res = await api.get<{ ok: boolean; message: string }>('/api/admin/mail-test')
    if (res.ok) {
      alert('Почта: ' + res.message + '\nПроверьте папку «Входящие» и «Спам» на info@e-presentation.ru')
    } else {
      alert('Ошибка: ' + res.message)
    }
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Ошибка запроса')
    alert('Ошибка: ' + msg)
  } finally {
    mailTestLoading.value = false
  }
}

async function downloadExcel() {
  downloadLoading.value = true
  try {
    const toExport = selectedUsers.value.length > 0 ? selectedUsers.value : filteredUsers.value
    if (toExport.length === 0) return
    const rows = toExport.map((u) => userToExcelRow(u))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Пользователи')
    const fileName = `users_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)
  } finally {
    downloadLoading.value = false
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

function confirmDeleteUser(user: AdminUser) {
  if (user.role_id === 2) {
    error.value = 'Нельзя удалить администратора'
    return
  }
  const fullName = getFullName(user) || user.email
  if (!window.confirm(`Удалить пользователя «${fullName}» (${user.email}) безвозвратно? Будут удалены все его презентации, оплаты, файлы и данные. Это действие нельзя отменить.`)) {
    return
  }
  deleteUser(user)
}

async function deleteUser(user: AdminUser) {
  if (deletingId.value) return
  deletingId.value = user.id
  error.value = ''
  try {
    await api.post('/api/admin/users/delete', { id: user.id })
    users.value = users.value.filter((u) => u.id !== user.id)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Ошибка удаления пользователя')
  } finally {
    deletingId.value = null
  }
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
    const data = (await api.get('/api/admin/users')) as AdminUser[]
    users.value = data.map((u) => ({ ...u, selected: false }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
  } finally {
    loading.value = false
  }
})
</script>
