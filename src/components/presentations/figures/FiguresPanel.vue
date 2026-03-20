<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FigureDefinition, FigureInstance } from '@/types/figures'
import type { SlideItem } from '@/types/presentationSlide'

const props = defineProps<{
  slide: SlideItem
  figures: FigureDefinition[]
  selectedInstanceId: string | null
  enabled: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
}>()

const open = ref(false)

const figuresById = computed(() => Object.fromEntries(props.figures.map((f) => [f.id, f])) as Record<string, FigureDefinition>)

function geometryKind(figureId: string): string {
  const def = figuresById.value[figureId]
  const g = def?.geometry
  if (!g || typeof g !== 'object') return ''
  return String((g as any).kind ?? '')
}

function isLineLikeKind(kind: string): boolean {
  return ['line', 'connector', 'polyline', 'scribble'].includes(kind)
}

function figureCategory(f: FigureDefinition): string {
  const n = String(f.name ?? '').toLowerCase()
  const g = geometryKind(f.id)
  const isFlowchart = n.includes('process') || n.includes('decision') || n.includes('data') || n.includes('document') || n.includes('terminator') || n.includes('connector') || n.includes('predefined')
  if (isFlowchart) return 'Flowchart Shapes'

  const isStars = n.includes('star') || n.includes('explosion') || n.includes('ribbon') || n.includes('wavy') || n.includes('callout')
  if (isStars) return 'Stars and Banners'

  const isArrows = n.includes('arrow') || n.includes('стрелк') || n.includes('chevron') || g === 'line' || g === 'connector' || g === 'scribble' || g === 'polyline'
  if (isArrows) return 'Lines'

  return 'Basic Shapes'
}

const categories = computed(() => {
  const m = new Map<string, FigureDefinition[]>()
  for (const f of props.figures) {
    const c = figureCategory(f)
    const arr = m.get(c) ?? []
    arr.push(f)
    m.set(c, arr)
  }

  const order: Record<string, number> = {
    Lines: 0,
    'Basic Shapes': 1,
    'Flowchart Shapes': 2,
    'Stars and Banners': 3,
  }
  const list = Array.from(m.entries())
  list.sort((a, b) => (order[a[0]] ?? 999) - (order[b[0]] ?? 999))
  return list.map(([name, items]) => ({ name, items }))
})

function ensureFiguresArray(): FigureInstance[] {
  if (!props.slide.data) props.slide.data = {}
  const data = props.slide.data as Record<string, unknown>
  if (!Array.isArray(data.figures)) data.figures = []
  return data.figures as FigureInstance[]
}

const selectedInstance = computed<FigureInstance | null>(() => {
  const id = props.selectedInstanceId
  if (!id) return null
  const arr = Array.isArray((props.slide.data as any)?.figures) ? ((props.slide.data as any).figures as FigureInstance[]) : []
  return arr.find((x) => x.id === id) ?? null
})

const editorGrid = computed(() => {
  const g = (props.slide.data as any)?.editorGrid
  const enabled = Boolean(g?.enabled)
  const rawStep = g?.stepPct == null ? 5 : Number(g.stepPct)
  const stepPct = Number.isFinite(rawStep) ? Math.min(25, Math.max(1, rawStep)) : 5
  const snap = enabled ? (g?.snap == null ? true : Boolean(g.snap)) : false
  return { enabled, stepPct, snap }
})

function setEditorGridEnabled(enabled: boolean) {
  if (!props.enabled) return
  if (!props.slide.data) props.slide.data = {} as any
  const d = props.slide.data as any
  if (!d.editorGrid || typeof d.editorGrid !== 'object') d.editorGrid = {}
  d.editorGrid.enabled = enabled
  if (!enabled) d.editorGrid.snap = false
}

function setEditorGridStepPct(stepPct: number) {
  if (!props.enabled) return
  if (!props.slide.data) props.slide.data = {} as any
  const d = props.slide.data as any
  if (!d.editorGrid || typeof d.editorGrid !== 'object') d.editorGrid = {}
  d.editorGrid.stepPct = Math.min(25, Math.max(1, stepPct))
}

function setEditorGridSnap(snap: boolean) {
  if (!props.enabled) return
  if (!props.slide.data) props.slide.data = {} as any
  const d = props.slide.data as any
  if (!d.editorGrid || typeof d.editorGrid !== 'object') d.editorGrid = {}
  d.editorGrid.snap = snap
  if (snap) d.editorGrid.enabled = true
}

function starPolygonPoints(points: number, innerRatio: number | undefined): string {
  const p = Number.isFinite(points) ? Math.max(2, Math.floor(points)) : 5
  const inner = innerRatio == null ? 0.5 : innerRatio
  const innerR = 50 * Math.max(0.05, Math.min(0.95, inner))
  const outerR = 50
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const startDeg = -90
  const out: string[] = []
  for (let i = 0; i < p; i++) {
    const aOuter = startDeg + (360 / p) * i
    const aInner = aOuter + 180 / p
    const ox = 50 + Math.cos(toRad(aOuter)) * outerR
    const oy = 50 + Math.sin(toRad(aOuter)) * outerR
    const ix = 50 + Math.cos(toRad(aInner)) * innerR
    const iy = 50 + Math.sin(toRad(aInner)) * innerR
    out.push(`${ox},${oy}`, `${ix},${iy}`)
  }
  return out.join(' ')
}

// Если выбрали фигуру — раскрываем панель, чтобы были доступны действия (удаление/слои/тень/цвет).
watch(
  selectedInstance,
  (v) => {
    if (v) open.value = true
  },
  { immediate: true },
)

function genId(): string {
  const c = (globalThis as any).crypto
  if (c?.randomUUID && typeof c.randomUUID === 'function') return c.randomUUID()
  return `fi_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function maxZ(): number {
  const arr = ensureFiguresArray()
  let m = -Infinity
  for (const i of arr) m = Math.max(m, zNum(i.z))
  return m === -Infinity ? 0 : m
}

function addFigure(figureId: string) {
  if (!props.enabled) return
  const arr = ensureFiguresArray()

  const gKind = geometryKind(figureId)
  const lineLike = isLineLikeKind(gKind)

  const inst: FigureInstance = {
    id: genId(),
    figureId,
    x: 30,
    y: 25,
    w: 30,
    h: 30,
    z: maxZ() + 1,
    style: {
      fill: lineLike ? { type: 'none' } : { type: 'solid', color: '#2563eb' },
      stroke: {
        enabled: lineLike,
        color: '#2563eb',
        width: 2,
        dash: 'solid',
        linecap: 'round',
        linejoin: 'miter',
      },
      shadow: { enabled: false, color: '#000000', blur: 6, offsetX: 2, offsetY: 2, opacity: 0.25 },
    },
  }
  arr.push(inst)
  emit('select', inst.id)
}

function removeSelected() {
  if (!props.enabled) return
  const id = props.selectedInstanceId
  if (!id) return
  const arr = ensureFiguresArray()
  const idx = arr.findIndex((x) => x.id === id)
  if (idx >= 0) arr.splice(idx, 1)
  // Принудительно переустанавливаем массив, чтобы Vue гарантированно отслеживал изменения
  if (props.slide.data) (props.slide.data as any).figures = [...arr]
  emit('select', null)
}

function ensureSelectedStyle(): { fill: any; stroke: any; shadow: any } | null {
  const s = selectedInstance.value
  if (!s) return null
  if (!s.style || typeof s.style !== 'object') s.style = { fill: { type: 'solid', color: '#000' } } as any
  if (!s.style.fill || typeof s.style.fill !== 'object') (s.style as any).fill = { type: 'solid', color: '#000' }
  if (!s.style.stroke || typeof s.style.stroke !== 'object') {
    const kind = geometryKind(s.figureId)
    const lineLike = isLineLikeKind(kind)
    ;(s.style as any).stroke = {
      enabled: lineLike,
      color: '#2563eb',
      width: 2,
      dash: 'solid',
      linecap: 'round',
      linejoin: 'miter',
    }
  }
  if (!s.style.shadow || typeof s.style.shadow !== 'object') {
    ;(s.style as any).shadow = { enabled: false, color: '#000000', blur: 6, offsetX: 2, offsetY: 2, opacity: 0.25 }
  }
  return { fill: s.style.fill, stroke: s.style.stroke, shadow: s.style.shadow }
}

function setFillType(type: 'none' | 'solid' | 'linear') {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  if (type === 'solid') {
    ;(s.style as any).fill = { type: 'solid', color: (s.style as any).fill?.color ?? '#2563eb' }
  } else if (type === 'linear') {
    ;(s.style as any).fill = {
      type: 'linear',
      from: (s.style as any).fill?.from ?? '#60a5fa',
      to: (s.style as any).fill?.to ?? '#1d4ed8',
      angle: Number((s.style as any).fill?.angle ?? 45),
    }
  } else {
    ;(s.style as any).fill = { type: 'none' }
  }
}

function setSolidColor(color: string) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  if ((s.style as any).fill?.type !== 'solid') setFillType('solid')
  ;(s.style as any).fill.color = color
}

function setLinearFrom(color: string) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  if ((s.style as any).fill?.type !== 'linear') setFillType('linear')
  ;(s.style as any).fill.from = color
}

function setLinearTo(color: string) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  if ((s.style as any).fill?.type !== 'linear') setFillType('linear')
  ;(s.style as any).fill.to = color
}

function setLinearAngle(angle: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  if ((s.style as any).fill?.type !== 'linear') setFillType('linear')
  ;(s.style as any).fill.angle = angle
}

function setStrokeEnabled(enabled: boolean) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).stroke.enabled = enabled
}

function setStrokeColor(color: string) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).stroke.color = color
}

function setStrokeWidth(width: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).stroke.width = width
}

function setStrokeDash(dash: 'solid' | 'dashed' | 'dotted') {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).stroke.dash = dash
}

function setRotation(deg: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  s.rotation = deg
}

function normalizeZ() {
  const arr = ensureFiguresArray()
  const sorted = [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
  sorted.forEach((inst, idx) => { inst.z = idx })

  // Гарантируем реактивность для вложенного slide.data.figures.
  // На части данных z может не обновляться визуально без переустановки массива.
  if (props.slide.data) (props.slide.data as any).figures = [...arr]
}

function bringToFront() {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  const arr = ensureFiguresArray()
  const max = arr.length ? Math.max(...arr.map((i) => zNum(i.z))) : 0
  s.z = max + 1
  normalizeZ()
}

function sendToBack() {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  const arr = ensureFiguresArray()
  const min = arr.length ? Math.min(...arr.map((i) => zNum(i.z))) : 0
  s.z = min - 1
  normalizeZ()
}

function moveLayer(delta: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  const arr = ensureFiguresArray()
  const sorted = [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
  const idx = sorted.findIndex((x) => x.id === s.id)
  if (idx < 0) return
  const target = sorted[idx + delta]
  if (!target) return
  const tmp = s.z
  s.z = target.z
  target.z = tmp
  normalizeZ()
}

function setShadowEnabled(enabled: boolean) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.enabled = enabled
}

function setShadowColor(color: string) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.color = color
}

function setShadowBlur(v: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.blur = v
}

function setShadowOffsetX(v: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.offsetX = v
}

function setShadowOffsetY(v: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.offsetY = v
}

function setShadowOpacity(v: number) {
  if (!props.enabled) return
  const s = selectedInstance.value
  if (!s) return
  ensureSelectedStyle()
  ;(s.style as any).shadow.opacity = v
}
</script>

<template>
  <div v-if="enabled" class="figures-panel mt-2 rounded-xl border border-gray-200 bg-white/60 p-3 dark:border-gray-700 dark:bg-gray-900/30">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left"
      @click="open = !open"
    >
      <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Фигуры</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ open ? 'Свернуть' : 'Развернуть' }}</span>
    </button>

    <div v-if="open" class="mt-3">
      <!-- Сетка и снап: настраиваются на уровне текущего слайда -->
      <div class="mb-3 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900/30">
        <div class="flex items-center justify-between gap-3">
          <label class="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              class="rounded border-gray-300 text-brand-600"
              :checked="editorGrid.enabled"
              @change="setEditorGridEnabled(($event.target as HTMLInputElement).checked)"
            />
            Сетка
          </label>
          <div class="flex items-center gap-2">
            <select
              class="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              :disabled="!editorGrid.enabled"
              :value="editorGrid.stepPct"
              @change="setEditorGridStepPct(Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="2">2%</option>
              <option :value="5">5%</option>
              <option :value="10">10%</option>
              <option :value="20">20%</option>
            </select>
          </div>
        </div>
        <label class="mt-1 flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 select-none">
          <input
            type="checkbox"
            class="rounded border-gray-300 text-brand-600"
            :checked="editorGrid.snap"
            :disabled="!editorGrid.enabled"
            @change="setEditorGridSnap(($event.target as HTMLInputElement).checked)"
          />
          Снап по сетке
        </label>
      </div>

      <div v-if="selectedInstance" class="sticky top-0 z-20 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{{ selectedInstance.figureId }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Настройки фигуры</div>
          </div>
          <!-- Быстрые иконки: цвет, слои, тень -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              title="На зад"
              @click="moveLayer(-1)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6-6 6 6M6 15l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              title="На перед"
              @click="moveLayer(1)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6 6 6-6M6 9l6-6 6 6" />
              </svg>
            </button>
            <label class="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                class="rounded border-gray-300 text-brand-600"
                :checked="Boolean((selectedInstance.style as any)?.shadow?.enabled)"
                @change="setShadowEnabled(($event.target as HTMLInputElement).checked)"
                title="Тень"
              />
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <svg class="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m9-9H3" />
                </svg>
              </span>
            </label>
            <input
              type="color"
              :value="(selectedInstance.style as any)?.fill?.color ?? '#2563eb'"
              class="h-7 w-7 cursor-pointer rounded border border-gray-200 bg-white p-0 dark:border-gray-700"
              title="Цвет (быстро)"
              @input="setSolidColor(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div class="mt-3 space-y-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Заливка</label>
            <select
              class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              :value="(selectedInstance.style as any)?.fill?.type ?? 'solid'"
              :disabled="!enabled"
              @change="setFillType(($event.target as HTMLSelectElement).value as any)"
            >
              <option value="none">Нет заливки</option>
              <option value="solid">Однотонная</option>
              <option value="linear">Градиент</option>
            </select>
          </div>

          <div v-if="(selectedInstance.style as any)?.fill?.type === 'solid'">
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Цвет</label>
            <input
              type="color"
              :value="(selectedInstance.style as any)?.fill?.color ?? '#2563eb'"
              class="h-9 w-full rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
              @input="setSolidColor(($event.target as HTMLInputElement).value)"
            />
          </div>

          <div v-else-if="(selectedInstance.style as any)?.fill?.type === 'linear'">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">С</label>
                <input
                  type="color"
                  :value="(selectedInstance.style as any)?.fill?.from ?? '#60a5fa'"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
                  @input="setLinearFrom(($event.target as HTMLInputElement).value)"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">На</label>
                <input
                  type="color"
                  :value="(selectedInstance.style as any)?.fill?.to ?? '#1d4ed8'"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
                  @input="setLinearTo(($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Угол</label>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                :value="(selectedInstance.style as any)?.fill?.angle ?? 45"
                class="w-full"
                @input="setLinearAngle(Number(($event.target as HTMLInputElement).value))"
              />
              <div class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ (selectedInstance.style as any)?.fill?.angle ?? 45 }} deg</div>
            </div>
          </div>

          <div v-else class="text-xs text-gray-500 dark:text-gray-400">Заливка отключена для выбранной фигуры.</div>

          <div class="pt-2">
            <label class="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <input type="checkbox" :checked="Boolean((selectedInstance.style as any)?.stroke?.enabled)" class="rounded border-gray-300 text-brand-600" @change="setStrokeEnabled(($event.target as HTMLInputElement).checked)" />
              Границы (stroke)
            </label>
          </div>

          <div v-if="Boolean((selectedInstance.style as any)?.stroke?.enabled)" class="space-y-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Цвет границы</label>
              <input type="color" :value="(selectedInstance.style as any)?.stroke?.color ?? '#2563eb'" class="h-9 w-full rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800" @input="setStrokeColor(($event.target as HTMLInputElement).value)" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Толщина</label>
              <input type="range" min="0" max="12" step="0.5" :value="Number((selectedInstance.style as any)?.stroke?.width ?? 2)" class="w-full" @input="setStrokeWidth(Number(($event.target as HTMLInputElement).value))" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Линия</label>
                <select class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200" :value="(selectedInstance.style as any)?.stroke?.dash ?? 'solid'" @change="setStrokeDash(($event.target as HTMLSelectElement).value as any)">
                  <option value="solid">Сплошная</option>
                  <option value="dashed">Пунктир</option>
                  <option value="dotted">Точки</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Кап</label>
                <select
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  :value="(selectedInstance.style as any)?.stroke?.linecap ?? 'round'"
                  @change="(selectedInstance.style as any).stroke.linecap = ($event.target as HTMLSelectElement).value"
                >
                  <option value="round">Округленный</option>
                  <option value="butt">Плоский</option>
                  <option value="square">Квадратный</option>
                </select>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Вращение</label>
            <input type="range" min="0" max="360" step="1" :value="Number(selectedInstance.rotation ?? 0)" class="w-full" @input="setRotation(Number(($event.target as HTMLInputElement).value))" />
            <div class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ Number(selectedInstance.rotation ?? 0) }} deg</div>
          </div>

          <div class="pt-2">
            <div class="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Слои</div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" @click="moveLayer(-1)">На зад</button>
              <button type="button" class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" @click="moveLayer(1)">На перед</button>
              <button type="button" class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" @click="sendToBack">К началу</button>
              <button type="button" class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700" @click="bringToFront">К концу</button>
            </div>
          </div>

          <div class="pt-2">
            <label class="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <input type="checkbox" :checked="Boolean((selectedInstance.style as any)?.shadow?.enabled)" class="rounded border-gray-300 text-brand-600" @change="setShadowEnabled(($event.target as HTMLInputElement).checked)" />
              Тень
            </label>
          </div>

          <div v-if="Boolean((selectedInstance.style as any)?.shadow?.enabled)">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Цвет тени</label>
                <input type="color" :value="(selectedInstance.style as any)?.shadow?.color ?? '#000000'" class="h-9 w-full rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800" @input="setShadowColor(($event.target as HTMLInputElement).value)" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Непрозрачность</label>
                <input type="range" min="0" max="1" step="0.01" :value="Number((selectedInstance.style as any)?.shadow?.opacity ?? 0.25)" class="w-full" @input="setShadowOpacity(Number(($event.target as HTMLInputElement).value))" />
              </div>
            </div>
            <div class="mt-2">
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Размытие</label>
              <input type="range" min="0" max="24" step="1" :value="Number((selectedInstance.style as any)?.shadow?.blur ?? 6)" class="w-full" @input="setShadowBlur(Number(($event.target as HTMLInputElement).value))" />
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Смещение X</label>
                <input type="range" min="-20" max="20" step="1" :value="Number((selectedInstance.style as any)?.shadow?.offsetX ?? 2)" class="w-full" @input="setShadowOffsetX(Number(($event.target as HTMLInputElement).value))" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Смещение Y</label>
                <input type="range" min="-20" max="20" step="1" :value="Number((selectedInstance.style as any)?.shadow?.offsetY ?? 2)" class="w-full" @input="setShadowOffsetY(Number(($event.target as HTMLInputElement).value))" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3" :class="selectedInstance ? 'max-h-[52vh] overflow-y-auto pr-1' : ''">
        <div v-if="figures.length" class="space-y-2">
          <div v-for="c in categories" :key="c.name" class="space-y-2">
            <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ c.name }}</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="f in c.items"
                :key="f.id"
                type="button"
                class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="addFigure(f.id)"
              >
                <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <svg viewBox="0 0 100 100" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                    <rect v-if="(f.geometry as any)?.kind === 'rect'" x="0" y="0" width="100" height="100" rx="8" ry="8" fill="currentColor" class="text-brand-600" />
                    <rect
                      v-else-if="(f.geometry as any)?.kind === 'roundedRect'"
                      x="0"
                      y="0"
                      width="100"
                      height="100"
                      :rx="(f.geometry as any)?.rx ?? 12"
                      :ry="(f.geometry as any)?.rx ?? 12"
                      fill="currentColor"
                      class="text-brand-600"
                    />
                    <ellipse v-else-if="(f.geometry as any)?.kind === 'ellipse'" cx="50" cy="50" rx="50" ry="30" fill="currentColor" class="text-brand-600" />
                    <ellipse v-else-if="(f.geometry as any)?.kind === 'circle'" cx="50" cy="50" :rx="(f.geometry as any)?.r ?? 40" :ry="(f.geometry as any)?.r ?? 40" fill="currentColor" class="text-brand-600" />

                    <polygon
                      v-else-if="(f.geometry as any)?.kind === 'star'"
                      :points="starPolygonPoints((f.geometry as any)?.points ?? 5, (f.geometry as any)?.innerRatio)"
                      fill="currentColor"
                      class="text-brand-600"
                    />

                    <polygon v-else-if="(f.geometry as any)?.kind === 'polygon'" :points="(f.geometry as any)?.points?.map((p: number[]) => `${p[0]},${p[1]}`).join(' ')" fill="currentColor" class="text-brand-600" />

                    <path v-else-if="(f.geometry as any)?.kind === 'path'" :d="(f.geometry as any)?.d" fill="currentColor" class="text-brand-600" />

                    <polyline
                      v-else-if="(f.geometry as any)?.kind === 'polyline' || (f.geometry as any)?.kind === 'scribble'"
                      :points="(f.geometry as any)?.points?.map((p: number[]) => `${p[0]},${p[1]}`).join(' ')"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="6"
                      stroke-linecap="round"
                    />

                    <template v-else-if="(f.geometry as any)?.kind === 'connector'">
                      <line
                        v-if="(f.geometry as any)?.mode === 'straight'"
                        :x1="(f.geometry as any)?.x1"
                        :y1="(f.geometry as any)?.y1"
                        :x2="(f.geometry as any)?.x2"
                        :y2="(f.geometry as any)?.y2"
                        stroke="currentColor"
                        stroke-width="8"
                        stroke-linecap="round"
                      />
                      <polyline
                        v-else-if="(f.geometry as any)?.mode === 'elbow'"
                        :points="`${(f.geometry as any)?.x1},${(f.geometry as any)?.y1} ${(f.geometry as any)?.elbowMidX ?? ((f.geometry as any)?.x1 + (f.geometry as any)?.x2)/2},${(f.geometry as any)?.elbowMidY ?? (f.geometry as any)?.y1} ${(f.geometry as any)?.x2},${(f.geometry as any)?.y2}`"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="6"
                        stroke-linecap="round"
                      />
                      <path
                        v-else
                        :d="`M ${(f.geometry as any)?.x1} ${(f.geometry as any)?.y1} C ${(f.geometry as any)?.c1x ?? ((f.geometry as any)?.x1 + (f.geometry as any)?.x2) / 3} ${(f.geometry as any)?.c1y ?? (f.geometry as any)?.y1}, ${(f.geometry as any)?.c2x ?? (2 * ((f.geometry as any)?.x1 + (f.geometry as any)?.x2) / 3 - (f.geometry as any)?.x2)} ${(f.geometry as any)?.c2y ?? (f.geometry as any)?.y2}, ${(f.geometry as any)?.x2} ${(f.geometry as any)?.y2}`"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="6"
                        stroke-linecap="round"
                      />
                    </template>

                    <line
                      v-else-if="(f.geometry as any)?.kind === 'line'"
                      :x1="10"
                      :y1="50"
                      :x2="90"
                      :y2="50"
                      stroke="currentColor"
                      stroke-width="8"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <span class="min-w-0 truncate">{{ f.name }}</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Фигуры не найдены в базе
        </div>
      </div>

      <div v-if="!selectedInstance" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Выберите фигуру на слайде кликом
      </div>
    </div>
  </div>
</template>

