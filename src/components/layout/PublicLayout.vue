<template>
  <div class="min-h-screen">
    <PublicSidebar
      :is-mobile-open="isMobileOpen"
      :is-expanded="isExpanded"
      :is-hovered="isHovered"
      @update:is-hovered="isHovered = $event"
    />
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-99998 bg-gray-900/50 lg:hidden"
      @click="isMobileOpen = false"
    />
    <div
      class="transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <PublicHeader
        :is-mobile-open="isMobileOpen"
        :is-expanded="isExpanded"
        @toggle-sidebar="handleToggle"
      />
      <main id="public-content" class="relative p-4 mx-auto max-w-(--breakpoint-2xl) text-left md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PublicSidebar from './PublicSidebar.vue'
import PublicHeader from './PublicHeader.vue'

const isMobileOpen = ref(false)
const isExpanded = ref(true)
const isHovered = ref(false)

function handleToggle() {
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    isExpanded.value = !isExpanded.value
  } else {
    isMobileOpen.value = !isMobileOpen.value
  }
}
</script>
