import type { FigureDefinition } from '@/types/figures'

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

/**
 * Прямоугольник / roundedRect: поддержка JSON из БД (x,y,width,height,rx) и старого формата «на весь viewBox».
 */
export function rectLayoutFromGeometry(def?: FigureDefinition): {
  x: number
  y: number
  width: number
  height: number
  rx: number
  ry: number
} {
  const g = def?.geometry as Record<string, unknown> | undefined
  if (g && typeof g === 'object') {
    const w = Number((g as { width?: unknown }).width)
    const h = Number((g as { height?: unknown }).height)
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      const gx = (g as { x?: unknown }).x
      const gy = (g as { y?: unknown }).y
      const x = Number.isFinite(Number(gx)) ? Number(gx) : 0
      const y = Number.isFinite(Number(gy)) ? Number(gy) : 0
      const rxRaw = Number((g as { rx?: unknown }).rx ?? 0)
      const ryRaw = Number((g as { ry?: unknown }).ry ?? (g as { rx?: unknown }).rx ?? 0)
      const rx = Number.isFinite(rxRaw) ? Math.max(0, rxRaw) : 0
      const ry = Number.isFinite(ryRaw) ? Math.max(0, ryRaw) : rx
      return { x, y, width: w, height: h, rx, ry }
    }
  }
  let legacyRx = 0
  if (g && typeof g === 'object') {
    const rx = (g as { rx?: unknown }).rx
    if (typeof rx === 'number' && Number.isFinite(rx)) legacyRx = Math.max(0, rx)
  }
  return { x: 0, y: 0, width: 100, height: 100, rx: legacyRx, ry: legacyRx }
}

/**
 * Звезда: формат БД (cx, cy, outerRadius, innerRadius, points) и упрощённый (points = число лучей, innerRatio).
 */
export function starPolygonPointsFromGeometry(def?: FigureDefinition): string {
  const g = def?.geometry as Record<string, unknown> | undefined
  if (!g || typeof g !== 'object') return ''
  const n = Number((g as { points?: unknown }).points)
  const p = Number.isFinite(n) ? Math.max(2, Math.floor(n)) : 5
  const cx = Number.isFinite(Number((g as { cx?: unknown }).cx)) ? Number((g as { cx?: unknown }).cx) : 50
  const cy = Number.isFinite(Number((g as { cy?: unknown }).cy)) ? Number((g as { cy?: unknown }).cy) : 50
  let outerR = Number.isFinite(Number((g as { outerRadius?: unknown }).outerRadius))
    ? Number((g as { outerRadius?: unknown }).outerRadius)
    : 50
  if (!Number.isFinite(outerR) || outerR <= 0) outerR = 50
  let innerR: number
  if (Number.isFinite(Number((g as { innerRadius?: unknown }).innerRadius))) {
    innerR = Number((g as { innerRadius?: unknown }).innerRadius)
  } else if ((g as { innerRatio?: unknown }).innerRatio != null && Number.isFinite(Number((g as { innerRatio?: unknown }).innerRatio))) {
    innerR = outerR * clamp(Number((g as { innerRatio?: unknown }).innerRatio), 0.05, 0.95)
  } else {
    innerR = outerR * 0.5
  }
  innerR = clamp(innerR, 0.05, outerR - 0.01)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const startDeg = -90
  const out: string[] = []
  for (let i = 0; i < p; i++) {
    const aOuter = startDeg + (360 / p) * i
    const aInner = aOuter + 180 / p
    const ox = cx + Math.cos(toRad(aOuter)) * outerR
    const oy = cy + Math.sin(toRad(aOuter)) * outerR
    const ix = cx + Math.cos(toRad(aInner)) * innerR
    const iy = cy + Math.sin(toRad(aInner)) * innerR
    out.push(`${ox},${oy}`, `${ix},${iy}`)
  }
  return out.join(' ')
}

export function polylinePointsFromGeometry(geometry: unknown): string {
  if (!geometry || typeof geometry !== 'object') return ''
  const pts = (geometry as { points?: unknown }).points
  if (!Array.isArray(pts)) return ''
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

export function isPolylineGeometryClosed(geometry: unknown): boolean {
  if (!geometry || typeof geometry !== 'object') return false
  return Boolean((geometry as { closed?: unknown }).closed)
}
