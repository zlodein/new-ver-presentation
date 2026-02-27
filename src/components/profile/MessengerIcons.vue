<template>
  <div class="flex items-center gap-2">
    <a
      v-for="item in messengerItems"
      :key="item.key"
      v-show="messengers?.[item.key]?.trim()"
      :href="(messengers && messengers[item.key]) || '#'"
      target="_blank"
      rel="noopener"
      class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-300"
      :title="item.title"
    >
      <img :src="item.icon" :alt="item.title" class="w-5 h-5 flex-shrink-0 object-contain" />
    </a>
  </div>
</template>

<script setup lang="ts">
const messengerItems = [
  { key: 'twitter', title: 'Twitter', icon: '/images/icons/twitter-color.svg' },
  { key: 'whatsapp', title: 'WhatsApp', icon: '/images/icons/whatsapp-color.svg' },
  { key: 'telegram', title: 'Telegram', icon: '/images/icons/telegram-color.svg' },
  { key: 'viber', title: 'Viber', icon: '/images/icons/viber-color.svg' },
  { key: 'instagram', title: 'Instagram', icon: '/images/icons/instagram-color.svg' },
  { key: 'vk', title: 'Vk', icon: '/images/icons/vk-color.svg' },
  { key: 'max', title: 'Max', icon: '/images/icons/max-color.svg' },
  { key: 'x', title: 'X', icon: '/images/icons/x-color.svg' },
]

defineProps<{
  messengers?: Record<string, string> | null
}>()
</script>
