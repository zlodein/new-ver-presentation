<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Тарифы пользователей">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div v-if="loading" class="p-8 text-center text-gray-500 dark:text-gray-400">
            Загрузка...
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">
            {{ error }}
          </div>
          <div v-else>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Пользователь</p>
                    </th>
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Email</p>
                    </th>
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Дата приобретения тарифа</p>
                    </th>
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Приобретено презентаций</p>
                    </th>
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Статус</p>
                    </th>
                    <th class="px-5 py-3 text-left sm:px-6">
                      <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Действия</p>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="user in users"
                    :key="user.id"
                    class="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td class="px-5 py-3 sm:px-6">
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ getFullName(user) || '—' }}
                      </p>
                    </td>
                    <td class="px-5 py-3 sm:px-6">
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ user.email || '—' }}</p>
                    </td>
                    <td class="px-5 py-3 sm:px-6">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatTariffDate(user.tariff_updated_at) }}
                      </p>
                    </td>
                    <td class="px-5 py-3 sm:px-6">
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ user.expert_plan_quantity != null ? user.expert_plan_quantity : '—' }}
                      </p>
                    </td>
                    <td class="px-5 py-3 sm:px-6">
                      <span class="text-sm">{{ tariffStatusLabel(user) }}</span>
                    </td>
                    <td class="px-5 py-3 sm:px-6">
                      <button
                        v-if="canAddPresentations(user)"
                        type="button"
                        class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        @click="openAddModal(user)"
                      >
                        Добавить презентации
                      </button>
                      <span v-else class="text-sm text-gray-400">—</span>
                    </td>
                  </tr>
                  <tr v-if="users.length === 0">
                    <td colspan="6" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Нет данных
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>

    <!-- Модальное окно: добавить презентации -->
    <Teleport to="body">
      <div
        v-if="addModalUser"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        @click.self="addModalUser = null"
      >
        <div
          class="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="dialog"
          aria-labelledby="add-modal-title"
        >
          <h3 id="add-modal-title" class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">
            Добавить презентации
          </h3>
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Пользователь: {{ addModalUser ? getFullName(addModalUser) : '' }} ({{ addModalUser?.email }}).
            Сейчас лимит: {{ addModalUser?.expert_plan_quantity ?? 0 }}.
          </p>
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Количество добавить
            </label>
            <input
              v-model.number="addModalQuantity"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90"
              @keydown.enter="submitAddPresentations"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="addModalUser = null"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
              :disabled="addModalSaving || !addModalQuantity || addModalQuantity < 1"
              @click="submitAddPresentations"
            >
              {{ addModalSaving ? 'Сохранение...' : 'Добавить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { api } from '@/api/client'

interface TariffUser {
  id: string
  email?: string | null
  name?: string | null
  last_name?: string | null
  middle_name?: string | null
  role_id?: number
  tariff?: string | null
  expert_plan_quantity?: number | null
  expert_presentations_used?: number | null
  tariff_updated_at?: string | null
}

const currentPageTitle = ref('Тарифы')
const users = ref<TariffUser[]>([])
const loading = ref(true)
const error = ref('')
const addModalUser = ref<TariffUser | null>(null)
const addModalQuantity = ref<number>(1)
const addModalSaving = ref(false)

function getFullName(u: TariffUser) {
  const parts = [u.name, u.last_name, u.middle_name].filter(Boolean)
  return parts.join(' ').trim() || ''
}

function formatTariffDate(v: string | null | undefined) {
  if (!v) return '—'
  const s = String(v).trim()
  if (!s) return '—'
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return s
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return s
  }
}

function tariffStatusLabel(u: TariffUser) {
  if (u.role_id === 2) return 'Админ'
  const t = u.tariff
  if (t === 'expert') return 'Эксперт'
  if (t === 'test_drive') return 'Тест драйв'
  return '—'
}

function canAddPresentations(u: TariffUser) {
  return u.role_id !== 2 && u.tariff === 'expert'
}

function openAddModal(user: TariffUser) {
  addModalUser.value = user
  addModalQuantity.value = 1
}

async function submitAddPresentations() {
  const user = addModalUser.value
  if (!user || addModalSaving.value) return
  const qty = Math.min(100, Math.max(1, Number(addModalQuantity.value) || 0))
  if (qty < 1) return
  addModalSaving.value = true
  try {
    const res = await api.patch<{ success: boolean; expert_plan_quantity: number }>(
      `/api/admin/users/${user.id}/tariff`,
      { addPresentations: qty }
    )
    if (res?.expert_plan_quantity != null) {
      user.expert_plan_quantity = res.expert_plan_quantity
    }
    addModalUser.value = null
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка добавления презентаций'
    error.value = msg
    setTimeout(() => { error.value = '' }, 5000)
  } finally {
    addModalSaving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const data = (await api.get('/api/admin/users')) as TariffUser[]
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки списка'
    users.value = []
  } finally {
    loading.value = false
  }
})
</script>
