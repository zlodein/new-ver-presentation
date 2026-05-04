<template>
  <div class="location-map-container relative min-h-[140px] w-full flex-1 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
    <template v-if="!hasValidCoords">
      <div class="flex h-full min-h-[140px] w-full items-center justify-center text-gray-500 text-sm">
        Укажите адрес — карта появится здесь
      </div>
    </template>
    <template v-else>
      <!-- Контейнер карты всегда в DOM и видим при hasValidCoords, чтобы у карты были размеры при инициализации -->
      <div ref="mapEl" class="location-map absolute inset-0 h-full w-full min-h-[140px] rounded-lg" />
      <!-- Оверлей загрузки/ошибки поверх карты пока карта не готова -->
      <div
        v-if="!mapReady"
        class="absolute inset-0 flex min-h-[140px] items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700"
      >
        <p
          v-if="yandexLoadError"
          class="px-2 text-center text-sm text-amber-600 dark:text-amber-400"
        >
          Не удалось загрузить Яндекс.Карты. Проверьте ключ VITE_YANDEX_MAPS_API_KEY.
        </p>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          Загрузка карты…
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const INIT_RETRY_MS = 150
const INIT_RETRY_ATTEMPTS = 20
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  lat: number
  lng: number
  forceYandexOnly?: boolean
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let resizeObserver: ResizeObserver | null = null
let marker: L.Marker | null = null
let yandexMap: unknown = null

const hasValidCoords = ref(false)
const mapReady = ref(false)
const yandexLoadError = ref(false)

const yandexMapsApiKey = (import.meta as ImportMeta & { env: { VITE_YANDEX_MAPS_API_KEY?: string } }).env?.VITE_YANDEX_MAPS_API_KEY ?? ''
const useYandexOnly = (props.forceYandexOnly ?? false) || !!yandexMapsApiKey

function isValidCoord(n: number): boolean {
  return typeof n === 'number' && !Number.isNaN(n) && n !== 0
}

function checkValid() {
  hasValidCoords.value = isValidCoord(props.lat) && isValidCoord(props.lng)
}

function loadYandexMaps(): Promise<boolean> {
  if (typeof window === 'undefined' || (window as unknown as { ymaps?: unknown }).ymaps) {
    return Promise.resolve(!!(window as unknown as { ymaps?: unknown }).ymaps)
  }
  if (!yandexMapsApiKey) return Promise.resolve(false)
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(yandexMapsApiKey)}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      const ym = (window as unknown as { ymaps?: { ready: (cb: () => void) => void } }).ymaps
      if (ym?.ready) {
        ym.ready(() => resolve(true))
      } else {
        resolve(false)
      }
    }
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

function containerHasSize(): boolean {
  if (!mapEl.value) return false
  const r = mapEl.value.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

function initLeafletFallback() {
  if (!mapEl.value || !hasValidCoords.value || map) return
  map = L.map(mapEl.value, { attributionControl: false }).setView([props.lat, props.lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
  marker = L.marker([props.lat, props.lng], { icon }).addTo(map!)
  mapReady.value = true
}

function initMap() {
  if (!mapEl.value || !hasValidCoords.value || yandexMap || map) return
  if (!containerHasSize()) return

  const win = window as unknown as {
    ymaps?: {
      Map?: new (el: HTMLElement, opts: { center: number[]; zoom: number; type?: string }) => unknown
      Placemark?: new (center: number[], opts?: unknown) => unknown
    }
  }

  if (useYandexOnly && win.ymaps && typeof win.ymaps.Map === 'function' && typeof win.ymaps.Placemark === 'function') {
    try {
      yandexMap = new win.ymaps.Map!(mapEl.value, {
        center: [props.lat, props.lng],
        zoom: 16,
        type: 'yandex#map',
      })
      const placemark = new win.ymaps.Placemark!([props.lat, props.lng])
      ;(yandexMap as { geoObjects: { add: (p: unknown) => void } }).geoObjects.add(placemark)
      mapReady.value = true
      yandexLoadError.value = false
      return
    } catch (e) {
      console.warn('[LocationMap] Yandex Maps init failed, fallback to Leaflet', e)
      yandexMap = null
      yandexLoadError.value = true
    }
  } else if (useYandexOnly) {
    yandexLoadError.value = true
    mapReady.value = false
  }

  if (props.forceYandexOnly) return
  initLeafletFallback()
}

function updateMap() {
  if (yandexMap) {
    const y = yandexMap as { setCenter: (c: number[]) => void; geoObjects: { removeAll: () => void; add: (p: unknown) => void } }
    y.setCenter([props.lat, props.lng])
    const ym = (window as unknown as { ymaps?: { Placemark?: new (center: number[]) => unknown } }).ymaps
    if (ym && typeof ym.Placemark === 'function') {
      try {
        y.geoObjects.removeAll()
        y.geoObjects.add(new ym.Placemark([props.lat, props.lng]))
      } catch {
        /* ignore */
      }
    }
    return
  }
  if (!map || !marker) return
  const { lat, lng } = props
  if (!isValidCoord(lat) || !isValidCoord(lng)) return
  map.setView([lat, lng], map.getZoom())
  marker.setLatLng([lat, lng])
}

function destroyMap() {
  if (yandexMap) {
    try {
      (yandexMap as { destroy: () => void }).destroy()
    } catch {
      /* ignore */
    }
    yandexMap = null
  }
  if (map) {
    map.remove()
    map = null
    marker = null
  }
  mapReady.value = false
  yandexLoadError.value = false
}

checkValid()

function scheduleInitWhenReady(attempt = 0) {
  if (attempt >= INIT_RETRY_ATTEMPTS) return
  nextTick(() => {
    if (containerHasSize()) {
      initMap()
    } else {
      setTimeout(() => scheduleInitWhenReady(attempt + 1), INIT_RETRY_MS)
    }
  })
}

onMounted(() => {
  if (!hasValidCoords.value) return
  if (useYandexOnly) {
    loadYandexMaps().then((ok) => {
      if (!ok) yandexLoadError.value = true
      scheduleInitWhenReady()
    })
  } else {
    scheduleInitWhenReady()
  }
  const el = mapEl.value
  if (el && hasValidCoords.value) {
    resizeObserver = new ResizeObserver(() => {
      if (containerHasSize() && !map && !yandexMap) scheduleInitWhenReady(0)
    })
    resizeObserver.observe(el)
  }
})

watch(
  () => [props.lat, props.lng],
  () => {
    checkValid()
    if (hasValidCoords.value) {
      if (!map && !yandexMap) {
        if (useYandexOnly && !(window as unknown as { ymaps?: unknown }).ymaps) {
          loadYandexMaps().then((ok) => {
            if (!ok) yandexLoadError.value = true
            scheduleInitWhenReady(0)
          })
        } else {
          scheduleInitWhenReady(0)
        }
      } else {
        updateMap()
      }
    } else {
      destroyMap()
    }
  }
)

onBeforeUnmount(() => {
  if (resizeObserver && mapEl.value) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  destroyMap()
})
</script>

<style>
.location-map-container .leaflet-container {
  font-family: inherit;
}
</style>
