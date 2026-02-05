<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11">
        <img :src="userImage" alt="User" />
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ shortName || 'Пользователь' }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ displayName || 'Пользователь' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ currentUser?.email || '' }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <router-link
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <!-- SVG icon would go here -->
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>
      <router-link
        to="/signin"
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Выйти
      </router-link>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { UserCircleIcon, ChevronDownIcon, LogoutIcon, SettingsIcon, InfoCircleIcon } from '@/icons'
import { RouterLink, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { currentUser, fetchUser, logout } = useAuth()
const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const menuItems = [
  { href: '/dashboard/profile', icon: UserCircleIcon, text: 'Редактировать профиль' },
  { href: '/chat', icon: SettingsIcon, text: 'Настройки аккаунта' },
  { href: '/dashboard/profile', icon: InfoCircleIcon, text: 'Поддержка' },
]

const displayName = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.name || currentUser.value.firstName || ''
  const last_name = currentUser.value.last_name || currentUser.value.lastName || ''
  return `${name} ${last_name}`.trim() || currentUser.value.email
})

const shortName = computed(() => {
  if (!currentUser.value) return ''
  return currentUser.value.name || currentUser.value.firstName || currentUser.value.email.split('@')[0] || ''
})

const userImage = computed(() => {
  if (!currentUser.value) return '/images/user/owner.jpg'
  return currentUser.value.user_img || '/images/user/owner.jpg'
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = () => {
  logout()
  router.push('/signin')
  closeDropdown()
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchUser()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
