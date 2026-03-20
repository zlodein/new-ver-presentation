<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import type { FigureDefinition, FigureInstance } from '@/types/figures'

type SlideLike = {
  data?: Record<string, unknown>
}

const props = defineProps<{
  slide: SlideLike
  figuresById: Record<string, FigureDefinition>
  selectedInstanceId: string | null
  enabled: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'delete', id: string): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)

function getInstances(): FigureInstance[] {
  const data = props.slide.data as Record<string, unknown> | undefined
  const arr = data?.figures
  return Array.isArray(arr) ? (arr as FigureInstance[]) : []
}

const instances = computed(() => getInstances())
const selected = computed(() => selectedInstance())

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const editorGridCfg = computed(() => {
  const g = (props.slide.data as any)?.editorGrid
  const enabled = Boolean(g?.enabled)
  const stepPctRaw = g?.stepPct == null ? 5 : Number(g.stepPct)
  const stepPct = clamp(stepPctRaw, 1, 25)
  const snap = enabled && (g?.snap == null ? true : Boolean(g.snap))
  return { enabled, stepPct, snap }
})

const outerStyle = computed(() => {
  const base: Record<string, string | number> = { position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }
  if (!editorGridCfg.value.enabled) return base
  const alpha = 0.18
  return {
    ...base,
    backgroundImage: `linear-gradient(to right, rgba(37,99,235,${alpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,${alpha}) 1px, transparent 1px)`,
    backgroundSize: `${editorGridCfg.value.stepPct}% ${editorGridCfg.value.stepPct}%`,
  }
})

function selectedInstance(): FigureInstance | null {
  if (!props.selectedInstanceId) return null
  return instances.value.find((i) => i.id === props.selectedInstanceId) ?? null
}

function maxZ(): number {
  let m = -Infinity
  for (const i of instances.value) m = Math.max(m, zNum(i.z))
  return m === -Infinity ? 0 : m
}

function geometryKind(def?: FigureDefinition): string {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return ''
  const k = (g as any).kind
  return typeof k === 'string' ? k : ''
}

function polygonPoints(def?: FigureDefinition): string {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return ''
  const pts = (g as any).points
  if (!Array.isArray(pts)) return ''
  // SVG points: "x,y x,y ..."
  return pts
    .map((p: unknown) => {
      if (!Array.isArray(p) || p.length < 2) return ''
      const x = Number(p[0])
      const y = Number(p[1])
      if (!Number.isFinite(x) || !Number.isFinite(y)) return ''
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')
}

function starPoints(points: number, innerRatio: number | undefined): string {
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

function arrowHeadPoints(x: number, y: number, angleRad: number, headLen: number, headWidth: number): string {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  // base triangle around direction vector, oriented to the line
  const bx1 = x - headLen * cos + headWidth * sin
  const by1 = y - headLen * sin - headWidth * cos
  const bx2 = x - headLen * cos - headWidth * sin
  const by2 = y - headLen * sin + headWidth * cos
  return `${x},${y} ${bx1},${by1} ${bx2},${by2}`
}

function headLenFor(inst: FigureInstance): number {
  const w = strokeWidthFor(inst)
  return 8 + w * 0.8
}

function headWidthFor(inst: FigureInstance): number {
  const w = strokeWidthFor(inst)
  return 5 + w * 0.35
}

function angleRad(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

function arrowHeadPointsEnd(inst: FigureInstance, x1: number, y1: number, x2: number, y2: number): string {
  const a = angleRad(x1, y1, x2, y2)
  const w = strokeWidthFor(inst)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= 1e-6 || !w) return arrowHeadPoints(x2, y2, a, headLenFor(inst), headWidthFor(inst))

  // Учитываем round linecap: визуальная “точка” конца смещается на ~w/2.
  // Сдвигаем наконечник стрелки внутрь вдоль направления линии.
  const ux = dx / len
  const uy = dy / len
  const tipX = x2 - ux * (w / 2)
  const tipY = y2 - uy * (w / 2)
  return arrowHeadPoints(tipX, tipY, a, headLenFor(inst), headWidthFor(inst))
}

function arrowHeadPointsStart(inst: FigureInstance, x1: number, y1: number, x2: number, y2: number): string {
  // Стартовая стрелка рисуется "на начало", т.е. направление x1<-x2 (инверсия).
  const a = angleRad(x2, y2, x1, y1)
  const w = strokeWidthFor(inst)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= 1e-6 || !w) return arrowHeadPoints(x1, y1, a, headLenFor(inst), headWidthFor(inst))

  // Аналогично сдвиг внутрь относительно round linecap.
  const ux = dx / len
  const uy = dy / len
  const tipX = x1 - ux * (w / 2)
  const tipY = y1 - uy * (w / 2)
  return arrowHeadPoints(tipX, tipY, a, headLenFor(inst), headWidthFor(inst))
}

function rectRx(def?: FigureDefinition): number {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return 0
  const rx = (g as any).rx
  return typeof rx === 'number' && Number.isFinite(rx) ? rx : 0
}

function ellipseParams(def?: FigureDefinition): { cx: number; cy: number; rx: number; ry: number } {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return { cx: 50, cy: 50, rx: 50, ry: 50 }
  const cx = Number((g as any).cx ?? 50)
  const cy = Number((g as any).cy ?? 50)
  const r = Number((g as any).r ?? NaN)
  const rx = Number((g as any).rx ?? (Number.isFinite(r) ? r : 50))
  const ry = Number((g as any).ry ?? (Number.isFinite(r) ? r : 50))
  return {
    cx: Number.isFinite(cx) ? cx : 50,
    cy: Number.isFinite(cy) ? cy : 50,
    rx: Number.isFinite(rx) ? rx : 50,
    ry: Number.isFinite(ry) ? ry : 50,
  }
}

function gradId(inst: FigureInstance): string {
  return `grad_${inst.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function shadowId(inst: FigureInstance): string {
  return `shadow_${inst.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function fillFor(inst: FigureInstance): string {
  const fill = inst.style?.fill
  if (!fill || typeof fill !== 'object') return 'none'
  if (fill.type === 'none') return 'none'
  if (fill.type === 'solid') return (fill as any).color ?? '#000'
  if (fill.type === 'linear') return `url(#${gradId(inst)})`
  return 'none'
}

function strokeFor(inst: FigureInstance): string {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return 'none'
  if (!stroke.enabled) return 'none'
  return (stroke as any).color ?? '#111827'
}

function strokeWidthFor(inst: FigureInstance): number {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return 0
  if (!stroke.enabled) return 0
  const w = Number((stroke as any).width ?? 2)
  return Number.isFinite(w) ? Math.max(0, w) : 0
}

function strokeDashFor(inst: FigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  const dash = String((stroke as any).dash ?? 'solid')
  if (dash === 'solid') return undefined
  if (dash === 'dashed') return '6 4'
  if (dash === 'dotted') return '2 3'
  return undefined
}

function strokeLinecapFor(inst: FigureInstance): 'round' | 'butt' | 'square' | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as any).linecap ?? 'round') as 'round' | 'butt' | 'square'
}

function strokeLinejoinFor(inst: FigureInstance): 'miter' | 'round' | 'bevel' | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as any).linejoin ?? 'miter') as 'miter' | 'round' | 'bevel'
}

function shadowFilterFor(inst: FigureInstance): string | undefined {
  const shadow = inst.style?.shadow
  if (!shadow || typeof shadow !== 'object') return undefined
  if (!shadow.enabled) return undefined
  return `url(#${shadowId(inst)})`
}

function linearGradientVector(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
  // 0deg => слева направо, 90deg => снизу вверх
  const a = (angleDeg * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const x1 = 50 - dx * 50
  const y1 = 50 - dy * 50
  const x2 = 50 + dx * 50
  const y2 = 50 + dy * 50
  return {
    x1: clamp(x1, 0, 100),
    y1: clamp(y1, 0, 100),
    x2: clamp(x2, 0, 100),
    y2: clamp(y2, 0, 100),
  }
}

function curvedConnectorPathD(inst: FigureInstance): string {
  const def = props.figuresById[inst.figureId]
  const g = (def?.geometry as any) ?? {}

  const x1 = Number(g.x1 ?? 0)
  const y1 = Number(g.y1 ?? 0)
  const x2 = Number(g.x2 ?? 100)
  const y2 = Number(g.y2 ?? 100)

  // Defaults roughly interpolate control points.
  const c1x = Number(g.c1x ?? (x1 + x2) / 3)
  const c1y = Number(g.c1y ?? y1)
  const c2x = Number(g.c2x ?? (2 * x1 + x2) / 3)
  const c2y = Number(g.c2y ?? y2)

  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
}

type DragMode =
  | { mode: 'move'; instance: FigureInstance }
  | { mode: 'resize'; instance: FigureInstance; handle: 'tl' | 'tr' | 'bl' | 'br' }
  | { mode: 'rotate'; instance: FigureInstance }
  | null
const drag = reactive({
  mode: null as DragMode,
  startClientX: 0,
  startClientY: 0,
  rectW: 1,
  rectH: 1,
  startX: 0,
  startY: 0,
  startW: 0,
  startH: 0,
  startRotation: 0,
  startAngleDeg: 0,
  centerClientX: 0,
  centerClientY: 0,
})

function bringToFront(instance: FigureInstance) {
  const max = maxZ()
  instance.z = max + 1
}

function beginMove(instance: FigureInstance, e: PointerEvent) {
  if (!props.enabled) return
  bringToFront(instance)
  emit('select', instance.id)

  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect) return

  drag.mode = { mode: 'move', instance }
  drag.startClientX = e.clientX
  drag.startClientY = e.clientY
  drag.rectW = rect.width || 1
  drag.rectH = rect.height || 1
  drag.startX = instance.x ?? 0
  drag.startY = instance.y ?? 0
  drag.startW = instance.w ?? 0
  drag.startH = instance.h ?? 0

  startGlobalListeners()
}

function beginResize(instance: FigureInstance, handle: 'tl' | 'tr' | 'bl' | 'br', e: PointerEvent) {
  if (!props.enabled) return
  bringToFront(instance)
  emit('select', instance.id)

  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect) return

  drag.mode = { mode: 'resize', instance, handle }
  drag.startClientX = e.clientX
  drag.startClientY = e.clientY
  drag.rectW = rect.width || 1
  drag.rectH = rect.height || 1
  drag.startX = instance.x ?? 0
  drag.startY = instance.y ?? 0
  drag.startW = instance.w ?? 0
  drag.startH = instance.h ?? 0

  startGlobalListeners()
}

function pointerAngleDeg(cx: number, cy: number, px: number, py: number): number {
  const dx = px - cx
  const dy = py - cy
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

function beginRotate(instance: FigureInstance, e: PointerEvent) {
  if (!props.enabled) return
  bringToFront(instance)
  emit('select', instance.id)

  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect) return

  const instX = Number(instance.x ?? 0)
  const instY = Number(instance.y ?? 0)
  const instW = Number(instance.w ?? 0)
  const instH = Number(instance.h ?? 0)

  // Центр фигуры в координатах окна (client).
  const centerClientX = rect.left + ((instX + instW / 2) / 100) * rect.width
  const centerClientY = rect.top + ((instY + instH / 2) / 100) * rect.height

  const startAngleDeg = pointerAngleDeg(centerClientX, centerClientY, e.clientX, e.clientY)

  drag.mode = { mode: 'rotate', instance }
  drag.centerClientX = centerClientX
  drag.centerClientY = centerClientY
  drag.startRotation = Number(instance.rotation ?? 0)
  drag.startAngleDeg = startAngleDeg

  startGlobalListeners()
}

function onPointerMove(e: PointerEvent) {
  if (!drag.mode) return

  if (drag.mode.mode === 'rotate') {
    const inst = drag.mode.instance
    const currentAngleDeg = pointerAngleDeg(drag.centerClientX, drag.centerClientY, e.clientX, e.clientY)

    let next = drag.startRotation + (currentAngleDeg - drag.startAngleDeg)
    // Нормализуем 0..360
    next = ((next % 360) + 360) % 360
    inst.rotation = next
    return
  }

  const dxPct = ((e.clientX - drag.startClientX) / drag.rectW) * 100
  const dyPct = ((e.clientY - drag.startClientY) / drag.rectH) * 100

  const inst = drag.mode.instance
  const MIN = 2

  if (drag.mode.mode === 'move') {
    let newX = clamp(drag.startX + dxPct, 0, 100 - drag.startW)
    let newY = clamp(drag.startY + dyPct, 0, 100 - drag.startH)

    if (editorGridCfg.value.snap) {
      const step = editorGridCfg.value.stepPct
      newX = Math.round(newX / step) * step
      newY = Math.round(newY / step) * step
      newX = clamp(newX, 0, 100 - drag.startW)
      newY = clamp(newY, 0, 100 - drag.startH)
    }

    inst.x = newX
    inst.y = newY
    return
  }

  // resize
  let newX = drag.startX
  let newY = drag.startY
  let newW = drag.startW
  let newH = drag.startH

  switch (drag.mode.handle) {
    case 'tl':
      newX = drag.startX + dxPct
      newY = drag.startY + dyPct
      newW = drag.startW - dxPct
      newH = drag.startH - dyPct
      break
    case 'tr':
      newY = drag.startY + dyPct
      newW = drag.startW + dxPct
      newH = drag.startH - dyPct
      break
    case 'bl':
      newX = drag.startX + dxPct
      newW = drag.startW - dxPct
      newH = drag.startH + dyPct
      break
    case 'br':
      newW = drag.startW + dxPct
      newH = drag.startH + dyPct
      break
  }

  if (editorGridCfg.value.snap) {
    const step = editorGridCfg.value.stepPct
    newX = Math.round(newX / step) * step
    newY = Math.round(newY / step) * step
    newW = Math.round(newW / step) * step
    newH = Math.round(newH / step) * step
  }

  newW = clamp(newW, MIN, 100)
  newH = clamp(newH, MIN, 100)
  newX = clamp(newX, 0, 100 - newW)
  newY = clamp(newY, 0, 100 - newH)

  inst.x = newX
  inst.y = newY
  inst.w = newW
  inst.h = newH
}

function onPointerUp() {
  drag.mode = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

watchEffect(() => {
  if (!props.enabled) drag.mode = null
})

function startGlobalListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
</script>

<template>
  <div
    ref="rootRef"
    class="figures-overlay-root"
    :style="outerStyle"
  >
    <div
      v-for="inst in instances"
      :key="inst.id"
      class="figure-instance"
      :style="{
        left: `${inst.x}%`,
        top: `${inst.y}%`,
        width: `${inst.w}%`,
        height: `${inst.h}%`,
        zIndex: zNum(inst.z),
        pointerEvents: enabled ? 'auto' : 'none',
      }"
      @pointerdown.stop.prevent="beginMove(inst, $event)"
      role="button"
      aria-label="Фигура"
    >
      <!-- SVG: геометрия + заливка/градиент/тень -->
      <svg
        class="block h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            v-if="inst.style?.fill?.type === 'linear'"
            :id="gradId(inst)"
            :x1="linearGradientVector(inst.style.fill.angle).x1"
            :y1="linearGradientVector(inst.style.fill.angle).y1"
            :x2="linearGradientVector(inst.style.fill.angle).x2"
            :y2="linearGradientVector(inst.style.fill.angle).y2"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" :stop-color="inst.style.fill.from" />
            <stop offset="100%" :stop-color="inst.style.fill.to" />
          </linearGradient>

          <filter
            v-if="inst.style?.shadow?.enabled"
            :id="shadowId(inst)"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              :dx="inst.style.shadow.offsetX"
              :dy="inst.style.shadow.offsetY"
              :stdDeviation="inst.style.shadow.blur"
              :flood-color="inst.style.shadow.color"
              :flood-opacity="inst.style.shadow.opacity"
            />
          </filter>
        </defs>

        <g :transform="inst.rotation != null ? `rotate(${inst.rotation} 50 50)` : undefined">
          <template v-if="['rect','roundedRect'].includes(geometryKind(figuresById[inst.figureId]))">
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              :rx="rectRx(figuresById[inst.figureId])"
              :ry="rectRx(figuresById[inst.figureId])"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="['ellipse','circle'].includes(geometryKind(figuresById[inst.figureId]))">
            <ellipse
              :cx="ellipseParams(figuresById[inst.figureId]).cx"
              :cy="ellipseParams(figuresById[inst.figureId]).cy"
              :rx="ellipseParams(figuresById[inst.figureId]).rx"
              :ry="ellipseParams(figuresById[inst.figureId]).ry"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'polygon'">
            <polygon
              :points="polygonPoints(figuresById[inst.figureId])"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'star'">
            <polygon
              :points="starPoints((figuresById[inst.figureId].geometry as any).points, (figuresById[inst.figureId].geometry as any).innerRatio)"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'path'">
            <path
              :d="(figuresById[inst.figureId].geometry as any).d"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'line'">
            <template v-if="inst.style?.stroke?.enabled">
              <line
                :x1="(figuresById[inst.figureId].geometry as any).x1"
                :y1="(figuresById[inst.figureId].geometry as any).y1"
                :x2="(figuresById[inst.figureId].geometry as any).x2"
                :y2="(figuresById[inst.figureId].geometry as any).y2"
                :stroke="strokeFor(inst)"
                :stroke-width="strokeWidthFor(inst)"
                :stroke-dasharray="strokeDashFor(inst)"
                :stroke-linecap="strokeLinecapFor(inst)"
                :filter="shadowFilterFor(inst)"
              />

              <polygon
                v-if="(figuresById[inst.figureId].geometry as any).head === 'end' || (figuresById[inst.figureId].geometry as any).head === 'both'"
                :points="arrowHeadPointsEnd(inst,
                  (figuresById[inst.figureId].geometry as any).x1,
                  (figuresById[inst.figureId].geometry as any).y1,
                  (figuresById[inst.figureId].geometry as any).x2,
                  (figuresById[inst.figureId].geometry as any).y2
                )"
                :fill="strokeFor(inst)"
                :stroke="strokeFor(inst)"
                :stroke-width="0"
                :filter="shadowFilterFor(inst)"
              />

              <polygon
                v-if="(figuresById[inst.figureId].geometry as any).head === 'both'"
                :points="arrowHeadPointsStart(inst,
                  (figuresById[inst.figureId].geometry as any).x1,
                  (figuresById[inst.figureId].geometry as any).y1,
                  (figuresById[inst.figureId].geometry as any).x2,
                  (figuresById[inst.figureId].geometry as any).y2
                )"
                :fill="strokeFor(inst)"
                :stroke="strokeFor(inst)"
                :stroke-width="0"
                :filter="shadowFilterFor(inst)"
              />
            </template>
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'polyline' || geometryKind(figuresById[inst.figureId]) === 'scribble'">
            <polyline
              :points="(figuresById[inst.figureId].geometry as any).points?.map((p: number[]) => `${p[0]},${p[1]}`).join(' ')"
              :fill="fillFor(inst)"
              :stroke="strokeFor(inst)"
              :stroke-width="strokeWidthFor(inst)"
              :stroke-dasharray="strokeDashFor(inst)"
              :stroke-linecap="strokeLinecapFor(inst)"
              :stroke-linejoin="strokeLinejoinFor(inst)"
              :filter="shadowFilterFor(inst)"
            />
          </template>

          <template v-else-if="geometryKind(figuresById[inst.figureId]) === 'connector'">
            <template v-if="geometryKind(figuresById[inst.figureId]) === 'connector'">
              <!-- Основная линия соединителя -->
              <template v-if="(figuresById[inst.figureId].geometry as any).mode === 'straight'">
                <line
                  :x1="(figuresById[inst.figureId].geometry as any).x1"
                  :y1="(figuresById[inst.figureId].geometry as any).y1"
                  :x2="(figuresById[inst.figureId].geometry as any).x2"
                  :y2="(figuresById[inst.figureId].geometry as any).y2"
                  :stroke="strokeFor(inst)"
                  :stroke-width="strokeWidthFor(inst)"
                  :stroke-dasharray="strokeDashFor(inst)"
                  :stroke-linecap="strokeLinecapFor(inst)"
                  :filter="shadowFilterFor(inst)"
                />
              </template>

              <template v-else-if="(figuresById[inst.figureId].geometry as any).mode === 'elbow'">
                <polyline
                  :points="`${(figuresById[inst.figureId].geometry as any).x1},${(figuresById[inst.figureId].geometry as any).y1} ${(figuresById[inst.figureId].geometry as any).elbowMidX ?? ((figuresById[inst.figureId].geometry as any).x1 + (figuresById[inst.figureId].geometry as any).x2)/2},${(figuresById[inst.figureId].geometry as any).elbowMidY ?? (figuresById[inst.figureId].geometry as any).y1} ${(figuresById[inst.figureId].geometry as any).x2},${(figuresById[inst.figureId].geometry as any).y2}`"
                  :fill="fillFor(inst)"
                  :stroke="strokeFor(inst)"
                  :stroke-width="strokeWidthFor(inst)"
                  :stroke-dasharray="strokeDashFor(inst)"
                  :stroke-linecap="strokeLinecapFor(inst)"
                  :stroke-linejoin="strokeLinejoinFor(inst)"
                  :filter="shadowFilterFor(inst)"
                />
              </template>

              <template v-else-if="(figuresById[inst.figureId].geometry as any).mode === 'curved'">
                <path
                  :d="curvedConnectorPathD(inst)"
                  :fill="'none'"
                  :stroke="strokeFor(inst)"
                  :stroke-width="strokeWidthFor(inst)"
                  :stroke-dasharray="strokeDashFor(inst)"
                  :stroke-linecap="strokeLinecapFor(inst)"
                  :stroke-linejoin="strokeLinejoinFor(inst)"
                  :filter="shadowFilterFor(inst)"
                />
              </template>

              <!-- Arrowheads -->
              <template v-if="(figuresById[inst.figureId].geometry as any).head === 'end' || (figuresById[inst.figureId].geometry as any).head === 'both'">
                <polygon
                  :points="arrowHeadPointsEnd(inst,
                    (figuresById[inst.figureId].geometry as any).x1,
                    (figuresById[inst.figureId].geometry as any).y1,
                    (figuresById[inst.figureId].geometry as any).x2,
                    (figuresById[inst.figureId].geometry as any).y2
                  )"
                  :fill="strokeFor(inst)"
                  :stroke="strokeFor(inst)"
                  :stroke-width="0"
                  :filter="shadowFilterFor(inst)"
                />
              </template>
              <template v-if="(figuresById[inst.figureId].geometry as any).head === 'both'">
                <polygon
                  :points="arrowHeadPointsStart(inst,
                    (figuresById[inst.figureId].geometry as any).x1,
                    (figuresById[inst.figureId].geometry as any).y1,
                    (figuresById[inst.figureId].geometry as any).x2,
                    (figuresById[inst.figureId].geometry as any).y2
                  )"
                  :fill="strokeFor(inst)"
                  :stroke="strokeFor(inst)"
                  :stroke-width="0"
                  :filter="shadowFilterFor(inst)"
                />
              </template>
            </template>
          </template>

        </g>
      </svg>

      <!-- UI выделения -->
      <template v-if="enabled && selected && selected.id === inst.id">
        <div
          class="absolute inset-0 rounded border-2 border-brand-500/90 bg-transparent"
          style="pointer-events: none;"
        />

        <!-- Trash icon: удаление фигуры рядом с ней -->
        <button
          type="button"
          class="absolute right-1 top-1 z-[3] inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white/90 text-red-600 hover:bg-red-50 dark:border-red-900/40"
          style="pointer-events: auto;"
          aria-label="Удалить фигуру"
          @click.stop.prevent="emit('delete', inst.id)"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <!-- Rotation handle (PowerPoint style) -->
        <div
          class="absolute left-1/2 -top-[18px] z-[3] h-[10px] w-[10px] -translate-x-1/2 cursor-grab rounded-full border border-brand-500 bg-white shadow-theme-xs"
          style="pointer-events: auto;"
          @pointerdown.stop.prevent="beginRotate(inst, $event)"
        />

        <!-- TL -->
        <div
          class="absolute -left-[4px] -top-[4px] h-[8px] w-[8px] cursor-nwse-resize rounded-full border border-white bg-brand-500"
          style="pointer-events: auto;"
          @pointerdown.stop.prevent="beginResize(inst, 'tl', $event)"
        />
        <!-- TR -->
        <div
          class="absolute -right-[4px] -top-[4px] h-[8px] w-[8px] cursor-nesw-resize rounded-full border border-white bg-brand-500"
          style="pointer-events: auto;"
          @pointerdown.stop.prevent="beginResize(inst, 'tr', $event)"
        />
        <!-- BL -->
        <div
          class="absolute -left-[4px] -bottom-[4px] h-[8px] w-[8px] cursor-nesw-resize rounded-full border border-white bg-brand-500"
          style="pointer-events: auto;"
          @pointerdown.stop.prevent="beginResize(inst, 'bl', $event)"
        />
        <!-- BR -->
        <div
          class="absolute -right-[4px] -bottom-[4px] h-[8px] w-[8px] cursor-nwse-resize rounded-full border border-white bg-brand-500"
          style="pointer-events: auto;"
          @pointerdown.stop.prevent="beginResize(inst, 'br', $event)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.figure-instance {
  position: absolute;
  overflow: visible;
}
</style>

