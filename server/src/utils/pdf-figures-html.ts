/**
 * HTML+SVG слой фигур для PDF (Puppeteer). Координаты геометрии 0..100, как в Konva.
 */
import type { PdfFigureDefinition } from './pdf-figure-definitions.js'

type FigureFill =
  | { type: 'none' }
  | { type: 'solid'; color: string; opacity?: number }
  | { type: 'linear'; from: string; to: string; angle: number; opacity?: number }

type FigureStroke = {
  enabled: boolean
  color: string
  width: number
  dash: string
  linecap: string
  linejoin: string
}

type FigureShadow = {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
  opacity: number
}

export type PdfFigureInstance = {
  id: string
  figureId: string
  x: number
  y: number
  w: number
  h: number
  z?: number
  rotation?: number
  style: {
    fill: FigureFill
    stroke: FigureStroke
    shadow?: FigureShadow
  }
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1 || !Number.isFinite(alpha)) return color
  const a = clamp(alpha, 0, 1)
  const hex = color.trim()
  const m6 = /^#([0-9a-f]{6})$/i.exec(hex)
  if (m6) {
    const h = m6[1]
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const m3 = /^#([0-9a-f]{3})$/i.exec(hex)
  if (m3) {
    const h = m3[1]
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  return color
}

function geometryKind(def?: PdfFigureDefinition): string {
  const g = def?.geometry
  if (g && typeof g === 'object') {
    const k = (g as { kind?: unknown }).kind
    if (typeof k === 'string' && k) return k
  }
  const top = def?.kind
  return typeof top === 'string' ? top : ''
}

function polygonPointsFlat(def?: PdfFigureDefinition): number[] {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return []
  const pts = (g as { points?: unknown }).points
  if (!Array.isArray(pts)) return []
  const out: number[] = []
  for (const p of pts) {
    if (!Array.isArray(p) || p.length < 2) continue
    const x = Number(p[0])
    const y = Number(p[1])
    if (Number.isFinite(x) && Number.isFinite(y)) out.push(x, y)
  }
  return out
}

function parsePointsStr(s: string): number[] {
  const out: number[] = []
  for (const part of s.trim().split(/\s+/)) {
    if (!part) continue
    const [xs, ys] = part.split(',')
    const x = Number(xs)
    const y = Number(ys)
    if (Number.isFinite(x) && Number.isFinite(y)) out.push(x, y)
  }
  return out
}

function ellipseParams(def?: PdfFigureDefinition): { cx: number; cy: number; rx: number; ry: number } {
  const g = def?.geometry
  if (!g || typeof g !== 'object') return { cx: 50, cy: 50, rx: 50, ry: 50 }
  const cx = Number((g as { cx?: unknown }).cx ?? 50)
  const cy = Number((g as { cy?: unknown }).cy ?? 50)
  const r = Number((g as { r?: unknown }).r ?? NaN)
  const rx = Number((g as { rx?: unknown }).rx ?? (Number.isFinite(r) ? r : 50))
  const ry = Number((g as { ry?: unknown }).ry ?? (Number.isFinite(r) ? r : 50))
  return {
    cx: Number.isFinite(cx) ? cx : 50,
    cy: Number.isFinite(cy) ? cy : 50,
    rx: Number.isFinite(rx) ? rx : 50,
    ry: Number.isFinite(ry) ? ry : 50,
  }
}

function rectLayoutFromGeometry(def?: PdfFigureDefinition): {
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

function starPolygonPointsFromGeometry(def?: PdfFigureDefinition): string {
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

function polylinePointsFromGeometry(geometry: unknown): string {
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

function isPolylineGeometryClosed(geometry: unknown): boolean {
  if (!geometry || typeof geometry !== 'object') return false
  return Boolean((geometry as { closed?: unknown }).closed)
}

function linearGradientEnds(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
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

function fillOpacityFor(inst: PdfFigureInstance): number {
  const fill = inst.style?.fill
  if (!fill || typeof fill !== 'object') return 1
  if ((fill as { type?: string }).type === 'none') return 1
  const o = Number((fill as { opacity?: unknown }).opacity)
  return Number.isFinite(o) ? clamp(o, 0, 1) : 1
}

function strokeWidthFor(inst: PdfFigureInstance): number {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return 0
  if (!stroke.enabled) return 0
  const w = Number((stroke as { width?: unknown }).width ?? 2)
  return Number.isFinite(w) ? Math.max(0, w) : 0
}

function strokeDashSvg(inst: PdfFigureInstance, def?: PdfFigureDefinition): string {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object' || !stroke.enabled) return ''
  const dash = String((stroke as { dash?: unknown }).dash ?? 'solid')
  if (dash === 'dashed') return '6 4'
  if (dash === 'dotted') return '2 3'
  if (dash === 'solid') {
    const g = def?.geometry as Record<string, unknown> | undefined
    if (g && typeof g === 'object') {
      const raw =
        (g as { strokeDasharray?: unknown }).strokeDasharray ??
        (g as { strokeDashArray?: unknown }).strokeDashArray
      if (raw != null && String(raw).trim()) {
        const nums = String(raw)
          .trim()
          .split(/[\s,]+/)
          .map(Number)
          .filter((n) => Number.isFinite(n))
        return nums.length ? nums.join(' ') : ''
      }
    }
    return ''
  }
  return ''
}

function strokeColor(inst: PdfFigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as { color?: unknown }).color ?? '#111827')
}

function shadowFilterCss(inst: PdfFigureInstance): string {
  const shadow = inst.style?.shadow
  if (!shadow || typeof shadow !== 'object' || !shadow.enabled) return ''
  const ox = Number((shadow as { offsetX?: unknown }).offsetX ?? 2)
  const oy = Number((shadow as { offsetY?: unknown }).offsetY ?? 2)
  const blur = Number((shadow as { blur?: unknown }).blur ?? 4)
  const color = String((shadow as { color?: unknown }).color ?? '#000000')
  const op = Number((shadow as { opacity?: unknown }).opacity ?? 0.35)
  const c = withAlpha(color, Number.isFinite(op) ? op : 0.35)
  return `filter:drop-shadow(${ox}px ${oy}px ${blur}px ${c});`
}

function buildFillStrokeAttrs(
  inst: PdfFigureInstance,
  def: PdfFigureDefinition | undefined,
  gid: string,
  skipFill: boolean,
): { defs: string; fillAttr: string; strokeAttrs: string } {
  const fill = inst.style?.fill
  const fo = fillOpacityFor(inst)
  let defs = ''
  let fillAttr = 'fill="none"'

  if (!skipFill && fill && typeof fill === 'object') {
    if (fill.type === 'none') {
      fillAttr = 'fill="none"'
    } else if (fill.type === 'solid') {
      const c = withAlpha(String((fill as { color?: unknown }).color ?? '#000'), fo)
      fillAttr = `fill="${escapeAttr(c)}"`
    } else if (fill.type === 'linear') {
      const { x1, y1, x2, y2 } = linearGradientEnds(Number((fill as { angle?: unknown }).angle ?? 0))
      const from = withAlpha(String((fill as { from?: unknown }).from ?? '#000'), fo)
      const to = withAlpha(String((fill as { to?: unknown }).to ?? '#fff'), fo)
      defs = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${escapeAttr(from)}"/><stop offset="100%" stop-color="${escapeAttr(to)}"/></linearGradient>`
      fillAttr = `fill="url(#${gid})"`
    }
  } else {
    fillAttr = 'fill="none"'
  }

  const sw = strokeWidthFor(inst)
  const sc = strokeColor(inst)
  let strokeAttrs = ''
  if (sw > 0 && sc) {
    const dash = strokeDashSvg(inst, def)
    const lc = String((inst.style?.stroke as { linecap?: unknown })?.linecap ?? 'round')
    const lj = String((inst.style?.stroke as { linejoin?: unknown })?.linejoin ?? 'miter')
    strokeAttrs = ` stroke="${escapeAttr(sc)}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linecap="${escapeAttr(lc)}" stroke-linejoin="${escapeAttr(lj)}"`
    if (dash) strokeAttrs += ` stroke-dasharray="${escapeAttr(dash)}"`
  }

  return { defs, fillAttr, strokeAttrs }
}

function angleRad(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

function headLenFor(inst: PdfFigureInstance): number {
  const w = strokeWidthFor(inst)
  return 8 + w * 0.8
}

function headWidthFor(inst: PdfFigureInstance): number {
  const w = strokeWidthFor(inst)
  return 5 + w * 0.35
}

function arrowHeadFlat(
  x: number,
  y: number,
  angleRadVal: number,
  headLen: number,
  headWidth: number,
): string {
  const cos = Math.cos(angleRadVal)
  const sin = Math.sin(angleRadVal)
  const bx1 = x - headLen * cos + headWidth * sin
  const by1 = y - headLen * sin - headWidth * cos
  const bx2 = x - headLen * cos - headWidth * sin
  const by2 = y - headLen * sin + headWidth * cos
  return `${x},${y} ${bx1},${by1} ${bx2},${by2}`
}

function arrowHeadPointsEnd(
  inst: PdfFigureInstance,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const a = angleRad(x1, y1, x2, y2)
  const w = strokeWidthFor(inst)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= 1e-6 || !w) return arrowHeadFlat(x2, y2, a, headLenFor(inst), headWidthFor(inst))
  const ux = dx / len
  const uy = dy / len
  const tipX = x2 - ux * (w / 2)
  const tipY = y2 - uy * (w / 2)
  return arrowHeadFlat(tipX, tipY, a, headLenFor(inst), headWidthFor(inst))
}

function arrowHeadPointsStart(
  inst: PdfFigureInstance,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const a = angleRad(x2, y2, x1, y1)
  const w = strokeWidthFor(inst)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len <= 1e-6 || !w) return arrowHeadFlat(x1, y1, a, headLenFor(inst), headWidthFor(inst))
  const ux = dx / len
  const uy = dy / len
  const tipX = x1 - ux * (w / 2)
  const tipY = y1 - uy * (w / 2)
  return arrowHeadFlat(tipX, tipY, a, headLenFor(inst), headWidthFor(inst))
}

function connectorEndSegment(
  inst: PdfFigureInstance,
  figuresById: Record<string, PdfFigureDefinition>,
): { x1: number; y1: number; x2: number; y2: number } {
  const g = (figuresById[inst.figureId]?.geometry as Record<string, unknown>) ?? {}
  const x1 = Number(g.x1 ?? 0)
  const y1 = Number(g.y1 ?? 0)
  const x2 = Number(g.x2 ?? 100)
  const y2 = Number(g.y2 ?? 100)
  const mode = String(g.mode ?? 'straight')
  if (mode === 'elbow') {
    const mx = Number(g.elbowMidX ?? (x1 + x2) / 2)
    const my = Number(g.elbowMidY ?? y1)
    return { x1: mx, y1: my, x2, y2 }
  }
  if (mode === 'curved') {
    const c2x = Number(g.c2x ?? (2 * x1 + x2) / 3)
    const c2y = Number(g.c2y ?? y2)
    return { x1: c2x, y1: c2y, x2, y2 }
  }
  return { x1, y1, x2, y2 }
}

function connectorStartSegment(
  inst: PdfFigureInstance,
  figuresById: Record<string, PdfFigureDefinition>,
): { x1: number; y1: number; x2: number; y2: number } {
  const g = (figuresById[inst.figureId]?.geometry as Record<string, unknown>) ?? {}
  const x1 = Number(g.x1 ?? 0)
  const y1 = Number(g.y1 ?? 0)
  const x2 = Number(g.x2 ?? 100)
  const y2 = Number(g.y2 ?? 100)
  const mode = String(g.mode ?? 'straight')
  if (mode === 'elbow') {
    const mx = Number(g.elbowMidX ?? (x1 + x2) / 2)
    const my = Number(g.elbowMidY ?? y1)
    return { x1, y1, x2: mx, y2: my }
  }
  if (mode === 'curved') {
    const c1x = Number(g.c1x ?? (x1 + x2) / 3)
    const c1y = Number(g.c1y ?? y1)
    return { x1, y1, x2: c1x, y2: c1y }
  }
  return { x1, y1, x2, y2 }
}

function curvedConnectorPathD(inst: PdfFigureInstance, def?: PdfFigureDefinition): string {
  const g = (def?.geometry as Record<string, unknown>) ?? {}
  const x1 = Number(g.x1 ?? 0)
  const y1 = Number(g.y1 ?? 0)
  const x2 = Number(g.x2 ?? 100)
  const y2 = Number(g.y2 ?? 100)
  const c1x = Number(g.c1x ?? (x1 + x2) / 3)
  const c1y = Number(g.c1y ?? y1)
  const c2x = Number(g.c2x ?? (2 * x1 + x2) / 3)
  const c2y = Number(g.c2y ?? y2)
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
}

function safeSvgId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function buildFigureSvgInner(
  inst: PdfFigureInstance,
  def: PdfFigureDefinition | undefined,
  figuresById: Record<string, PdfFigureDefinition>,
): string {
  const kind = geometryKind(def)
  const gid = `g-${safeSvgId(inst.id)}`

  if (kind === 'rect' || kind === 'roundedRect') {
    const r = rectLayoutFromGeometry(def)
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
    const rxRy = kind === 'roundedRect' ? ` rx="${escapeAttr(String(r.rx))}" ry="${escapeAttr(String(r.ry))}"` : ''
    const el = `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"${rxRy} ${fillAttr}${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'ellipse' || kind === 'circle') {
    const e = ellipseParams(def)
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
    const el = `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" ${fillAttr}${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'polygon') {
    const pts = polygonPointsFlat(def)
    if (pts.length < 6) return ''
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
    const p = pts.join(' ')
    const el = `<polygon points="${escapeAttr(p)}" ${fillAttr}${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'star') {
    const s = starPolygonPointsFromGeometry(def)
    const pts = parsePointsStr(s)
    if (pts.length < 6) return ''
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
    const p = pts.join(' ')
    const el = `<polygon points="${escapeAttr(p)}" ${fillAttr}${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'path') {
    const geo = def?.geometry as { d?: unknown }
    const d = String(geo?.d ?? '')
    if (!d) return ''
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
    const el = `<path d="${escapeAttr(d)}" ${fillAttr}${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'line') {
    const geo = def?.geometry as Record<string, unknown>
    const x1 = Number(geo?.x1 ?? 0)
    const y1 = Number(geo?.y1 ?? 0)
    const x2 = Number(geo?.x2 ?? 100)
    const y2 = Number(geo?.y2 ?? 100)
    const head = String(geo?.head ?? 'none')
    if (!inst.style?.stroke?.enabled) return ''
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, true)
    const parts: string[] = []
    if (defs) parts.push(`<defs>${defs}</defs>`)
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${fillAttr}${strokeAttrs} />`)
    const sc = strokeColor(inst)
    if (sc && (head === 'end' || head === 'both')) {
      parts.push(
        `<polygon points="${escapeAttr(arrowHeadPointsEnd(inst, x1, y1, x2, y2))}" fill="${escapeAttr(sc)}" stroke="none" />`,
      )
    }
    if (sc && head === 'both') {
      parts.push(
        `<polygon points="${escapeAttr(arrowHeadPointsStart(inst, x1, y1, x2, y2))}" fill="${escapeAttr(sc)}" stroke="none" />`,
      )
    }
    return parts.join('')
  }

  if (kind === 'polyline' || kind === 'scribble') {
    const ptsStr = polylinePointsFromGeometry(def?.geometry)
    const pts = parsePointsStr(ptsStr)
    if (pts.length < 4) return ''
    const closed = isPolylineGeometryClosed(def?.geometry)
    const p = pts.join(' ')
    if (closed) {
      const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, false)
      const el = `<polygon points="${escapeAttr(p)}" ${fillAttr}${strokeAttrs} />`
      return defs ? `<defs>${defs}</defs>${el}` : el
    }
    const { defs, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, true)
    const el = `<polyline points="${escapeAttr(p)}" fill="none"${strokeAttrs} />`
    return defs ? `<defs>${defs}</defs>${el}` : el
  }

  if (kind === 'connector') {
    const geo = def?.geometry as Record<string, unknown>
    const x1 = Number(geo?.x1 ?? 0)
    const y1 = Number(geo?.y1 ?? 0)
    const x2 = Number(geo?.x2 ?? 100)
    const y2 = Number(geo?.y2 ?? 100)
    const mode = String(geo?.mode ?? 'straight')
    const head = String(geo?.head ?? 'none')
    if (!inst.style?.stroke?.enabled) return ''
    const { defs, fillAttr, strokeAttrs } = buildFillStrokeAttrs(inst, def, gid, true)
    const parts: string[] = []
    if (defs) parts.push(`<defs>${defs}</defs>`)
    const sc = strokeColor(inst)
    if (mode === 'straight') {
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${fillAttr}${strokeAttrs} />`)
    } else if (mode === 'elbow') {
      const mx = Number(geo?.elbowMidX ?? (x1 + x2) / 2)
      const my = Number(geo?.elbowMidY ?? y1)
      const p = `${x1},${y1} ${mx},${my} ${x2},${y2}`
      parts.push(`<polyline points="${escapeAttr(p)}" fill="none" ${strokeAttrs.replace(/^\s/, '')} />`)
    } else if (mode === 'curved') {
      const d = curvedConnectorPathD(inst, def)
      parts.push(`<path d="${escapeAttr(d)}" fill="none" ${strokeAttrs.replace(/^\s/, '')} />`)
    }
    if (sc && (head === 'end' || head === 'both')) {
      const seg = connectorEndSegment(inst, figuresById)
      parts.push(
        `<polygon points="${escapeAttr(arrowHeadPointsEnd(inst, seg.x1, seg.y1, seg.x2, seg.y2))}" fill="${escapeAttr(sc)}" stroke="none" />`,
      )
    }
    if (sc && head === 'both') {
      const seg = connectorStartSegment(inst, figuresById)
      parts.push(
        `<polygon points="${escapeAttr(arrowHeadPointsStart(inst, seg.x1, seg.y1, seg.x2, seg.y2))}" fill="${escapeAttr(sc)}" stroke="none" />`,
      )
    }
    return parts.join('')
  }

  return ''
}

function zNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizeInstance(raw: unknown): PdfFigureInstance | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  const figureId = typeof o.figureId === 'string' ? o.figureId : ''
  if (!id || !figureId) return null
  const x = Number(o.x)
  const y = Number(o.y)
  const w = Number(o.w)
  const h = Number(o.h)
  if (![x, y, w, h].every((n) => Number.isFinite(n))) return null
  const style = (o.style && typeof o.style === 'object' ? o.style : {}) as PdfFigureInstance['style']
  const fill = (style.fill && typeof style.fill === 'object' ? style.fill : { type: 'solid', color: '#3b82f6' }) as FigureFill
  const stroke = (style.stroke && typeof style.stroke === 'object'
    ? style.stroke
    : { enabled: true, color: '#111827', width: 2, dash: 'solid', linecap: 'round', linejoin: 'miter' }) as FigureStroke
  const shadow = style.shadow && typeof style.shadow === 'object' ? (style.shadow as FigureShadow) : undefined
  return {
    id,
    figureId,
    x,
    y,
    w,
    h,
    z: zNum(o.z),
    rotation: Number.isFinite(Number(o.rotation)) ? Number(o.rotation) : 0,
    style: { fill, stroke, shadow },
  }
}

/** Слой с фигурами поверх контента слайда (внутри .booklet-scale-root). */
export function renderPdfFiguresOverlayHtml(
  dataObj: Record<string, unknown>,
  figuresById: Record<string, PdfFigureDefinition>,
): string {
  const raw = dataObj.figures
  if (!Array.isArray(raw) || raw.length === 0) return ''

  const instances = raw.map(normalizeInstance).filter(Boolean) as PdfFigureInstance[]
  if (instances.length === 0) return ''

  instances.sort((a, b) => zNum(a.z) - zNum(b.z))

  const items: string[] = []
  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i]
    const def = figuresById[inst.figureId]
    const inner = buildFigureSvgInner(inst, def, figuresById)
    if (!inner) continue

    const rot = Number.isFinite(inst.rotation ?? 0) ? (inst.rotation ?? 0) : 0
    const shadowCss = shadowFilterCss(inst)
    const zIndex = 20 + i
    items.push(`
    <div class="pdf-fig-item" style="left:${inst.x}%;top:${inst.y}%;width:${inst.w}%;height:${inst.h}%;z-index:${zIndex};transform:rotate(${rot}deg);${shadowCss}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" overflow="visible">${inner}</svg>
    </div>`)
  }

  if (items.length === 0) return ''

  return `<div class="pdf-figures-overlay" aria-hidden="true">${items.join('')}</div>`
}

export function figuresArrayToMap(figs: PdfFigureDefinition[] | undefined): Record<string, PdfFigureDefinition> {
  if (!figs?.length) return {}
  return Object.fromEntries(figs.map((f) => [f.id, f]))
}
