<template>
  <article>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img v-if="avatar" :src="avatar" class="h-10 w-10 shrink-0 rounded-full object-cover" alt="" />
        <div
          v-else
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white"
        >
          {{ initials }}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ email }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ time }}</p>
    </div>
    <div class="pb-6 text-sm text-gray-500 dark:text-gray-400">
      <div class="message-content whitespace-pre-wrap" v-html="renderedContent" @click="onContentClick"></div>
    </div>
    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxSrc"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
        @click.self="lightboxSrc = null"
      >
        <img :src="lightboxSrc" alt="" class="max-h-[90vh] max-w-full rounded-lg object-contain" @click.stop />
      </div>
    </Teleport>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getApiBase } from '@/api/client'

const props = defineProps(['name', 'email', 'avatar', 'time', 'content'])
const lightboxSrc = ref(null)

const initials = computed(() => {
  const n = (props.name || '').trim()
  if (!n) return (props.email || '?').charAt(0).toUpperCase()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return n.charAt(0).toUpperCase()
})

function onContentClick(e) {
  if (e.target?.tagName === 'IMG' && e.target.src) {
    lightboxSrc.value = e.target.src
  }
}

function toFullUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (u.startsWith('http')) return u
  const base = getApiBase()
  return base ? `${base.replace(/\/$/, '')}${u.startsWith('/') ? '' : '/'}${u}` : u
}

const renderedContent = computed(() => {
  let text = props.content || ''
  if (typeof text !== 'string') text = String(text)
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const safeUrl = (u) => (/^\/uploads\//.test(u) || u.startsWith('http')) ? u : ''
  text = escape(text)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+|\/uploads\/[^)]+)\)/g, (_, alt, url) => {
      if (!safeUrl(url)) return `![${escape(alt)}](${escape(url)})`
      const fullUrl = toFullUrl(url)
      return `<img src="${escape(fullUrl)}" alt="${escape(alt)}" class="mt-2 max-h-48 cursor-pointer rounded-lg object-contain hover:opacity-90" loading="lazy" />`
    })
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/uploads\/[^)]+)\)/g, (_, name, url) => {
      if (!safeUrl(url)) return `[${escape(name)}](${escape(url)})`
      const fullUrl = toFullUrl(url)
      return `<a href="${escape(fullUrl)}" target="_blank" rel="noopener" class="text-brand-600 hover:underline dark:text-brand-400">${escape(name)}</a>`
    })
  return text
})
</script>
