<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import { useAuth } from './composables/useAuth'
import { initOneSignal } from './services/onesignal'

const { fetchUser, currentUser } = useAuth()

onMounted(async () => {
  // Загрузить данные пользователя при старте приложения
  await fetchUser()
})

watch(
  () => currentUser.value?.id,
  (userId) => {
    initOneSignal(userId)
  },
  { immediate: true }
)
</script>
