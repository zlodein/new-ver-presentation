import Konva from 'konva'
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

export function geometryKind(def?: FigureDefinition): string {
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

function strokeWidthFor(inst: FigureInstance): number {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return 0
  if (!stroke.enabled) return 0
  const w = Number((stroke as { width?: unknown }).width ?? 2)
  return Number.isFinite(w) ? Math.max(0, w) : 0
}

function strokeDashKonva(inst: FigureInstance, def?: FigureDefinition): number[] | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  const dash = String((stroke as { dash?: unknown }).dash ?? 'solid')
  if (dash === 'dashed') return [6, 4]
  if (dash === 'dotted') return [2, 3]
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
        return nums.length ? nums : undefined
      }
    }
    return undefined
  }
  return undefined
}

function strokeColor(inst: FigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as { color?: unknown }).color ?? '#111827')
}

function strokeLinecap(inst: FigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as { linecap?: unknown }).linecap ?? 'round')
}

function strokeLinejoin(inst: FigureInstance): string | undefined {
  const stroke = inst.style?.stroke
  if (!stroke || typeof stroke !== 'object') return undefined
  if (!stroke.enabled) return undefined
  return String((stroke as { linejoin?: unknown }).linejoin ?? 'miter')
}

function fillOpacityFor(inst: FigureInstance): number {
  const fill = inst.style?.fill
  if (!fill || typeof fill !== 'object') return 1
  if ((fill as { type?: string }).type === 'none') return 1
  const o = Number((fill as { opacity?: unknown }).opacity)
  return Number.isFinite(o) ? clamp(o, 0, 1) : 1
}

/** Konva не имеет fillOpacity; смешиваем альфу в цвет (solid / градиент). */
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

function applyShadow(node: Konva.Shape, inst: FigureInstance) {
  const shadow = inst.style?.shadow
  if (!shadow || typeof shadow !== 'object' || !shadow.enabled) {
    node.shadowBlur(0)
    node.shadowOffset({ x: 0, y: 0 })
    node.shadowOpacity(0)
    return
  }
  node.shadowColor(String((shadow as { color?: unknown }).color ?? '#000000'))
  node.shadowBlur(Number((shadow as { blur?: unknown }).blur ?? 4))
  node.shadowOffset({
    x: Number((shadow as { offsetX?: unknown }).offsetX ?? 2),
    y: Number((shadow as { offsetY?: unknown }).offsetY ?? 2),
  })
  node.shadowOpacity(Number((shadow as { opacity?: unknown }).opacity ?? 0.35))
}

function applyFillStroke(
  shape: Konva.Shape,
  inst: FigureInstance,
  def: FigureDefinition | undefined,
  opts?: { skipFill?: boolean },
) {
  const fill = inst.style?.fill
  const fo = fillOpacityFor(inst)
  shape.fillEnabled(!opts?.skipFill)

  if (!opts?.skipFill && fill && typeof fill === 'object') {
    if (fill.type === 'none') {
      shape.fill(undefined)
    } else if (fill.type === 'solid') {
      const c = String((fill as { color?: unknown }).color ?? '#000')
      shape.fill(withAlpha(c, fo))
    } else if (fill.type === 'linear') {
      const { x1, y1, x2, y2 } = linearGradientEnds(Number((fill as { angle?: unknown }).angle ?? 0))
      shape.fillLinearGradientStartPoint({ x: x1, y: y1 })
      shape.fillLinearGradientEndPoint({ x: x2, y: y2 })
      const from = withAlpha(String((fill as { from?: unknown }).from ?? '#000'), fo)
      const to = withAlpha(String((fill as { to?: unknown }).to ?? '#fff'), fo)
      shape.fillLinearGradientColorStops([0, from, 1, to])
    }
  } else if (!opts?.skipFill) {
    shape.fill(undefined)
  }

  const sw = strokeWidthFor(inst)
  const sc = strokeColor(inst)
  if (sw > 0 && sc) {
    // Как vector-effect="non-scaling-stroke" в SVG: толщина в px, геометрия в 0–100 растягивается отдельно
    shape.strokeScaleEnabled(false)
    shape.stroke(sc)
    shape.strokeWidth(sw)
    const dash = strokeDashKonva(inst, def)
    if (dash?.length) shape.dash(dash)
    else shape.dash([])
    const lc = strokeLinecap(inst)
    if (lc) shape.lineCap(lc as 'butt' | 'round' | 'square')
    const lj = strokeLinejoin(inst)
    if (lj) shape.lineJoin(lj as 'miter' | 'round' | 'bevel')
  } else {
    shape.stroke(undefined)
    shape.strokeWidth(0)
    shape.dash([])
    shape.strokeScaleEnabled(true)
  }
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
): number[] {
  const cos = Math.cos(angleRadVal)
  const sin = Math.sin(angleRadVal)
  const bx1 = x - headLen * cos + headWidth * sin
  const by1 = y - headLen * sin - headWidth * cos
  const bx2 = x - headLen * cos - headWidth * sin
  const by2 = y - headLen * sin + headWidth * cos
  return [x, y, bx1, by1, bx2, by2]
}

function arrowHeadPointsEnd(
  inst: FigureInstance,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number[] {
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
): number[] {
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

function curvedConnectorPathD(inst: FigureInstance, def?: FigureDefinition): string {
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

/**
 * У части SVG-геометрий есть внутренние поля в viewBox (не 0..100 по фактическому контуру).
 * Нормализуем контур к 0..100, чтобы визуально фигура могла прилегать к границам bbox в редакторе.
 */
function normalizeFigureGroupToUnitBox(group: Konva.Group): Konva.Group {
  if (!group.getChildren().length) return group
  const box = group.getClientRect({ skipShadow: true, skipStroke: false })
  if (!Number.isFinite(box.width) || !Number.isFinite(box.height)) return group
  if (box.width <= 1e-6 || box.height <= 1e-6) return group
  const sx = 100 / box.width
  const sy = 100 / box.height
  group.x(-box.x * sx)
  group.y(-box.y * sy)
  group.scaleX(sx)
  group.scaleY(sy)
  return group
}

/**
 * Содержимое фигуры в локальных координатах 0..100 (как прежний SVG viewBox).
 * Поворот и масштаб под проценты слайда задаётся снаружи.
 */
export function buildFigureContentGroup(
  inst: FigureInstance,
  figuresById: Record<string, FigureDefinition>,
): Konva.Group {
  const def = figuresById[inst.figureId] ?? (inst.figureDef as FigureDefinition | undefined)
  const g = new Konva.Group({ listening: false })
  const kind = geometryKind(def)

  if (kind === 'rect' || kind === 'roundedRect') {
    const r = rectLayoutFromGeometry(def)
    const cr =
      kind === 'roundedRect'
        ? r.rx !== r.ry
          ? ([r.rx, r.ry, r.rx, r.ry] as [number, number, number, number])
          : r.rx
        : r.rx || r.ry
    const shape = new Konva.Rect({
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      cornerRadius: cr,
      listening: false,
    })
    applyFillStroke(shape, inst, def)
    applyShadow(shape, inst)
    g.add(shape)
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'ellipse' || kind === 'circle') {
    const e = ellipseParams(def)
    const shape = new Konva.Ellipse({
      x: e.cx,
      y: e.cy,
      radiusX: e.rx,
      radiusY: e.ry,
      listening: false,
    })
    applyFillStroke(shape, inst, def)
    applyShadow(shape, inst)
    g.add(shape)
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'polygon') {
    const pts = polygonPointsFlat(def)
    if (pts.length >= 6) {
      const shape = new Konva.Line({
        points: pts,
        closed: true,
        listening: false,
      })
      applyFillStroke(shape, inst, def)
      applyShadow(shape, inst)
      g.add(shape)
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'star') {
    const s = starPolygonPointsFromGeometry(def)
    const pts = parsePointsStr(s)
    if (pts.length >= 6) {
      const shape = new Konva.Line({
        points: pts,
        closed: true,
        listening: false,
      })
      applyFillStroke(shape, inst, def)
      applyShadow(shape, inst)
      g.add(shape)
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'path') {
    const geo = def?.geometry as { d?: unknown }
    const d = String(geo?.d ?? '')
    if (d) {
      const shape = new Konva.Path({
        data: d,
        listening: false,
      })
      applyFillStroke(shape, inst, def)
      applyShadow(shape, inst)
      g.add(shape)
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'line') {
    const geo = def?.geometry as Record<string, unknown>
    const x1 = Number(geo?.x1 ?? 0)
    const y1 = Number(geo?.y1 ?? 0)
    const x2 = Number(geo?.x2 ?? 100)
    const y2 = Number(geo?.y2 ?? 100)
    const head = String(geo?.head ?? 'none')
    if (inst.style?.stroke?.enabled) {
      const line = new Konva.Line({
        points: [x1, y1, x2, y2],
        closed: false,
        listening: false,
      })
      applyFillStroke(line, inst, def, { skipFill: true })
      line.fill(undefined)
      applyShadow(line, inst)
      const sw = strokeWidthFor(inst)
      line.hitStrokeWidth(Math.max(16, sw || 8))
      g.add(line)
      const sc = strokeColor(inst)
      if (head === 'end' || head === 'both') {
        const tri = new Konva.Line({
          points: arrowHeadPointsEnd(inst, x1, y1, x2, y2),
          closed: true,
          fill: sc,
          stroke: undefined,
          strokeWidth: 0,
          listening: false,
        })
        applyShadow(tri, inst)
        g.add(tri)
      }
      if (head === 'both') {
        const tri = new Konva.Line({
          points: arrowHeadPointsStart(inst, x1, y1, x2, y2),
          closed: true,
          fill: sc,
          stroke: undefined,
          strokeWidth: 0,
          listening: false,
        })
        applyShadow(tri, inst)
        g.add(tri)
      }
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'polyline' || kind === 'scribble') {
    const ptsStr = polylinePointsFromGeometry(def?.geometry)
    const pts = parsePointsStr(ptsStr)
    if (pts.length >= 4) {
      const closed = isPolylineGeometryClosed(def?.geometry)
      const shape = new Konva.Line({
        points: pts,
        closed,
        listening: false,
      })
      applyFillStroke(shape, inst, def, { skipFill: !closed })
      if (!closed) shape.fill(undefined)
      applyShadow(shape, inst)
      const sw = strokeWidthFor(inst)
      shape.hitStrokeWidth(Math.max(16, sw || 8))
      g.add(shape)
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  if (kind === 'connector') {
    const geo = def?.geometry as Record<string, unknown>
    const x1 = Number(geo?.x1 ?? 0)
    const y1 = Number(geo?.y1 ?? 0)
    const x2 = Number(geo?.x2 ?? 100)
    const y2 = Number(geo?.y2 ?? 100)
    const mode = String(geo?.mode ?? 'straight')
    const head = String(geo?.head ?? 'none')
    if (inst.style?.stroke?.enabled) {
      if (mode === 'straight') {
        const line = new Konva.Line({
          points: [x1, y1, x2, y2],
          closed: false,
          listening: false,
        })
        applyFillStroke(line, inst, def, { skipFill: true })
        line.fill(undefined)
        applyShadow(line, inst)
        const sw = strokeWidthFor(inst)
        line.hitStrokeWidth(Math.max(16, sw || 8))
        g.add(line)
      } else if (mode === 'elbow') {
        const mx = Number(geo?.elbowMidX ?? (x1 + x2) / 2)
        const my = Number(geo?.elbowMidY ?? y1)
        const line = new Konva.Line({
          points: [x1, y1, mx, my, x2, y2],
          closed: false,
          listening: false,
        })
        applyFillStroke(line, inst, def, { skipFill: true })
        line.fill(undefined)
        applyShadow(line, inst)
        const sw = strokeWidthFor(inst)
        line.hitStrokeWidth(Math.max(16, sw || 8))
        g.add(line)
      } else if (mode === 'curved') {
        const path = new Konva.Path({
          data: curvedConnectorPathD(inst, def),
          listening: false,
        })
        applyFillStroke(path, inst, def, { skipFill: true })
        path.fill(undefined)
        applyShadow(path, inst)
        const sw = strokeWidthFor(inst)
        path.strokeWidth(sw)
        path.hitStrokeWidth(Math.max(16, sw || 8))
        g.add(path)
      }
      const sc = strokeColor(inst)
      if (head === 'end' || head === 'both') {
        const seg = connectorEndSegment(inst, figuresById)
        const tri = new Konva.Line({
          points: arrowHeadPointsEnd(inst, seg.x1, seg.y1, seg.x2, seg.y2),
          closed: true,
          fill: sc,
          stroke: undefined,
          strokeWidth: 0,
          listening: false,
        })
        applyShadow(tri, inst)
        g.add(tri)
      }
      if (head === 'both') {
        const seg = connectorStartSegment(inst, figuresById)
        const tri = new Konva.Line({
          points: arrowHeadPointsStart(inst, seg.x1, seg.y1, seg.x2, seg.y2),
          closed: true,
          fill: sc,
          stroke: undefined,
          strokeWidth: 0,
          listening: false,
        })
        applyShadow(tri, inst)
        g.add(tri)
      }
    }
    return normalizeFigureGroupToUnitBox(g)
  }

  return normalizeFigureGroupToUnitBox(g)
}
