<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Konva from 'konva'
import type { FigureDefinition, FigureInstance } from '@/types/figures'
import { buildFigureContentGroup } from '@/utils/konvaFigureShapes'
import { normalizeFigureBlockId, SLIDE_WIDE_BLOCK_ID } from '@/utils/figureBlockScopes'

type SlideLike = {
  id?: string
  data?: Record<string, unknown>
}

const props = withDefaults(
  defineProps<{
    slide: SlideLike
    figuresById: Record<string, FigureDefinition>
    selectedInstanceId: string | null
    enabled: boolean
    /** Область шаблона: совпадает с data-editor-block; координаты фигур — % от этой области */
    figureBlockScope?: string
    /**
     * Редактор /dashboard/admin/slides: три слоя (фон → Konva → HTML-контент).
     * z-index canvas не ниже слоя фона и может быть выше слоя контента при большом z фигуры.
     */
    editorLayerStack?: boolean
  }>(),
  { figureBlockScope: SLIDE_WIDE_BLOCK_ID, editorLayerStack: false },
)

const emit = defineEmits<{
  (e: 'select', id: string | null): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<any>(null)
const layerRef = ref<any>(null)

/** Слой медиа слайда (--booklet-figure-media-z), обычно 5 — для расчёта z canvas фигур */
const mediaZResolved = ref(5)

/**
 * Оверлей позиционируется по [data-editor-block] (или .booklet-content), чтобы проценты Konva
 * совпадали с видимой областью блока без лишних отступов родителя.
 */
const contentBoxPx = ref({ left: 0, top: 0, width: 0, height: 0 })

function resolveScaleRootEl(): HTMLElement | null {
  if (!rootRef.value) return null
  const nearest = rootRef.value.closest('.booklet-scale-root') as HTMLElement | null
  if (nearest) return nearest
  const pageInner = rootRef.value.closest('.booklet-page__inner') as HTMLElement | null
  if (!pageInner) return null
  return pageInner.querySelector('.booklet-scale-root') as HTMLElement | null
}

function resolveBookletViewEl(scale: HTMLElement | null): HTMLElement | null {
  if (rootRef.value) {
    const nearest = rootRef.value.closest('.booklet-view') as HTMLElement | null
    if (nearest) return nearest
  }
  return scale?.closest('.booklet-view') as HTMLElement | null
}

function resolveAnchorEl(): HTMLElement | null {
  const scale = resolveScaleRootEl()
  if (!scale) return null
  const scope = normalizeFigureBlockId(props.figureBlockScope)
  // Для "всего слайда" используем сам scale-root как якорь,
  // чтобы Konva совпадала с видимой рабочей областью с учетом padding.
  if (scope === SLIDE_WIDE_BLOCK_ID) return scale
  const safe =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(scope)
      : scope.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const found = scale.querySelector(`[data-editor-block="${safe}"]`) as HTMLElement | null
  if (found) return found
  return (scale.querySelector('.booklet-content') as HTMLElement | null) ?? scale
}

function setContentBoxIfChanged(next: { left: number; top: number; width: number; height: number }) {
  const cur = contentBoxPx.value
  if (
    cur.left === next.left &&
    cur.top === next.top &&
    cur.width === next.width &&
    cur.height === next.height
  ) {
    return
  }
  contentBoxPx.value = next
}

function syncContentBoxFromScaleRoot() {
  const zero = { left: 0, top: 0, width: 0, height: 0 }
  if (typeof window === 'undefined' || !rootRef.value) {
    setContentBoxIfChanged(zero)
    return
  }
  const pageInner = rootRef.value.closest('.booklet-page__inner') as HTMLElement | null
  const anchor = resolveAnchorEl()
  if (!anchor || !pageInner) {
    setContentBoxIfChanged(zero)
    return
  }
  const ar = anchor.getBoundingClientRect()
  const pr = pageInner.getBoundingClientRect()
  const cs = getComputedStyle(anchor)
  const padL = Number.parseFloat(cs.paddingLeft || '0') || 0
  const padT = Number.parseFloat(cs.paddingTop || '0') || 0
  const padR = Number.parseFloat(cs.paddingRight || '0') || 0
  const padB = Number.parseFloat(cs.paddingBottom || '0') || 0
  const innerW = Math.max(1, Math.round(ar.width - padL - padR))
  const innerH = Math.max(1, Math.round(ar.height - padT - padB))
  setContentBoxIfChanged({
    left: Math.round(ar.left - pr.left + padL),
    top: Math.round(ar.top - pr.top + padT),
    width: innerW,
    height: innerH,
  })
}

function syncFiguresCssVarsFromRoot() {
  if (typeof window === 'undefined' || !rootRef.value) return
  const scale = resolveScaleRootEl()
  const bookletView = resolveBookletViewEl(scale)
  const csScale = scale ? getComputedStyle(scale) : null
  const csBv = bookletView ? getComputedStyle(bookletView) : null

  const readZ = (key: string, fallback: number) => {
    const a = csScale?.getPropertyValue(key).trim() ?? ''
    const b = !a && csBv ? csBv.getPropertyValue(key).trim() : ''
    const raw = a || b
    if (raw === '') return fallback
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? Math.max(0, n) : fallback
  }

  mediaZResolved.value = readZ('--booklet-figure-media-z', 5)
  syncContentBoxFromScaleRoot()
}

/** Подписка на z фигур: один canvas — общий z-index; max(z) задаёт «глубину» относительно медиа слайда */
const figuresZStackSig = computed(() =>
  getInstances()
    .map((i) => `${i.id}:${zNum(i.z)}`)
    .sort()
    .join('|'),
)

const maxFigZForStack = computed(() => {
  void figuresZStackSig.value
  const arr = getInstances()
  if (arr.length === 0) return 0
  return Math.max(...arr.map((i) => zNum(i.z)))
})

/** Слой HTML-контента в режиме editorLayerStack (между фоном и «верхом» стека) */
const EDITOR_CONTENT_LAYER_Z = 20
const EDITOR_KONVA_BASE_Z = 10

/**
 * z-index слоя Konva: ниже --booklet-figure-media-z при малом z модели (фигура под картинкой).
 * Формула: maxFigZ + mediaZ - 3 (при media=5: z=0→2, z=4→6 выше медиа).
 * В editorLayerStack: Konva между фоном и контентом (10–19) или выше контента (21+), не ниже фона.
 */
const konvaStackZ = computed(() => {
  const kz = maxFigZForStack.value
  if (props.editorLayerStack) {
    if (kz <= 4) return clamp(EDITOR_KONVA_BASE_Z + kz, EDITOR_KONVA_BASE_Z, EDITOR_CONTENT_LAYER_Z - 1)
    return clamp(EDITOR_CONTENT_LAYER_Z + 1 + (kz - 5), EDITOR_CONTENT_LAYER_Z + 1, 99)
  }
  return clamp(kz + mediaZResolved.value - 3, 1, 99)
})

let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let transformer: Konva.Transformer | null = null
let resizeObserver: ResizeObserver | null = null

function bindResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return
  const anchor = resolveAnchorEl()
  resizeObserver = new ResizeObserver(() => {
    syncFiguresCssVarsFromRoot()
    fitStage()
  })
  if (anchor) resizeObserver.observe(anchor)
  if (rootRef.value) resizeObserver.observe(rootRef.value)
}

/** Блокирует rebuildLayer во время drag / transform и короткого «кликового» цикла по фигуре */
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
  if (!Array.isArray(arr)) return []
  const scope = normalizeFigureBlockId(props.figureBlockScope)
  return (arr as FigureInstance[]).filter((i) => normalizeFigureBlockId(i.blockId) === scope)
}

const instances = computed(() => {
  const arr = getInstances()
  return [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
})

function maxZ(): number {
  let m = -Infinity
  for (const i of getInstances()) m = Math.max(m, zNum(i.z))
  return m === -Infinity ? 0 : m
}

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

/**
 * AABB повёрнутого прямоугольника — как в Konva Limited Drag And Resize
 * https://konvajs.org/docs/sandbox/Limited_Drag_And_Resize.html
 */
function getCorner(pivotX: number, pivotY: number, diffX: number, diffY: number, angle: number) {
  const distance = Math.sqrt(diffX * diffX + diffY * diffY)
  angle += Math.atan2(diffY, diffX)
  return {
    x: pivotX + distance * Math.cos(angle),
    y: pivotY + distance * Math.sin(angle),
  }
}

function rotatedBoxAabb(rotatedBox: {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}) {
  const { x, y, width, height, rotation } = rotatedBox
  // Поддержка как радиан, так и градусов (в Konva источники угла отличаются по API).
  const angleRad = Math.abs(rotation) > Math.PI * 2 ? (rotation * Math.PI) / 180 : rotation
  const p1 = getCorner(x, y, 0, 0, angleRad)
  const p2 = getCorner(x, y, width, 0, angleRad)
  const p3 = getCorner(x, y, width, height, angleRad)
  const p4 = getCorner(x, y, 0, height, angleRad)
  const minX = Math.min(p1.x, p2.x, p3.x, p4.x)
  const minY = Math.min(p1.y, p2.y, p3.y, p4.y)
  const maxX = Math.max(p1.x, p2.x, p3.x, p4.x)
  const maxY = Math.max(p1.y, p2.y, p3.y, p4.y)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** После drag/transform — подправить позицию, если AABB вылез за stage (не вызывать каждый dragmove — ломает перетаскивание) */
function clampOuterInsideStage(outer: Konva.Group) {
  if (!stage) return
  const W = stage.width()
  const H = stage.height()
  const hit = outer.findOne('.figureHit') as Konva.Rect | null
  if (!hit) return
  const wP = hit.width()
  const hP = hit.height()
  const aabb = rotatedBoxAabb({
    x: outer.x() - wP / 2,
    y: outer.y() - hP / 2,
    width: wP,
    height: hP,
    rotation: outer.rotation(),
  })
  let nx = outer.x()
  let ny = outer.y()
  if (aabb.x < 0) nx -= aabb.x
  if (aabb.y < 0) ny -= aabb.y
  if (aabb.x + aabb.width > W) nx -= aabb.x + aabb.width - W
  if (aabb.y + aabb.height > H) ny -= aabb.y + aabb.height - H
  outer.x(nx)
  outer.y(ny)
}

function snapRotationDeg(raw: number): number {
  const d = ((raw % 360) + 360) % 360
  const step = 10
  let s = Math.round(d / step) * step
  s = ((s % 360) + 360) % 360
  const axes = [0, 90, 180, 270]
  const tol = 4
  for (const a of axes) {
    const dist = Math.min(Math.abs(s - a), 360 - Math.abs(s - a))
    if (dist <= tol) return a
  }
  return s
}

function snapCenterWithEdgeMagnet(
  center: number,
  minCenter: number,
  maxCenter: number,
  step: number,
): number {
  const safeStep = Math.max(1e-6, step)
  const edgeTol = safeStep / 2
  const clamped = clamp(center, minCenter, maxCenter)
  if (Math.abs(clamped - minCenter) <= edgeTol) return minCenter
  if (Math.abs(maxCenter - clamped) <= edgeTol) return maxCenter
  return clamped
}

function devicePixelRatioClamped(): number {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, 2.5)
}

function isUnderTransformer(n: Konva.Node | null): boolean {
  let cur: Konva.Node | null = n
  while (cur) {
    if (cur instanceof Konva.Transformer) return true
    cur = cur.getParent()
  }
  return false
}

function reorderKonvaByZ(force = false) {
  if (!layer || (interactionLock.value && !force)) return
  const sorted = [...getInstances()].sort((a, b) => zNum(a.z) - zNum(b.z))
  const byId = new Map<string, Konva.Group>()
  for (const ch of layer.getChildren()) {
    if (ch instanceof Konva.Transformer) continue
    const id = (ch as Konva.Node).getAttr('figureInstanceId') as string | undefined
    if (id) byId.set(id, ch as Konva.Group)
  }
  const nodes = sorted.map((i) => byId.get(i.id)).filter(Boolean) as Konva.Group[]
  if (nodes.length === 0) return
  if (nodes.length !== sorted.length) {
    if (!interactionLock.value) rebuildLayer()
    return
  }
  for (const n of nodes) {
    n.remove()
  }
  for (const n of nodes) {
    layer.add(n)
  }
  transformer?.moveToTop()
  patchTransformerHitThrough()
  layer.batchDraw()
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

const figuresContentBoxStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${contentBoxPx.value.left}px`,
  top: `${contentBoxPx.value.top}px`,
  width: `${contentBoxPx.value.width}px`,
  height: `${contentBoxPx.value.height}px`,
  boxSizing: 'border-box' as const,
  margin: 0,
  padding: 0,
}))

const konvaWrapStyle = computed(() => {
  const base: Record<string, string | number> = {
    ...figuresContentBoxStyle.value,
    /* auto: весь блок как уровень hit; canvas внутри перехватывает события. none на родителе ломал цели в некоторых браузерах. */
    pointerEvents: 'auto',
    zIndex: konvaStackZ.value,
    isolation: 'isolate',
    touchAction: 'none',
  }
  if (!editorGridCfg.value.enabled) return base
  const alpha = 0.18
  return {
    ...base,
    backgroundImage: `linear-gradient(to right, rgba(37,99,235,${alpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,${alpha}) 1px, transparent 1px)`,
    backgroundSize: `${editorGridCfg.value.stepPct}% ${editorGridCfg.value.stepPct}%`,
  }
})

const stageHostStyle = computed(() => ({
  width: contentBoxPx.value.width,
  height: contentBoxPx.value.height,
  pointerEvents: props.enabled ? ('auto' as const) : ('none' as const),
  touchAction: props.enabled ? ('none' as const) : ('auto' as const),
}))

function bringToFront(instance: FigureInstance) {
  const mz = maxZ()
  const cur = zNum(instance.z)
  if (cur < mz) instance.z = mz + 1
  const id = instance.id
  const node = layer?.findOne((n: Konva.Node) => n.getAttr('figureInstanceId') === id)
  node?.moveToTop()
  transformer?.moveToTop()
  layer?.batchDraw()
}

function syncInstancePositionFromNode(outer: Konva.Group, inst: FigureInstance) {
  if (!stage) return
  const W = stage.width()
  const H = stage.height()
  const hit = outer.findOne('.figureHit') as Konva.Rect | null
  if (!hit) return
  const wPx = hit.width()
  const hPx = hit.height()
  const wPctEff = (wPx / W) * 100
  const hPctEff = (hPx / H) * 100
  inst.x = clamp(((outer.x() - wPx / 2) / W) * 100, 0, Math.max(0, 100 - wPctEff))
  inst.y = clamp(((outer.y() - hPx / 2) / H) * 100, 0, Math.max(0, 100 - hPctEff))
}

function resetFigureContentNode(content: Konva.Group) {
  content.x(0)
  content.y(0)
  content.scaleX(1)
  content.scaleY(1)
  content.rotation(0)
  content.offsetX(0)
  content.offsetY(0)
}

function applyInstanceBoundsToNode(outer: Konva.Group, inst: FigureInstance) {
  if (!stage) return
  const W = stage.width()
  const H = stage.height()
  const wPct = clamp(Number(inst.w ?? 0), 2, 100)
  const hPct = clamp(Number(inst.h ?? 0), 2, 100)
  const xPct = clamp(Number(inst.x ?? 0), 0, 100 - wPct)
  const yPct = clamp(Number(inst.y ?? 0), 0, 100 - hPct)
  inst.x = xPct
  inst.y = yPct
  inst.w = wPct
  inst.h = hPct

  const wPx = (wPct / 100) * W
  const hPx = (hPct / 100) * H
  const hit = outer.findOne('.figureHit') as Konva.Rect | null
  const figureContent = outer.findOne('.figureContent') as Konva.Group | null
  const scaleInner = figureContent?.findOne('.figureScale') as Konva.Group | null
  const rotInner = scaleInner?.findOne('.figureRotInner') as Konva.Group | null

  outer.x((xPct / 100) * W + wPx / 2)
  outer.y((yPct / 100) * H + hPx / 2)
  outer.offsetX(wPx / 2)
  outer.offsetY(hPx / 2)
  outer.rotation(Number(inst.rotation ?? 0))
  if (hit) {
    hit.width(Math.max(1, wPx))
    hit.height(Math.max(1, hPx))
  }
  if (scaleInner) {
    scaleInner.scaleX(wPx / 100)
    scaleInner.scaleY(hPx / 100)
  }
  if (rotInner) rotInner.rotation(0)
  if (figureContent) resetFigureContentNode(figureContent)
}

/** После transform: сброс figureContent; размеры из hit. Рамка Transformer = bbox геометрии (без искусственного 100×100). */
function syncInstanceFromTransformNode(outer: Konva.Group, figureContent: Konva.Group, inst: FigureInstance) {
  if (!stage) return
  const W = stage.width()
  const H = stage.height()
  const hit = outer.findOne('.figureHit') as Konva.Rect | null
  const scaleInner = figureContent.findOne('.figureScale') as Konva.Group | null
  if (!hit || !scaleInner) return

  const rExtra = figureContent.rotation()
  const sx = figureContent.scaleX()
  const sy = figureContent.scaleY()
  const wPx = hit.width() * sx
  const hPx = hit.height() * sy

  resetFigureContentNode(figureContent)

  hit.width(Math.max(1, wPx))
  hit.height(Math.max(1, hPx))
  outer.offsetX(wPx / 2)
  outer.offsetY(hPx / 2)
  scaleInner.scaleX(wPx / 100)
  scaleInner.scaleY(hPx / 100)

  inst.rotation = snapRotationDeg(outer.rotation() + rExtra)
  inst.w = (wPx / W) * 100
  inst.h = (hPx / H) * 100
  inst.x = ((outer.x() - wPx / 2) / W) * 100
  inst.y = ((outer.y() - hPx / 2) / H) * 100

  inst.w = clamp(inst.w, 2, 100)
  inst.h = clamp(inst.h, 2, 100)
  inst.x = clamp(inst.x, 0, 100 - inst.w)
  inst.y = clamp(inst.y, 0, 100 - inst.h)
  applyInstanceBoundsToNode(outer, inst)
  clampOuterInsideStage(outer)
  syncInstancePositionFromNode(outer, inst)
  transformer?.forceUpdate()
  patchTransformerHitThrough()
}

/**
 * Внутренний rect `.back` у Konva.Transformer иначе участвует в hit/drag и перекрывает группу фигуры
 * (рамка рисуется sceneFunc на всю область). Тогда клики не доходят до hitRect/drag outer — после
 * появления трансформера перетаскивание «умирает». Отключаем hit на back — якоря остаются отдельными узлами.
 */
function patchTransformerHitThrough() {
  if (!transformer) return
  const back = transformer.findOne('.back') as Konva.Shape | null
  if (back) {
    back.listening(false)
    back.draggable(false)
  }
}

function createTransformer(): Konva.Transformer {
  const tr = new Konva.Transformer({
    padding: 0,
    rotateAnchorOffset: 22,
    keepRatio: true,
    /* false: рамка по видимому контуру вместе со stroke; true даёт зазор «внутри» обводки */
    ignoreStroke: false,
    /* true = фейковая заливка на весь bbox перехватывает события и ломает drag по группе под трансформером */
    shouldOverdrawWholeArea: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    boundBoxFunc(oldBox, newBox) {
      const MIN = 8
      if (newBox.width < MIN || newBox.height < MIN) return oldBox
      const W = stage?.width() ?? 0
      const H = stage?.height() ?? 0
      const box = rotatedBoxAabb(newBox)
      const eps = 1e-3
      const isOut =
        box.x < -eps ||
        box.y < -eps ||
        box.x + box.width > W + eps ||
        box.y + box.height > H + eps
      if (isOut) return oldBox
      return newBox
    },
    rotationSnaps: [0, 90, 180, 270],
    rotationSnapTolerance: 6,
  })

  tr.on('transformstart', () => beginInteraction())

  tr.on('transformend', (e: Konva.KonvaEventObject<Event>) => {
    const figureContent = e.target as Konva.Group
    const outer = figureContent.getParent() as Konva.Group | null
    const id = outer?.getAttr('figureInstanceId') as string | undefined
    if (!id || !outer) {
      endInteraction()
      return
    }
    const inst = getInstances().find((i) => i.id === id)
    if (inst) syncInstanceFromTransformNode(outer, figureContent, inst)
    endInteraction()
    patchTransformerHitThrough()
  })

  return tr
}

function updateTransformerSelection() {
  if (!transformer || !layer) return
  if (!props.enabled) {
    transformer.nodes([])
    layer.batchDraw()
    return
  }
  const id = props.selectedInstanceId
  if (!id) {
    transformer.nodes([])
    layer.batchDraw()
    return
  }
  const outer = layer.findOne((n: Konva.Node) => n.getAttr('figureInstanceId') === id) as Konva.Group | null
  const figureContent = outer?.findOne('.figureContent') as Konva.Group | null
  transformer.nodes(figureContent ? [figureContent] : [])
  transformer.moveToTop()
  transformer.forceUpdate()
  patchTransformerHitThrough()
  layer.batchDraw()
}

function layoutSizeOfTransformedHost(host: HTMLElement): { w: number; h: number } {
  const hr = host.getBoundingClientRect()
  return {
    w: Math.max(1, Math.round(hr.width)),
    h: Math.max(1, Math.round(hr.height)),
  }
}

function fitStage() {
  if (!stage) return
  syncFiguresCssVarsFromRoot()
  const hostEl = rootRef.value
  if (!hostEl) return
  const { w, h } = layoutSizeOfTransformedHost(hostEl)
  stage.width(w)
  stage.height(h)
  applyCanvasSharpness()
  if (!interactionLock.value) rebuildLayer()
  else {
    layer?.batchDraw()
    transformer?.forceUpdate()
    patchTransformerHitThrough()
  }
}

function rebuildLayer() {
  if (!stage || !layer) return
  if (interactionLock.value) return

  stage.listening(props.enabled)

  const W = stage.width()
  const H = stage.height()
  /* destroy() снимает подписки и ссылки на узлы (Konva: избегаем утечек памяти) */
  layer.destroyChildren()
  transformer = null

  for (const inst of instances.value) {
    const xPct = Number(inst.x ?? 0)
    const yPct = Number(inst.y ?? 0)
    const wPct = Number(inst.w ?? 0)
    const hPct = Number(inst.h ?? 0)
    const wPx = (wPct / 100) * W
    const hPx = (hPct / 100) * H

    const outer = new Konva.Group({
      x: (xPct / 100) * W + wPx / 2,
      y: (yPct / 100) * H + hPx / 2,
      offsetX: wPx / 2,
      offsetY: hPx / 2,
      rotation: Number(inst.rotation ?? 0),
      draggable: props.enabled,
      figureInstanceId: inst.id,
    })

    const figureContent = new Konva.Group({
      name: 'figureContent',
      x: 0,
      y: 0,
      listening: true,
    })

    const scaleInner = new Konva.Group({
      name: 'figureScale',
      x: 0,
      y: 0,
      scaleX: wPx / 100,
      scaleY: hPx / 100,
      listening: false,
    })

    const rotInner = new Konva.Group({
      name: 'figureRotInner',
      x: 50,
      y: 50,
      offsetX: 50,
      offsetY: 50,
      rotation: 0,
      listening: false,
    })

    const drawn = buildFigureContentGroup(inst, props.figuresById)
    rotInner.add(drawn)
    scaleInner.add(rotInner)
    figureContent.add(scaleInner)

    const hitRect = new Konva.Rect({
      name: 'figureHit',
      x: 0,
      y: 0,
      width: Math.max(1, wPx),
      height: Math.max(1, hPx),
      fill: 'rgba(0,0,0,0.001)',
      listening: true,
      perfectDrawEnabled: false,
    })

    outer.add(figureContent)
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

      outer.on('dragstart', () => beginInteraction())

      outer.on('dragmove', () => {
        /* Не пишем x/y в реактивную модель на каждом dragmove — глубокий watch на figures вызывает syncFiguresCssVarsFromRoot и тяжёлые перерисовки Vue, из‑за чего перетаскивание «тормозит». Синхронизация — в dragend. */
        layer?.batchDraw()
      })

      outer.on('dragend', () => {
        clampOuterInsideStage(outer)
        syncInstancePositionFromNode(outer, inst)
        endInteraction()
      })

      outer.dragBoundFunc((pos) => {
        const hit = outer.findOne('.figureHit') as Konva.Rect | null
        if (!hit) return pos
        const wP = hit.width()
        const hP = hit.height()
        let cx = pos.x
        let cy = pos.y

        const clampByStageAabb = (x: number, y: number) => {
          const box = rotatedBoxAabb({
            x: x - wP / 2,
            y: y - hP / 2,
            width: wP,
            height: hP,
            rotation: outer.rotation(),
          })
          let nx = x
          let ny = y
          if (box.x < 0) nx -= box.x
          if (box.y < 0) ny -= box.y
          if (box.x + box.width > W) nx -= box.x + box.width - W
          if (box.y + box.height > H) ny -= box.y + box.height - H
          return { x: nx, y: ny, box }
        }

        const base = clampByStageAabb(cx, cy)
        cx = base.x
        cy = base.y

        if (editorGridCfg.value.snap) {
          const stepX = (editorGridCfg.value.stepPct / 100) * W
          const stepY = (editorGridCfg.value.stepPct / 100) * H
          let tlx = cx - wP / 2
          let tly = cy - hP / 2
          tlx = Math.round(tlx / stepX) * stepX
          tly = Math.round(tly / stepY) * stepY
          cx = tlx + wP / 2
          cy = tly + hP / 2
          const snapped = clampByStageAabb(cx, cy)
          cx = snapped.x
          cy = snapped.y

          // Лёгкий edge magnet после снапа, чтобы не оставалось зазора из-за шага сетки.
          const post = clampByStageAabb(cx, cy).box
          const tolX = stepX / 2
          const tolY = stepY / 2
          if (Math.abs(post.x) <= tolX) cx -= post.x
          if (Math.abs(post.y) <= tolY) cy -= post.y
          const rightDelta = W - (post.x + post.width)
          const bottomDelta = H - (post.y + post.height)
          if (Math.abs(rightDelta) <= tolX) cx += rightDelta
          if (Math.abs(bottomDelta) <= tolY) cy += bottomDelta
        }

        const finalPos = clampByStageAabb(cx, cy)
        cx = finalPos.x
        cy = finalPos.y
        return { x: cx, y: cy }
      })
    }

    layer.add(outer)
  }

  transformer = createTransformer()
  layer.add(transformer)
  updateTransformerSelection()
  patchTransformerHitThrough()
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
  if (isUnderTransformer(e.target as Konva.Node)) return

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

function applyCanvasSharpness() {
  if (!layer || !stage) return
  const pr = devicePixelRatioClamped()
  Konva.pixelRatio = pr
  layer.getCanvas().setPixelRatio(pr)
  layer.hitCanvas.setPixelRatio(1)
  layer.setSize({ width: stage.width(), height: stage.height() })
  layer.imageSmoothingEnabled(false)
  layer.batchDraw()
}

function onWindowBlur() {
  endInteraction()
}

onMounted(() => {
  nextTick(() => syncFiguresCssVarsFromRoot())
  const stageNode = stageRef.value?.getNode?.() as Konva.Stage | undefined
  const layerNode = layerRef.value?.getNode?.() as Konva.Layer | undefined
  if (!stageNode || !layerNode) return
  stage = stageNode
  layer = layerNode
  Konva.pixelRatio = devicePixelRatioClamped()
  layer.imageSmoothingEnabled(false)
  applyCanvasSharpness()
  stage.on('click tap', onStageClick)

  window.addEventListener('blur', onWindowBlur)

  bindResizeObserver()

  rebuildLayer()
  /* После layout админского столбика слайдов размер host может остаться 0 на первом кадре */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => fitStage())
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', onWindowBlur)
  resizeObserver?.disconnect()
  resizeObserver = null
  transformer = null
  if (stage) {
    stage.off('click tap', onStageClick)
    stage.destroy()
  }
  stage = null
  layer = null
})

watch(
  () => [props.slide?.id, props.slide?.data?.figures, props.figuresById, props.enabled, props.figureBlockScope],
  () => {
    if (interactionLock.value) return
    rebuildLayer()
  },
  { deep: true },
)

watch(
  () => props.figureBlockScope,
  () => {
    nextTick(() => {
      bindResizeObserver()
      syncFiguresCssVarsFromRoot()
      fitStage()
      if (!interactionLock.value) rebuildLayer()
    })
  },
)

watch(
  () =>
    getInstances()
      .map((i) => `${i.id}:${zNum(i.z)}`)
      .slice()
      .sort()
      .join('|'),
  () => {
    nextTick(() => {
      reorderKonvaByZ()
      updateTransformerSelection()
    })
  },
)

watch(
  () => props.selectedInstanceId,
  () => {
    updateTransformerSelection()
  },
)

watch(
  () => [props.slide?.id, props.slide?.data?.figures, maxFigZForStack.value],
  () => {
    if (interactionLock.value) return
    nextTick(() => syncFiguresCssVarsFromRoot())
  },
  { deep: true },
)
</script>

<template>
  <!-- Два корня: Konva с z от max(z) фигур (можно под медиа); панель — всегда выше медиа -->
  <div ref="rootRef" class="figures-konva-stack" data-figures-konva-stack :style="konvaWrapStyle">
    <v-stage ref="stageRef" class="figures-konva-host" :config="stageHostStyle">
      <v-layer ref="layerRef" />
    </v-stage>
  </div>
</template>

<style scoped>
.figures-konva-stack {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  overflow: visible;
  outline: 1px dashed rgba(37, 99, 235, 0.35);
  outline-offset: 0;
}

.figures-konva-host :deep(canvas) {
  display: block;
  vertical-align: top;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
