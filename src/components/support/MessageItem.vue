<template>
  <article>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img v-if="avatar" :src="avatar" class="h-10 w-10 shrink-0 rounded-full object-cover" alt="" />
        <div
          v-else
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {{ (name || '?').charAt(0).toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ email }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ time }}</p>
    </div>
    <div class="pb-6 text-sm text-gray-500 dark:text-gray-400">
      <div class="whitespace-pre-wrap" v-html="renderedContent"></div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { getApiBase } from '@/api/client'

const props = defineProps(['name', 'email', 'avatar', 'time', 'content'])

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
      return `<img src="${escape(fullUrl)}" alt="${escape(alt)}" class="mt-2 max-h-48 rounded-lg object-contain" loading="lazy" />`
    })
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/uploads\/[^)]+)\)/g, (_, name, url) => {
      if (!safeUrl(url)) return `[${escape(name)}](${escape(url)})`
      const fullUrl = toFullUrl(url)
      return `<a href="${escape(fullUrl)}" target="_blank" rel="noopener" class="text-brand-600 hover:underline dark:text-brand-400">${escape(name)}</a>`
    })
  return text
})
</script>
