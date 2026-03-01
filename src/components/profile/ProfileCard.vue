<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <AvatarUpload
            :initials="userInitials"
            :current-image="userImage"
            @uploaded="handleAvatarUploaded"
          />
          <div class="order-3 xl:order-2">
            <h4
              class="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left"
            >
              {{ fullName || 'Пользователь' }}
            </h4>
            <div
              class="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left"
            >
              <p v-if="currentUser?.position" class="text-sm text-gray-500 dark:text-gray-400">{{ currentUser.position }}</p>
            </div>
          </div>
          <div class="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
            <MessengerIcons :messengers="currentUser?.messengers" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import MessengerIcons from './MessengerIcons.vue'
import AvatarUpload from './AvatarUpload.vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser, fetchUser } = useAuth()

const handleAvatarUploaded = async () => {
  await fetchUser()
}

const fullName = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.name || ''
  const last_name = currentUser.value.last_name || ''
  const middle_name = currentUser.value.middle_name || ''
  const parts = [name, middle_name, last_name].filter(Boolean)
  return parts.join(' ') || currentUser.value.email
})

const userInitials = computed(() => {
  if (!currentUser.value) return 'П'
  const name = currentUser.value.name || ''
  const last_name = currentUser.value.last_name || ''
  let initials = ''
  if (name) initials += name.charAt(0).toUpperCase()
  if (last_name) initials += last_name.charAt(0).toUpperCase()
  if (!initials && currentUser.value.email) {
    initials = currentUser.value.email.charAt(0).toUpperCase()
  }
  return initials || 'П'
})

const userImage = computed(() => {
  if (!currentUser.value) return null
  const img = currentUser.value.user_img
  if (!img || !img.trim()) return null
  const s = img.trim()
  // Абсолютный URL (OAuth: Яндекс, VK) — используем как есть, без ведущего /
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('/uploads/') || s.startsWith('/')) return s
  return `/${s}`
})

onMounted(() => {
  fetchUser()
})
</script>
