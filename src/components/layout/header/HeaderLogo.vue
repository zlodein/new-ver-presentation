<template>
  <router-link
    to="/dashboard"
    class="lg:hidden inline-flex items-center max-w-[min(140px,45vw)] min-w-0 shrink"
  >
    <img
      class="dark:hidden block max-h-10 w-auto max-w-full object-contain object-left"
      :src="logoUrl('logo.svg')"
      alt="Logo"
    />
    <img
      class="hidden dark:block max-h-10 w-auto max-w-full object-contain object-left"
      :src="logoUrl('logo-dark.svg')"
      alt="Logo"
    />
  </router-link>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { logoUrl } from '@/config/logos'
</script>
