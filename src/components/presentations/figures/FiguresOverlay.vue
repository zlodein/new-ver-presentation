<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

/** Минимальный z-index панели инструментов (поверх медиа). Из --booklet-figures-overlay-z */
const figuresOverlayZBaseResolved = ref(20)
/** Слой медиа слайда (--booklet-figure-media-z), обычно 5 — для расчёта z canvas фигур */
const mediaZResolved = ref(5)

/**
 * Оверлей = весь padding-box .booklet-scale-root (left/top: 0, clientWidth × clientHeight).
 * Не привязываем к .booklet-content — иначе 1rem padding scale-root даёт лишний зазор у краёв слайда
 * и расхождение с тулбаром (проценты должны быть от той же области, что и Konva stage).
 */
const contentBoxPx = ref({ left: 0, top: 0, width: 0, height: 0 })

/** sx,sy — масштаб из matrix(scale); для layout-размеров делим экранные px из getBoundingClientRect */
function readUniformScaleFromTransform(el: HTMLElement | null): { sx: number; sy: number } {
  if (!el || typeof window === 'undefined') return { sx: 1, sy: 1 }
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return { sx: 1, sy: 1 }
  try {
    const m = new DOMMatrixReadOnly(t)
    const sx = Math.abs(m.a) > 1e-6 ? Math.abs(m.a) : 1
    const sy = Math.abs(m.d) > 1e-6 ? Math.abs(m.d) : 1
    return { sx, sy }
  } catch {
    return { sx: 1, sy: 1 }
  }
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
  const scale = rootRef.value.closest('.booklet-scale-root') as HTMLElement | null
  if (!scale) {
    setContentBoxIfChanged(zero)
    return
  }
  const { sx, sy } = readUniformScaleFromTransform(scale)
  const sr = scale.getBoundingClientRect()
  const widthLocal = sr.width / sx
  const heightLocal = sr.height / sy
  if (widthLocal >= 1 && heightLocal >= 1) {
    setContentBoxIfChanged({
      left: 0,
      top: 0,
      width: Math.max(1, Math.round(widthLocal)),
      height: Math.max(1, Math.round(heightLocal)),
    })
    return
  }
  setContentBoxIfChanged({
    left: 0,
    top: 0,
    width: Math.max(1, Math.round(scale.clientWidth)),
    height: Math.max(1, Math.round(scale.clientHeight)),
  })
}

function syncFiguresCssVarsFromRoot() {
  if (typeof window === 'undefined' || !rootRef.value) return
  const scale = rootRef.value.closest('.booklet-scale-root') as HTMLElement | null
  const bookletView = rootRef.value.closest('.booklet-view') as HTMLElement | null
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

  figuresOverlayZBaseResolved.value = readZ('--booklet-figures-overlay-z', 20)
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

/**
 * z-index слоя Konva: ниже --booklet-figure-media-z при малом z модели (фигура под картинкой).
 * Формула: maxFigZ + mediaZ - 3 (при media=5: z=0→2, z=4→6 выше медиа).
 */
const konvaStackZ = computed(() =>
  clamp(maxFigZForStack.value + mediaZResolved.value - 3, 1, 99),
)

/** Панель слоёв всегда поверх медиа, чтобы кнопки были кликабельны */
const toolbarStackZ = computed(() =>
  Math.max(konvaStackZ.value + 2, figuresOverlayZBaseResolved.value, mediaZResolved.value + 6),
)

let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let transformer: Konva.Transformer | null = null
let resizeObserver: ResizeObserver | null = null

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
  return Array.isArray(arr) ? (arr as FigureInstance[]) : []
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
  const p1 = getCorner(x, y, 0, 0, rotation)
  const p2 = getCorner(x, y, width, 0, rotation)
  const p3 = getCorner(x, y, width, height, rotation)
  const p4 = getCorner(x, y, 0, height, rotation)
  const minX = Math.min(p1.x, p2.x, p3.x, p4.x)
  const minY = Math.min(p1.y, p2.y, p3.y, p4.y)
  const maxX = Math.max(p1.x, p2.x, p3.x, p4.x)
  const maxY = Math.max(p1.y, p2.y, p3.y, p4.y)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Полуоси AABB ячейки w×h с поворотом outer (градусы) — границы центра при drag */
function axisAlignedHalfExtentsForRotatedRect(wPx: number, hPx: number, rotationDeg: number): { rx: number; ry: number } {
  const rad = (rotationDeg * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  return {
    rx: (wPx / 2) * c + (hPx / 2) * s,
    ry: (wPx / 2) * s + (hPx / 2) * c,
  }
}

/** После drag/transform — подправить позицию, если AABB вылез за stage (не вызывать каждый dragmove — ломает перетаскивание) */
function clampOuterInsideStage(outer: Konva.Group) {
  if (!stage) return
  const L = outer.getLayer()
  if (!L) return
  const W = stage.width()
  const H = stage.height()
  for (let i = 0; i < 4; i++) {
    // Не учитываем shadow/stroke в коллизии с границами: эффект и обводка не должны
    // создавать визуальный зазор при прижатии фигуры к краю.
    const rect = outer.getClientRect({ relativeTo: L, skipShadow: true, skipStroke: true })
    let dx = 0
    let dy = 0
    if (rect.x < 0) dx -= rect.x
    if (rect.y < 0) dy -= rect.y
    if (rect.x + rect.width > W) dx -= rect.x + rect.width - W
    if (rect.y + rect.height > H) dy -= rect.y + rect.height - H
    if (dx === 0 && dy === 0) break
    outer.x(outer.x() + dx)
    outer.y(outer.y() + dy)
  }
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

function onLayerMove(delta: number) {
  const sel = selected.value
  if (!sel) return
  /* Иначе watcher rebuildLayer и reorderKonvaByZ не сработают: interactionLock остаётся true после mousedown по фигуре до pointerup (клик по кнопке слоя часто раньше отпускания или без общего pointerup). */
  endInteraction()
  emit('layerMove', { id: sel.id, delta, slideId: props.slide.id })
  nextTick(() => {
    reorderKonvaByZ(true)
    updateTransformerSelection()
    patchTransformerHitThrough()
  })
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

const selected = computed(() => {
  if (!props.selectedInstanceId) return null
  return instances.value.find((i) => i.id === props.selectedInstanceId) ?? null
})

const EDGE_TOOLBAR_PCT = 5

const toolbarPositionStyle = computed(() => {
  if (!props.enabled || !props.selectedInstanceId || !selected.value) return {}
  const sel = selected.value
  return {
    left: `${sel.x}%`,
    top: `${sel.y}%`,
    width: `${sel.w}%`,
    height: `${sel.h}%`,
  }
})

/** У края слайда — панель с противоположной стороны bbox фигуры */
const toolbarButtonHClass = computed(() => {
  if (!selected.value) return 'right-1'
  const x = Number(selected.value.x ?? 0)
  const w = Number(selected.value.w ?? 0)
  return x + w >= 100 - EDGE_TOOLBAR_PCT ? 'left-1' : 'right-1'
})

const toolbarButtonVClass = computed(() => {
  if (!selected.value) return 'top-1'
  const y = Number(selected.value.y ?? 0)
  const h = Number(selected.value.h ?? 0)
  if (y <= EDGE_TOOLBAR_PCT) return 'bottom-1'
  if (y + h >= 100 - EDGE_TOOLBAR_PCT) return 'top-1'
  return 'top-1'
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

const toolbarWrapStyle = computed(() => ({
  ...figuresContentBoxStyle.value,
  pointerEvents: 'none' as const,
  zIndex: toolbarStackZ.value,
}))

const stageHostStyle = computed(() => ({
  position: 'absolute' as const,
  inset: 0,
  zIndex: 0,
  display: 'block' as const,
  boxSizing: 'border-box' as const,
  margin: 0,
  padding: 0,
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
  const scale = host.closest('.booklet-scale-root') as HTMLElement | null
  const { sx, sy } = readUniformScaleFromTransform(scale)
  const hr = host.getBoundingClientRect()
  return {
    w: Math.max(1, Math.round(hr.width / sx)),
    h: Math.max(1, Math.round(hr.height / sy)),
  }
}

function fitStage() {
  const host = stageHostRef.value
  if (!stage || !host) return
  syncFiguresCssVarsFromRoot()
  const { w, h } = layoutSizeOfTransformedHost(host)
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
        const hit = outer.findOne('.figureHit') as Konva.Rect | null
        if (hit && editorGridCfg.value.snap) {
          const wP = hit.width()
          const hP = hit.height()
          const stepX = (editorGridCfg.value.stepPct / 100) * W
          const stepY = (editorGridCfg.value.stepPct / 100) * H
          let cx = outer.x()
          let cy = outer.y()
          let tlx = cx - wP / 2
          let tly = cy - hP / 2
          tlx = Math.round(tlx / stepX) * stepX
          tly = Math.round(tly / stepY) * stepY
          outer.x(tlx + wP / 2)
          outer.y(tly + hP / 2)
        }
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
        if (editorGridCfg.value.snap) {
          const stepX = (editorGridCfg.value.stepPct / 100) * W
          const stepY = (editorGridCfg.value.stepPct / 100) * H
          let tlx = cx - wP / 2
          let tly = cy - hP / 2
          tlx = Math.round(tlx / stepX) * stepX
          tly = Math.round(tly / stepY) * stepY
          cx = tlx + wP / 2
          cy = tly + hP / 2
        }
        const { rx, ry } = axisAlignedHalfExtentsForRotatedRect(wP, hP, outer.rotation())
        cx = clamp(cx, rx, W - rx)
        cy = clamp(cy, ry, H - ry)
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

  const host = stageHostRef.value
  if (!host) return

  Konva.pixelRatio = devicePixelRatioClamped()

  const { w: initW, h: initH } = layoutSizeOfTransformedHost(host)
  stage = new Konva.Stage({
    container: host,
    width: initW,
    height: initH,
  })
  layer = new Konva.Layer()
  layer.imageSmoothingEnabled(false)
  stage.add(layer)
  applyCanvasSharpness()
  stage.on('click tap', onStageClick)

  window.addEventListener('blur', onWindowBlur)

  resizeObserver = new ResizeObserver(() => fitStage())
  resizeObserver.observe(host)

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
  () => [props.slide?.id, props.slide?.data?.figures, props.figuresById, props.enabled],
  () => {
    if (interactionLock.value) return
    rebuildLayer()
  },
  { deep: true },
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
    <div ref="stageHostRef" class="figures-konva-host" :style="stageHostStyle" />
  </div>

  <div v-if="enabled && selected" class="figures-toolbar-layer" :style="toolbarWrapStyle">
    <!-- inset-0: проценты bbox — от полного оверлея (как stage), не от сжатого блока по контенту -->
    <div class="figure-toolbar pointer-events-none absolute inset-0 overflow-visible">
      <div
        class="pointer-events-none absolute z-[3] flex flex-col gap-1"
        :style="toolbarPositionStyle"
        :class="[toolbarButtonHClass, toolbarButtonVClass]"
      >
        <button
          type="button"
          class="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-200"
          title="Слой выше"
          aria-label="Слой выше"
          @pointerdown.stop
          @click.stop.prevent="onLayerMove(1)"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5l7 7H5l7-7z" />
          </svg>
        </button>
        <button
          type="button"
          class="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white/90 text-red-600 hover:bg-red-50 dark:border-red-900/40"
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
          class="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-200"
          title="Слой ниже"
          aria-label="Слой ниже"
          @pointerdown.stop
          @click.stop.prevent="onLayerMove(-1)"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l-7-7h14l-7 7z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.figures-konva-stack {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.figures-toolbar-layer {
  overflow: visible;
}

.figure-toolbar {
  overflow: visible;
}

.figures-konva-host :deep(canvas) {
  display: block;
  vertical-align: top;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
