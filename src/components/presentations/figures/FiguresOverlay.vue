<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Konva from 'konva'
import type { FigureDefinition, FigureInstance } from '@/types/figures'
import { buildFigureContentGroup } from '@/utils/konvaFigureShapes'

type SlideLike = {
  id?: string
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
  (e: 'layerMove', payload: { id: string; delta: number; slideId?: string }): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const stageHostRef = ref<HTMLDivElement | null>(null)

let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let resizeObserver: ResizeObserver | null = null

/** Блокирует полную пересборку слоя во время drag / resize / rotate и клика по фигуре. */
const interactionLock = ref(false)

function beginInteraction() {
  interactionLock.value = true
}

function endInteraction() {
  if (!interactionLock.value) return
  interactionLock.value = false
  layer?.batchDraw()
}

function getInstances(): FigureInstance[] {
  const data = props.slide.data as Record<string, unknown> | undefined
  const arr = data?.figures
  return Array.isArray(arr) ? (arr as FigureInstance[]) : []
}

const instances = computed(() => {
  const arr = getInstances()
  return [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
})

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

const editorGridCfg = computed(() => {
  const g = (props.slide.data as Record<string, unknown> | undefined)?.editorGrid as
    | Record<string, unknown>
    | undefined
  const enabled = Boolean(g?.enabled)
  const stepPctRaw = g?.stepPct == null ? 5 : Number(g.stepPct)
  const stepPct = clamp(stepPctRaw, 1, 25)
  const snap = enabled && (g?.snap == null ? true : Boolean(g.snap))
  return { enabled, stepPct, snap }
})

const outerStyle = computed(() => {
  const base: Record<string, string | number> = { position: 'absolute', inset: 0, pointerEvents: 'none' }
  if (!editorGridCfg.value.enabled) return base
  const alpha = 0.18
  return {
    ...base,
    backgroundImage: `linear-gradient(to right, rgba(37,99,235,${alpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,${alpha}) 1px, transparent 1px)`,
    backgroundSize: `${editorGridCfg.value.stepPct}% ${editorGridCfg.value.stepPct}%`,
  }
})

const selected = computed(() => {
  if (!props.selectedInstanceId) return null
  return instances.value.find((i) => i.id === props.selectedInstanceId) ?? null
})

function maxZ(): number {
  let m = -Infinity
  for (const i of instances.value) m = Math.max(m, zNum(i.z))
  return m === -Infinity ? 0 : m
}

function bringToFront(instance: FigureInstance) {
  instance.z = maxZ() + 1
  const id = instance.id
  const node = layer?.findOne((n: Konva.Node) => n.getAttr('figureInstanceId') === id)
  node?.moveToTop()
  layer?.batchDraw()
}

function fitStage() {
  const host = stageHostRef.value
  if (!stage || !host) return
  const w = Math.max(1, host.clientWidth)
  const h = Math.max(1, host.clientHeight)
  stage.width(w)
  stage.height(h)
  if (!interactionLock.value) rebuildLayer()
  else layer?.batchDraw()
}

function rebuildLayer() {
  if (!stage || !layer) return
  if (interactionLock.value) return

  stage.listening(props.enabled)

  const W = stage.width()
  const H = stage.height()
  layer.destroyChildren()

  for (const inst of instances.value) {
    const xPct = Number(inst.x ?? 0)
    const yPct = Number(inst.y ?? 0)
    const wPct = Number(inst.w ?? 0)
    const hPct = Number(inst.h ?? 0)
    const xPx = (xPct / 100) * W
    const yPx = (yPct / 100) * H
    const wPx = (wPct / 100) * W
    const hPx = (hPct / 100) * H

    const outer = new Konva.Group({
      x: xPx,
      y: yPx,
      draggable: props.enabled,
      figureInstanceId: inst.id,
    })

    const hitRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: Math.max(1, wPx),
      height: Math.max(1, hPx),
      fill: 'rgba(0,0,0,0.001)',
      listening: true,
    })

    // world = T · S_bbox · R_viewBox · p — как SVG: поворот в 0..100, затем растяжение под w×h px.
    const scaleInner = new Konva.Group({
      x: 0,
      y: 0,
      scaleX: wPx / 100,
      scaleY: hPx / 100,
      listening: false,
    })

    const rotInner = new Konva.Group({
      x: 50,
      y: 50,
      offsetX: 50,
      offsetY: 50,
      rotation: Number(inst.rotation ?? 0),
      listening: false,
    })

    const content = buildFigureContentGroup(inst, props.figuresById)
    rotInner.add(content)
    scaleInner.add(rotInner)
    outer.add(scaleInner)
    outer.add(hitRect)

    if (props.enabled) {
      outer.on('mousedown touchstart', (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        e.cancelBubble = true
        beginInteraction()
        bringToFront(inst)
        emit('select', inst.id)
        const end = () => {
          window.removeEventListener('mouseup', end)
          window.removeEventListener('touchend', end)
          window.removeEventListener('pointerup', end)
          endInteraction()
        }
        window.addEventListener('mouseup', end, { once: true })
        window.addEventListener('touchend', end, { once: true })
        window.addEventListener('pointerup', end, { once: true })
      })

      outer.on('click tap', (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        e.cancelBubble = true
      })

      outer.on('dragmove', () => {
        const nxPx = outer.x()
        const nyPx = outer.y()
        inst.x = (nxPx / W) * 100
        inst.y = (nyPx / H) * 100
      })

      outer.dragBoundFunc((pos) => {
        const wP = (Number(inst.w ?? 0) / 100) * W
        const hP = (Number(inst.h ?? 0) / 100) * H
        let nx = pos.x
        let ny = pos.y
        if (editorGridCfg.value.snap) {
          const stepX = (editorGridCfg.value.stepPct / 100) * W
          const stepY = (editorGridCfg.value.stepPct / 100) * H
          nx = Math.round(nx / stepX) * stepX
          ny = Math.round(ny / stepY) * stepY
        }
        nx = clamp(nx, 0, W - wP)
        ny = clamp(ny, 0, H - hP)
        return { x: nx, y: ny }
      })
    }

    layer.add(outer)
  }

  layer.batchDraw()
}

function resolveFigureIdFromNode(n: Konva.Node | null): string | null {
  let cur: Konva.Node | null = n
  while (cur) {
    const fid = cur.getAttr?.('figureInstanceId')
    if (fid) return fid as string
    cur = cur.getParent()
  }
  return null
}

function onStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
  const fromTarget = resolveFigureIdFromNode(e.target as Konva.Node)
  if (fromTarget) {
    emit('select', fromTarget)
    return
  }
  const st = stage
  const pos = st?.getPointerPosition()
  if (st && pos) {
    const hit = st.getIntersection(pos)
    const id = resolveFigureIdFromNode(hit)
    if (id) {
      emit('select', id)
      return
    }
  }
  emit('select', null)
}

onMounted(() => {
  const host = stageHostRef.value
  if (!host) return

  stage = new Konva.Stage({
    container: host,
    width: Math.max(1, host.clientWidth),
    height: Math.max(1, host.clientHeight),
  })
  layer = new Konva.Layer()
  stage.add(layer)
  stage.on('click tap', onStageClick)

  resizeObserver = new ResizeObserver(() => fitStage())
  resizeObserver.observe(host)

  rebuildLayer()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  stage?.destroy()
  stage = null
  layer = null
})

watch(
  () => [props.slide?.id, props.slide?.data?.figures, props.figuresById, props.enabled],
  () => {
    if (interactionLock.value) return
    rebuildLayer()
  },
  { deep: true },
)

watch(
  () => props.selectedInstanceId,
  () => {
    layer?.batchDraw()
  },
)

type DragMode =
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

function pointerAngleDeg(cx: number, cy: number, px: number, py: number): number {
  const dx = px - cx
  const dy = py - cy
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

function beginResize(instance: FigureInstance, handle: 'tl' | 'tr' | 'bl' | 'br', e: PointerEvent) {
  if (!props.enabled) return
  beginInteraction()
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

function beginRotate(instance: FigureInstance, e: PointerEvent) {
  if (!props.enabled) return
  beginInteraction()
  bringToFront(instance)
  emit('select', instance.id)

  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect) return

  const instX = Number(instance.x ?? 0)
  const instY = Number(instance.y ?? 0)
  const instW = Number(instance.w ?? 0)
  const instH = Number(instance.h ?? 0)

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
    next = ((next % 360) + 360) % 360
    inst.rotation = next
    syncFigureRotationInLayer(inst)
    return
  }

  const dxPct = ((e.clientX - drag.startClientX) / drag.rectW) * 100
  const dyPct = ((e.clientY - drag.startClientY) / drag.rectH) * 100

  const inst = drag.mode.instance
  const MIN = 2

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
  syncFigureBoundsInLayer(inst)
}

function syncFigureBoundsInLayer(inst: FigureInstance) {
  if (!stage || !layer) return
  const W = stage.width()
  const H = stage.height()
  const node = layer.findOne((n: Konva.Node) => n.getAttr('figureInstanceId') === inst.id) as Konva.Group | null
  if (!node) return
  const xPx = ((inst.x ?? 0) / 100) * W
  const yPx = ((inst.y ?? 0) / 100) * H
  const wPx = ((inst.w ?? 0) / 100) * W
  const hPx = ((inst.h ?? 0) / 100) * H
  node.x(xPx)
  node.y(yPx)
  const scaleInner = node.getChildren()[0] as Konva.Group
  const hitRect = node.getChildren()[1] as Konva.Rect
  if (scaleInner) {
    scaleInner.scaleX(wPx / 100)
    scaleInner.scaleY(hPx / 100)
  }
  if (hitRect) {
    hitRect.width(Math.max(1, wPx))
    hitRect.height(Math.max(1, hPx))
  }
  layer.batchDraw()
}

function syncFigureRotationInLayer(inst: FigureInstance) {
  if (!stage || !layer) return
  const node = layer.findOne((n: Konva.Node) => n.getAttr('figureInstanceId') === inst.id) as Konva.Group | null
  if (!node) return
  const scaleInner = node.getChildren()[0] as Konva.Group
  const rotInner = scaleInner?.getChildren()?.[0] as Konva.Group | null
  if (rotInner) rotInner.rotation(Number(inst.rotation ?? 0))
  layer.batchDraw()
}

function onPointerUp() {
  drag.mode = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  endInteraction()
}

function startGlobalListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}
</script>

<template>
  <div ref="rootRef" class="figures-overlay-root" :style="outerStyle">
    <div
      ref="stageHostRef"
      class="figures-konva-host absolute inset-0 z-[1]"
      :style="{ pointerEvents: enabled ? 'auto' : 'none' }"
    />

    <div
      v-if="enabled && selected"
      class="figure-selection-ui pointer-events-none absolute z-[2]"
      :style="{
        left: `${selected.x}%`,
        top: `${selected.y}%`,
        width: `${selected.w}%`,
        height: `${selected.h}%`,
        zIndex: zNum(selected.z) + 2,
      }"
    >
          <div class="pointer-events-none absolute inset-0 rounded border-2 border-brand-500/90 bg-transparent" />

          <div class="absolute right-1 top-1 z-[3] flex flex-col gap-1" style="pointer-events: auto">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-200"
              title="Слой выше"
              aria-label="Слой выше"
              @pointerdown.stop
              @click.stop.prevent="emit('layerMove', { id: selected.id, delta: 1, slideId: props.slide.id })"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5l7 7H5l7-7z" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white/90 text-red-600 hover:bg-red-50 dark:border-red-900/40"
              title="Удалить"
              aria-label="Удалить фигуру"
              @pointerdown.stop
              @click.stop.prevent="emit('delete', selected.id)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-200"
              title="Слой ниже"
              aria-label="Слой ниже"
              @pointerdown.stop
              @click.stop.prevent="emit('layerMove', { id: selected.id, delta: -1, slideId: props.slide.id })"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l-7-7h14l-7 7z" />
              </svg>
            </button>
          </div>

          <div
            class="absolute left-1/2 -top-[18px] z-[3] h-[10px] w-[10px] -translate-x-1/2 cursor-grab rounded-full border border-brand-500 bg-white shadow-theme-xs"
            style="pointer-events: auto"
            @pointerdown.stop.prevent="beginRotate(selected, $event)"
          />

          <div
            class="absolute -left-[4px] -top-[4px] h-[8px] w-[8px] cursor-nwse-resize rounded-full border border-white bg-brand-500"
            style="pointer-events: auto"
            @pointerdown.stop.prevent="beginResize(selected, 'tl', $event)"
          />
          <div
            class="absolute -right-[4px] -top-[4px] h-[8px] w-[8px] cursor-nesw-resize rounded-full border border-white bg-brand-500"
            style="pointer-events: auto"
            @pointerdown.stop.prevent="beginResize(selected, 'tr', $event)"
          />
          <div
            class="absolute -left-[4px] -bottom-[4px] h-[8px] w-[8px] cursor-nesw-resize rounded-full border border-white bg-brand-500"
            style="pointer-events: auto"
            @pointerdown.stop.prevent="beginResize(selected, 'bl', $event)"
          />
          <div
            class="absolute -right-[4px] -bottom-[4px] h-[8px] w-[8px] cursor-nwse-resize rounded-full border border-white bg-brand-500"
            style="pointer-events: auto"
            @pointerdown.stop.prevent="beginResize(selected, 'br', $event)"
          />
    </div>
  </div>
</template>

<style scoped>
.figure-selection-ui {
  overflow: visible;
}
</style>
