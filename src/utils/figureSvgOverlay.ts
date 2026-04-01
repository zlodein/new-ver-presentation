/**
 * SVG-разметка фигур для оверлея в браузере (те же правила, что и PDF: геометрия 0..100).
 */
import type { FigureDefinition, FigureInstance } from '@/types/figures'
import {
  isPolylineGeometryClosed,
  polylinePointsFromGeometry,
  rectLayoutFromGeometry,
  starPolygonPointsFromGeometry,
} from '@/utils/figureGeometryRender'

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

function geometryKind(def?: FigureDefinition): string {
  const g = def?.geometry
  if (g && typeof g === 'object') {
    const k = (g as { kind?: unknown }).kind
    if (typeof k === 'string' && k) return k
  }
  const top = def?.kind
  return typeof top === 'string' ? top : ''
}

function polygonPointsFlat(def?: FigureDefinition): number[] {
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

function ellipseParams(def?: FigureDefinition): { cx: number; cy: number; rx: number; ry: number } {
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

function fillOpacityFor(inst: FigureInstance): number {
  const fill = inst.style?.fill
  if (!fill || typeof fill !== 'object') return 1
  if ((fill as { type?: string }).type === 'none') return 1
  const o = Number((fill as { opacity?: unknown }).opacity)
  return Number.isFinite(o) ? clamp(o, 0, 1) : 1
}

function strokeWidthFor(inst: FigureInstance): number {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return 0
  if (!stroke.enabled) return 0
  const w = Number((stroke as { width?: unknown }).width ?? 2)
  return Number.isFinite(w) ? Math.max(0, w) : 0
}

function strokeDashSvg(inst: FigureInstance, def?: FigureDefinition): string {
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

function strokeColor(inst: FigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as { color?: unknown }).color ?? '#111827')
}

/** CSS filter для тени (как в PDF-слое). */
export function shadowFilterCssForFigure(inst: FigureInstance): string {
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
  inst: FigureInstance,
  def: FigureDefinition | undefined,
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

function headLenFor(inst: FigureInstance): number {
  const w = strokeWidthFor(inst)
  return 8 + w * 0.8
}

function headWidthFor(inst: FigureInstance): number {
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
  inst: FigureInstance,
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
  inst: FigureInstance,
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
  inst: FigureInstance,
  figuresById: Record<string, FigureDefinition>,
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
  inst: FigureInstance,
  figuresById: Record<string, FigureDefinition>,
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

function curvedConnectorPathD(def?: FigureDefinition): string {
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

export function buildFigureSvgInner(
  inst: FigureInstance,
  def: FigureDefinition | undefined,
  figuresById: Record<string, FigureDefinition>,
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
      const d = curvedConnectorPathD(def)
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
