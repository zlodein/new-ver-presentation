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
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
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

onMounted(async () => {
  await fetchUser()
  const u = currentUser.value
  const noTariff = u && (u.tariff == null || u.tariff === '')
  if (noTariff && route.path !== '/dashboard/tariffs') {
    router.replace('/dashboard/tariffs')
  }
})
</script>
