<template>
  <aside
    :class="[
      'fixed left-0 top-0 z-99999 flex h-screen flex-col border-r border-gray-200 bg-white px-5 pt-20 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:pt-8',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && $emit('update:isHovered', true)"
    @mouseleave="$emit('update:isHovered', false)"
  >
    <div
      :class="[
        'py-8 flex',
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
      ]"
    >
      <router-link to="/">
        <img
          v-if="(isExpanded || isHovered) && !isMobileOpen"
          class="dark:hidden"
          :src="logoUrl('logo.svg')"
          alt="Logo"
          width="150"
          height="40"
        />
        <img
          v-if="(isExpanded || isHovered) && !isMobileOpen"
          class="hidden dark:block"
          :src="logoUrl('logo-dark.svg')"
          alt="Logo"
          width="150"
          height="40"
        />
        <img
          v-else-if="!isMobileOpen"
          :src="logoUrl('logo-icon.svg')"
          alt="Logo"
          width="32"
          height="32"
        />
      </router-link>
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 flex text-xs uppercase leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="item in menuGroup.items" :key="item.name">
                <router-link
                  v-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group w-full',
                    'menu-item-inactive',
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span class="menu-item-icon-inactive">
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                  >
                    {{ item.name }}
                  </span>
                </router-link>
                <span
                  v-else
                  :class="[
                    'menu-item group w-full',
                    'menu-item-inactive',
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span class="menu-item-icon-inactive">
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                  >
                    {{ item.name }}
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { logoUrl } from '@/config/logos'
import { InfoCircleIcon, PieChartIcon } from '@/icons'
import HorizontalDots from '@/icons/HorizontalDots.vue'

defineProps<{
  isMobileOpen: boolean
  isExpanded: boolean
  isHovered: boolean
}>()

defineEmits<{
  'update:isHovered': [value: boolean]
}>()

const menuGroups = computed(() => [
  {
    title: 'Меню',
    items: [
      { name: 'О нас', icon: InfoCircleIcon },
      { name: 'Тарифы', icon: PieChartIcon, path: '/tariffs' },
    ],
  },
])
</script>
