<template>
  <div class="min-h-screen xl:flex">
    <app-sidebar />
    <Backdrop />
    <div
      class="flex-1 transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />
      <div id="dashboard-content" class="relative p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <div
          v-if="!isAdmin && currentUser?.tariff === 'test_drive'"
          class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
        >
          <p class="text-sm text-amber-800 dark:text-amber-200">
            Вы на тарифе «Тест драйв»: 1 презентация, до 4 слайдов, без публичной ссылки. Перейдите на тариф «Эксперт», чтобы снять ограничения.
          </p>
          <router-link
            to="/dashboard/tariffs"
            class="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Сменить тариф
          </router-link>
        </div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useSidebar } from '@/composables/useSidebar'
import { useAuth } from '@/composables/useAuth'
import Backdrop from './Backdrop.vue'

const { isExpanded, isHovered } = useSidebar()
const route = useRoute()
const router = useRouter()
const { currentUser, fetchUser } = useAuth()

const isAdmin = computed(() => (currentUser.value && (currentUser.value as { role_id?: number }).role_id === 2))

onMounted(async () => {
  await fetchUser()
  const u = currentUser.value
  if (isAdmin.value) return
  const noTariff = u && (u.tariff == null || u.tariff === '')
  if (noTariff && route.path !== '/dashboard/tariffs') {
    router.replace('/dashboard/tariffs')
  }
})
</script>
