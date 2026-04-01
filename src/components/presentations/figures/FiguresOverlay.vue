<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FigureDefinition, FigureInstance } from '@/types/figures'
import { buildFigureSvgInner, shadowFilterCssForFigure } from '@/utils/figureSvgOverlay'
import { normalizeFigureBlockId, SLIDE_WIDE_BLOCK_ID } from '@/utils/figureBlockScopes'

type SlideLike = {
  id?: string
  data?: Record<string, unknown>
}

const props = withDefaults(
  defineProps<{
    slide: SlideLike
    figuresById: Record<string, FigureDefinition>
    figureBlockScope?: string
  }>(),
  { figureBlockScope: SLIDE_WIDE_BLOCK_ID },
)

const rootBelowRef = ref<HTMLDivElement | null>(null)
const frameBelowRef = ref<HTMLDivElement | null>(null)
const rootAboveRef = ref<HTMLDivElement | null>(null)
const frameAboveRef = ref<HTMLDivElement | null>(null)

function overlayMountEl(): HTMLElement | null {
  return rootBelowRef.value ?? rootAboveRef.value ?? frameBelowRef.value
}

/** Совпадает с z-index изображений в booklet-slides (--booklet-figure-media-z). z фигуры &lt; порога — под медиа. */
const FIGURE_Z_MEDIA = 5

const mediaZResolved = ref(5)

const contentBoxPx = ref({ left: 0, top: 0, width: 0, height: 0 })
const slideWideFillsStack = ref(false)

function resolveScaleRootEl(): HTMLElement | null {
  const el = overlayMountEl()
  if (!el) return null
  const nearest = el.closest('.booklet-scale-root') as HTMLElement | null
  if (nearest) return nearest
  const pageInner = el.closest('.booklet-page__inner') as HTMLElement | null
  if (!pageInner) return null
  return pageInner.querySelector('.booklet-scale-root') as HTMLElement | null
}

function resolveBookletViewEl(scale: HTMLElement | null): HTMLElement | null {
  const mount = overlayMountEl()
  if (mount) {
    const nearest = mount.closest('.booklet-view') as HTMLElement | null
    if (nearest) return nearest
  }
  return scale?.closest('.booklet-view') as HTMLElement | null
}

function layoutOffsetInAncestor(el: HTMLElement, ancestor: HTMLElement): { left: number; top: number } {
  let left = 0
  let top = 0
  let cur: HTMLElement | null = el
  while (cur && cur !== ancestor) {
    left += cur.offsetLeft
    top += cur.offsetTop
    cur = cur.offsetParent as HTMLElement | null
  }
  if (cur !== ancestor) {
    return { left: 0, top: 0 }
  }
  return { left, top }
}

function resolveAnchorEl(): HTMLElement | null {
  const scale = resolveScaleRootEl()
  if (!scale) return null
  const scope = normalizeFigureBlockId(props.figureBlockScope)
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
  if (typeof window === 'undefined' || !overlayMountEl()) {
    slideWideFillsStack.value = false
    setContentBoxIfChanged(zero)
    return
  }
  const overlayEl = overlayMountEl()!
  const anchor = resolveAnchorEl()
  const scale = resolveScaleRootEl()
  if (!anchor || !scale) {
    slideWideFillsStack.value = false
    setContentBoxIfChanged(zero)
    return
  }
  const scope = normalizeFigureBlockId(props.figureBlockScope)
  const overlayInsideScale = scale.contains(overlayEl)
  if (scope === SLIDE_WIDE_BLOCK_ID && !overlayInsideScale) {
    slideWideFillsStack.value = true
    const ow = Math.max(1, Math.round(overlayEl.clientWidth))
    const oh = Math.max(1, Math.round(overlayEl.clientHeight))
    setContentBoxIfChanged({ left: 0, top: 0, width: ow, height: oh })
    return
  }
  slideWideFillsStack.value = false
  const applyAnchorPadding = scope !== SLIDE_WIDE_BLOCK_ID
  const cs = applyAnchorPadding ? getComputedStyle(anchor) : null
  const padL = applyAnchorPadding ? Number.parseFloat(cs?.paddingLeft || '0') || 0 : 0
  const padT = applyAnchorPadding ? Number.parseFloat(cs?.paddingTop || '0') || 0 : 0
  const padR = applyAnchorPadding ? Number.parseFloat(cs?.paddingRight || '0') || 0 : 0
  const padB = applyAnchorPadding ? Number.parseFloat(cs?.paddingBottom || '0') || 0 : 0
  const offInScale = layoutOffsetInAncestor(anchor, scale)
  const innerW = Math.max(1, Math.round(anchor.clientWidth - padL - padR))
  const innerH = Math.max(1, Math.round(anchor.clientHeight - padT - padB))

  let left = offInScale.left + padL
  let top = offInScale.top + padT
  if (!overlayInsideScale) {
    const parentEl = overlayEl.parentElement
    if (parentEl && scale.parentElement === parentEl) {
      const sOp = scale.offsetParent
      const oOp = overlayEl.offsetParent
      if (sOp && sOp === oOp) {
        left += scale.offsetLeft - overlayEl.offsetLeft
        top += scale.offsetTop - overlayEl.offsetTop
      } else {
        const scaleInParent = layoutOffsetInAncestor(scale, parentEl)
        const overlayInParent = layoutOffsetInAncestor(overlayEl, parentEl)
        left += scaleInParent.left - overlayInParent.left
        top += scaleInParent.top - overlayInParent.top
      }
    }
  }

  setContentBoxIfChanged({
    left: Math.round(left),
    top: Math.round(top),
    width: innerW,
    height: innerH,
  })
}

function syncFiguresCssVarsFromRoot() {
  if (typeof window === 'undefined' || !overlayMountEl()) return
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

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function getInstances(): FigureInstance[] {
  const data = props.slide.data as Record<string, unknown> | undefined
  const arr = data?.figures
  if (!Array.isArray(arr)) return []
  const scope = normalizeFigureBlockId(props.figureBlockScope)
  return (arr as FigureInstance[]).filter((i) => normalizeFigureBlockId(i.blockId) === scope)
}

const instancesBelowMedia = computed(() => {
  const arr = getInstances().filter((i) => zNum(i.z) < FIGURE_Z_MEDIA)
  return [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
})

const instancesAboveMedia = computed(() => {
  const arr = getInstances().filter((i) => zNum(i.z) >= FIGURE_Z_MEDIA)
  return [...arr].sort((a, b) => zNum(a.z) - zNum(b.z))
})

const figuresZStackSig = computed(() =>
  getInstances()
    .map((i) => `${i.id}:${zNum(i.z)}`)
    .sort()
    .join('|'),
)

const maxFigZBelowMedia = computed(() => {
  void figuresZStackSig.value
  const arr = instancesBelowMedia.value
  if (arr.length === 0) return 0
  return Math.max(...arr.map((i) => zNum(i.z)))
})

const maxFigZAboveMedia = computed(() => {
  void figuresZStackSig.value
  const arr = instancesAboveMedia.value
  if (arr.length === 0) return 0
  return Math.max(...arr.map((i) => zNum(i.z)))
})

const svgWrapBelowStyle = computed(() => {
  const mz = mediaZResolved.value
  const kz = maxFigZBelowMedia.value
  const z = kz === 0 ? 1 : clamp(kz + mz - 3, 1, FIGURE_Z_MEDIA - 1)
  return {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: z,
    isolation: 'isolate' as const,
    touchAction: 'none' as const,
  }
})

const svgWrapAboveStyle = computed(() => {
  const mz = mediaZResolved.value
  const kz = maxFigZAboveMedia.value
  const z = kz === 0 ? FIGURE_Z_MEDIA + 1 : clamp(kz + mz - 3, FIGURE_Z_MEDIA + 1, 99)
  return {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: z,
    isolation: 'isolate' as const,
    touchAction: 'none' as const,
  }
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

const frameStyle = computed(() => {
  const fillStack: Record<string, string | number> = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  }
  return {
    ...(slideWideFillsStack.value ? fillStack : figuresContentBoxStyle.value),
    pointerEvents: 'none' as const,
    overflow: 'visible' as const,
  }
})

function figureDefFor(inst: FigureInstance): FigureDefinition | undefined {
  return props.figuresById[inst.figureId] ?? inst.figureDef
}

function svgMarkupFor(inst: FigureInstance): string {
  const def = figureDefFor(inst)
  const inner = buildFigureSvgInner(inst, def, props.figuresById)
  if (!inner) return ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" overflow="visible">${inner}</svg>`
}

/** drop-shadow(...) в style.filter */
function itemFilter(inst: FigureInstance): string | undefined {
  const s = shadowFilterCssForFigure(inst)
  if (!s) return undefined
  const m = /filter:\s*([^;]+)/i.exec(s)
  return m?.[1]?.trim()
}

function itemStyleSafe(inst: FigureInstance, order: number): Record<string, string | number> {
  const rot = Number.isFinite(inst.rotation ?? 0) ? Number(inst.rotation) : 0
  const f = itemFilter(inst)
  const o: Record<string, string | number> = {
    position: 'absolute',
    left: `${inst.x}%`,
    top: `${inst.y}%`,
    width: `${inst.w}%`,
    height: `${inst.h}%`,
    zIndex: order,
    transform: `rotate(${rot}deg)`,
  }
  if (f) o.filter = f
  return o
}

let resizeObserver: ResizeObserver | null = null

function bindResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return
  const anchor = resolveAnchorEl()
  resizeObserver = new ResizeObserver(() => {
    syncFiguresCssVarsFromRoot()
  })
  if (anchor) resizeObserver.observe(anchor)
  if (rootBelowRef.value) resizeObserver.observe(rootBelowRef.value)
  if (frameBelowRef.value) resizeObserver.observe(frameBelowRef.value)
  if (rootAboveRef.value) resizeObserver.observe(rootAboveRef.value)
  if (frameAboveRef.value) resizeObserver.observe(frameAboveRef.value)
}

onMounted(() => {
  nextTick(() => {
    nextTick(() => {
      syncFiguresCssVarsFromRoot()
      window.addEventListener('blur', onWindowBlur)
      bindResizeObserver()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => syncFiguresCssVarsFromRoot())
      })
    })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', onWindowBlur)
  resizeObserver?.disconnect()
  resizeObserver = null
})

function onWindowBlur() {
  syncFiguresCssVarsFromRoot()
}

watch(
  () => [props.slide?.id, props.slide?.data?.figures, props.figuresById, props.figureBlockScope],
  () => {
    nextTick(() => syncFiguresCssVarsFromRoot())
  },
  { deep: true },
)

watch(
  () => props.figureBlockScope,
  () => {
    nextTick(() => {
      bindResizeObserver()
      syncFiguresCssVarsFromRoot()
    })
  },
)

watch(
  () => [props.slide?.id, props.slide?.data?.figures, maxFigZBelowMedia.value, maxFigZAboveMedia.value],
  () => {
    nextTick(() => syncFiguresCssVarsFromRoot())
  },
  { deep: true },
)
</script>

<template>
  <div ref="rootBelowRef" class="figures-svg-stack" data-figures-svg-stack :style="svgWrapBelowStyle">
    <div ref="frameBelowRef" class="figures-svg-frame" :style="frameStyle">
      <div
        v-for="(inst, idx) in instancesBelowMedia"
        :key="inst.id"
        class="figures-svg-item"
        :style="itemStyleSafe(inst, idx + 1)"
      >
        <div class="figures-svg-inner" v-html="svgMarkupFor(inst)" />
      </div>
    </div>
  </div>
  <div ref="rootAboveRef" class="figures-svg-stack" data-figures-svg-stack :style="svgWrapAboveStyle">
    <div ref="frameAboveRef" class="figures-svg-frame" :style="frameStyle">
      <div
        v-for="(inst, idx) in instancesAboveMedia"
        :key="inst.id"
        class="figures-svg-item"
        :style="itemStyleSafe(inst, idx + 1)"
      >
        <div class="figures-svg-inner" v-html="svgMarkupFor(inst)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.figures-svg-stack {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.figures-svg-frame {
  box-sizing: border-box;
}

.figures-svg-item {
  box-sizing: border-box;
}

.figures-svg-inner :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  vertical-align: top;
}
</style>
