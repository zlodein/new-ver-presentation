<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import { useAuth } from './composables/useAuth'
import { ensurePushSubscription } from './services/push-subscription'

const { fetchUser } = useAuth()

onMounted(async () => {
  // Загрузить данные пользователя при старте приложения
  await fetchUser()
  await ensurePushSubscription()
})
</script>
