<template>
  <div class="location-map-container relative min-h-[140px] w-full flex-1 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
    <div
      v-show="hasValidCoords"
      ref="mapEl"
      class="location-map h-full w-full min-h-[140px] rounded-lg"
    />
    <div
      v-if="!hasValidCoords"
      class="flex h-full min-h-[140px] w-full items-center justify-center text-gray-500 text-sm"
    >
      Укажите адрес — карта появится здесь
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  lat: number
  lng: number
}>()

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let yandexMap: unknown = null

const hasValidCoords = ref(false)
const useYandex = ref(false)

const yandexMapsApiKey = (import.meta as ImportMeta & { env: { VITE_YANDEX_MAPS_API_KEY?: string } }).env?.VITE_YANDEX_MAPS_API_KEY ?? ''

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

function initMap() {
  if (!mapEl.value || !hasValidCoords.value || map) return
  if (useYandex.value && (window as unknown as { ymaps?: unknown }).ymaps) {
    const ymaps = (window as unknown as { ymaps: { Map: new (el: HTMLElement, opts: { center: number[]; zoom: number; type?: string }) => unknown; Placemark: new (center: number[], opts?: unknown) => unknown } }).ymaps
    yandexMap = new ymaps.Map(mapEl.value, {
      center: [props.lat, props.lng],
      zoom: 16,
      type: 'yandex#map',
    })
    const placemark = new ymaps.Placemark([props.lat, props.lng])
    ;(yandexMap as { geoObjects: { add: (p: unknown) => void } }).geoObjects.add(placemark)
    return
  }
  map = L.map(mapEl.value, { attributionControl: false }).setView([props.lat, props.lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
  marker = L.marker([props.lat, props.lng], { icon }).addTo(map!)
}

function updateMap() {
  if (yandexMap) {
    const y = yandexMap as { setCenter: (c: number[]) => void; geoObjects: { removeAll: () => void; add: (p: unknown) => void } }
    y.setCenter([props.lat, props.lng])
    const ymaps = (window as unknown as { ymaps: { Placemark: new (center: number[]) => unknown } }).ymaps
    if (ymaps) {
      y.geoObjects.removeAll()
      y.geoObjects.add(new ymaps.Placemark([props.lat, props.lng]))
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
}

checkValid()

onMounted(() => {
  if (!hasValidCoords.value) return
  if (yandexMapsApiKey) {
    loadYandexMaps().then((ok) => {
      useYandex.value = ok
      nextTick(() => initMap())
    })
  } else {
    nextTick(() => initMap())
  }
})

watch(
  () => [props.lat, props.lng],
  () => {
    checkValid()
    if (hasValidCoords.value) {
      if (!map && !yandexMap) nextTick(() => initMap())
      else updateMap()
    } else {
      destroyMap()
    }
  }
)

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style>
.location-map-container .leaflet-container {
  font-family: inherit;
}
</style>
