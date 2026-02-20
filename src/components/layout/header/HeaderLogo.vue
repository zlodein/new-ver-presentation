<template>
  <router-link to="/dashboard" class="lg:hidden inline-block origin-left scale-50">
    <img class="dark:hidden block" :src="logoUrl('logo.svg')" alt="Logo" />
    <img class="hidden dark:block" :src="logoUrl('logo-dark.svg')" alt="Logo" />
  </router-link>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { logoUrl } from '@/config/logos'
</script>
