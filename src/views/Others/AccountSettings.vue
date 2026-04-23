<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Настройки аккаунта</h3>
      <PresentationDisplayPreferencesCard />
      <div class="mt-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Пуш-уведомления</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ pushStatusText }}
            </p>
            <p v-if="pushError" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ pushError }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex min-w-[180px] items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
            :class="pushEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'"
            :disabled="!canManagePush || pushLoading"
            @click="togglePush"
          >
            {{ pushLoading ? 'Сохранение...' : (pushEnabled ? 'Выключить пуши' : 'Включить пуши') }}
          </button>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import PresentationDisplayPreferencesCard from '@/components/profile/PresentationDisplayPreferencesCard.vue'
import { computed, onMounted, ref } from 'vue'
import { getPushEnabledState, getPushPermissionState, isOneSignalConfigured, setPushEnabled } from '@/services/onesignal'

const currentPageTitle = ref('Настройки аккаунта')
const pushLoading = ref(false)
const pushEnabled = ref(false)
const pushPermission = ref<NotificationPermission | 'unsupported'>('default')
const pushError = ref('')

const canManagePush = computed(() => isOneSignalConfigured() && pushPermission.value !== 'unsupported')

const pushStatusText = computed(() => {
  if (!isOneSignalConfigured()) return 'OneSignal не настроен в приложении.'
  if (pushPermission.value === 'unsupported') return 'Браузер не поддерживает push-уведомления.'
  if (pushPermission.value === 'denied') return 'В браузере запрещены уведомления. Разрешите их в настройках сайта.'
  return pushEnabled.value ? 'Пуш-уведомления включены.' : 'Пуш-уведомления выключены.'
})

async function refreshPushState() {
  pushPermission.value = await getPushPermissionState()
  pushEnabled.value = (await getPushEnabledState()) === true
}

async function togglePush() {
  if (!canManagePush.value) return
  pushError.value = ''
  pushLoading.value = true
  try {
    const next = !pushEnabled.value
    await setPushEnabled(next)
    await refreshPushState()
    if (next && pushPermission.value === 'denied') {
      pushError.value = 'Браузер заблокировал уведомления. Включите разрешение для сайта вручную.'
    }
  } catch {
    pushError.value = 'Не удалось изменить настройку пуш-уведомлений.'
  } finally {
    pushLoading.value = false
  }
}

onMounted(async () => {
  await refreshPushState()
})
</script>
