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

const hasValidCoords = ref(false)

function isValidCoord(n: number): boolean {
  return typeof n === 'number' && !Number.isNaN(n) && n !== 0
}

function checkValid() {
  hasValidCoords.value = isValidCoord(props.lat) && isValidCoord(props.lng)
}

function initMap() {
  if (!mapEl.value || !hasValidCoords.value || map) return
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
  if (!map || !marker) return
  const { lat, lng } = props
  if (!isValidCoord(lat) || !isValidCoord(lng)) return
  map.setView([lat, lng], map.getZoom())
  marker.setLatLng([lat, lng])
}

function destroyMap() {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
}

checkValid()

onMounted(() => {
  if (hasValidCoords.value) {
    nextTick(() => initMap())
  }
})

watch(
  () => [props.lat, props.lng],
  () => {
    checkValid()
    if (hasValidCoords.value) {
      if (!map) nextTick(() => initMap())
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
