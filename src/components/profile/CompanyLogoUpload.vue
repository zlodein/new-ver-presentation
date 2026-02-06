<template>
  <div class="relative">
    <div
      class="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-brand-500 text-white font-semibold text-2xl cursor-pointer group relative"
      @click="openFileDialog"
    >
      <img v-if="preview" :src="preview" alt="Лого компании" class="w-full h-full object-cover" />
      <span v-else class="select-none text-sm">Лого</span>
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
    <button
      v-if="preview"
      type="button"
      @click.stop="removeLogo"
      :disabled="deleting"
      class="absolute -top-0.5 -right-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-700"
      aria-label="Удалить логотип"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <Modal v-if="showCropModal" @close="closeCropModal">
      <template #body>
        <div class="relative w-full max-w-[600px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <button
            @click="closeCropModal"
            class="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z" fill="" />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Обрезка логотипа</h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">Переместите и измените размер области обрезки</p>
          </div>
          <div class="mb-6 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800" style="height: 400px;">
            <img
              ref="cropImage"
              :src="cropImageSrc"
              alt="Crop"
              style="display: block; max-width: 100%; max-height: 400px;"
              @load="initCropper"
            />
          </div>
          <div class="flex items-center gap-3 justify-end">
            <button type="button" @click="closeCropModal" class="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
              Отмена
            </button>
            <button type="button" :disabled="uploading" @click="cropAndUpload" class="flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
              {{ uploading ? 'Загрузка...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import Modal from './Modal.vue'
import { getToken } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/api/client'

const props = defineProps<{
  currentImage?: string | null
}>()

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const { fetchUser } = useAuth()
const fileInput = ref<HTMLInputElement | null>(null)
const cropImage = ref<HTMLImageElement | null>(null)
const showCropModal = ref(false)
const cropImageSrc = ref('')
const uploading = ref(false)
const deleting = ref(false)
const localPreview = ref<string | null>(null)
let cropperInstance: InstanceType<typeof Cropper> | null = null

const preview = computed(() => {
  if (localPreview.value) return localPreview.value
  if (props.currentImage) {
    const url = props.currentImage.startsWith('/') ? props.currentImage : `/${props.currentImage}`
    return url
  }
  return null
})

const openFileDialog = () => fileInput.value?.click()

async function removeLogo() {
  if (deleting.value) return
  if (!confirm('Удалить логотип компании?')) return
  deleting.value = true
  try {
    await api.put('/api/auth/profile', { company_logo: null })
    localPreview.value = null
    await fetchUser()
  } catch (err) {
    console.error('Ошибка удаления логотипа:', err)
    alert(err instanceof Error ? err.message : 'Ошибка удаления логотипа')
  } finally {
    deleting.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (file.size > 5 * 1024 * 1024) {
    alert('Размер файла не должен превышать 5MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    cropImageSrc.value = e.target?.result as string
    showCropModal.value = true
  }
  reader.readAsDataURL(file)
}

const initCropper = () => {
  if (!cropImage.value || !cropImageSrc.value) return
  nextTick(() => {
    if (cropperInstance) {
      cropperInstance.destroy()
      cropperInstance = null
    }
    cropperInstance = new Cropper(cropImage.value!, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    })
  })
}

const cropAndUpload = async () => {
  if (!cropperInstance) return
  uploading.value = true
  try {
    const canvas = cropperInstance.getCroppedCanvas({
      width: 400,
      height: 400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    if (!canvas) {
      uploading.value = false
      return
    }
    canvas.toBlob(
      async (blob: Blob | null) => {
        if (!blob) {
          uploading.value = false
          return
        }
        try {
          const fd = new FormData()
          fd.append('file', blob, 'company-logo.jpg')
          const base = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env?.VITE_API_URL?.replace(/\/$/, '') ?? ''
          const res = await fetch(`${base}/api/upload/company-logo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken() ?? ''}` },
            body: fd,
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Ошибка загрузки')
          }
          const data = await res.json()
          localPreview.value = data.url.startsWith('/') ? data.url : `/${data.url}`
          await api.put('/api/auth/profile', { company_logo: data.url })
          await fetchUser()
          emit('uploaded', data.url)
          closeCropModal()
        } catch (err) {
          console.error('Upload error:', err)
          alert(err instanceof Error ? err.message : 'Ошибка загрузки логотипа')
        } finally {
          uploading.value = false
        }
      },
      'image/jpeg',
      0.9
    )
  } catch (err) {
    console.error('Crop error:', err)
    uploading.value = false
  }
}

const closeCropModal = () => {
  if (cropperInstance) {
    cropperInstance.destroy()
    cropperInstance = null
  }
  showCropModal.value = false
  cropImageSrc.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

watch(() => props.currentImage, (newVal) => {
  if (!newVal) localPreview.value = null
}, { immediate: true })

onBeforeUnmount(() => {
  if (cropperInstance) cropperInstance.destroy()
})
</script>
