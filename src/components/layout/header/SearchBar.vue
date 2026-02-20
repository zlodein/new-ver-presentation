<template>
  <div class="hidden lg:block relative">
    <form @submit.prevent="onSubmit">
      <div class="relative">
        <button type="button" class="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
          <svg
            class="fill-gray-500 dark:fill-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </button>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Поиск или введите команду..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
          autocomplete="off"
          @focus="showDropdown = true"
          @input="onInput"
        />

        <button
          type="submit"
          class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-[4.5px] text-xs font-medium -tracking-[0.2px] text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/10"
        >
          ок
        </button>
      </div>
    </form>

    <!-- Выпадающий список результатов по категориям -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown && (query.trim() || lastResults)"
        ref="dropdownRef"
        class="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] w-full min-w-[320px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 xl:min-w-[430px]"
      >
        <div class="max-h-[min(70vh,420px)] overflow-y-auto py-2">
          <template v-if="loading">
            <div class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Поиск...
            </div>
          </template>
          <template v-else-if="!query.trim() && lastResults">
            <div class="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Введите запрос или нажмите «ок» для полного поиска
            </div>
          </template>
          <template v-else-if="query.trim() && lastResults && hasAnyResults">
            <SearchCategory
              v-if="lastResults.presentations.length"
              title="Презентации"
              :items="lastResults.presentations"
              @navigate="goAndClose"
            />
            <SearchCategory
              v-if="lastResults.calendar.length"
              title="Календарь"
              :items="lastResults.calendar"
              @navigate="goAndClose"
            />
            <SearchCategory
              v-if="lastResults.tasks.length"
              title="Задачи"
              :items="lastResults.tasks"
              @navigate="goAndClose"
            />
            <SearchCategory
              v-if="lastResults.documentation.length"
              title="Документация"
              :items="lastResults.documentation"
              @navigate="goAndClose"
            />
          </template>
          <template v-else-if="query.trim() && !loading">
            <div class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Ничего не найдено
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import type { GlobalSearchResults } from '@/composables/useGlobalSearch'
import SearchCategory from './SearchCategory.vue'

const router = useRouter()
const { search, loading } = useGlobalSearch()

const query = ref('')
const showDropdown = ref(false)
const lastResults = ref<GlobalSearchResults | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const hasAnyResults = computed(() => {
  if (!lastResults.value) return false
  const r = lastResults.value
  return (
    r.presentations.length > 0 ||
    r.calendar.length > 0 ||
    r.tasks.length > 0 ||
    r.documentation.length > 0
  )
})

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = query.value.trim()
  if (!q) {
    lastResults.value = null
    return
  }
  debounceTimer = setTimeout(async () => {
    debounceTimer = null
    lastResults.value = await search(q)
  }, 280)
}

function goAndClose() {
  showDropdown.value = false
}

function onSubmit() {
  const q = query.value.trim()
  showDropdown.value = false
  if (q) {
    router.push({ path: '/dashboard/search', query: { q } })
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (
    dropdownRef.value?.contains(target) ||
    inputRef.value?.contains(target)
  ) return
  showDropdown.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})

watch(query, (v) => {
  if (!v.trim()) lastResults.value = null
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
