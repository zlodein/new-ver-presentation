export type FigureGeometry =
  | { kind: 'rect'; rx?: number }
  | { kind: 'ellipse'; cx?: number; cy?: number; rx: number; ry: number }
  | { kind: 'polygon'; points: Array<[number, number]> }
  | { kind: 'roundedRect'; rx: number }
  | { kind: 'circle'; cx?: number; cy?: number; r: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; head?: 'none' | 'end' | 'both' }
  | { kind: 'polyline'; points: Array<[number, number]>; closed?: boolean }
  | { kind: 'star'; points: number; innerRatio?: number }
  | { kind: 'path'; d: string }
  | {
      kind: 'connector'
      mode: 'straight' | 'elbow' | 'curved'
      x1: number
      y1: number
      x2: number
      y2: number
      /** Для elbow: точка изгиба (в координатах 0..100). */
      elbowMidX?: number
      elbowMidY?: number
      /** Для curved: контрольные точки кубической кривой. */
      c1x?: number
      c1y?: number
      c2x?: number
      c2y?: number
      head?: 'none' | 'end' | 'both'
    }
  | { kind: 'scribble'; points: Array<[number, number]> }

export interface FigureDefinition {
  id: string
  name: string
  kind: string
  geometry: FigureGeometry | Record<string, unknown>
}

export type FigureFillStyle =
  | { type: 'none' }
  | { type: 'solid'; color: string; opacity?: number }
  | { type: 'linear'; from: string; to: string; angle: number; opacity?: number }

export type FigureStrokeDash = 'solid' | 'dashed' | 'dotted'
export type FigureStrokeLinecap = 'butt' | 'round' | 'square'
export type FigureStrokeLinejoin = 'miter' | 'round' | 'bevel'

export interface FigureStrokeStyle {
  enabled: boolean
  color: string
  width: number
  dash: FigureStrokeDash
  linecap: FigureStrokeLinecap
  linejoin: FigureStrokeLinejoin
}

export interface FigureShadowStyle {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
  opacity: number
}

export interface FigureStyle {
  fill: FigureFillStyle
  stroke: FigureStrokeStyle
  shadow?: FigureShadowStyle
}

export interface FigureInstance {
  id: string
  figureId: string
  /** Локальный snapshot геометрии, чтобы фигура рендерилась в view/PDF без отдельной загрузки библиотеки фигур. */
  figureDef?: FigureDefinition
  /**
   * Область шаблона (data-editor-block): позиции x,y,w,h в процентах 0..100 от этой области.
   * Без поля или `slide` — весь контент слайда (.booklet-content).
   */
  blockId?: string
  /** Позиция и размер в процентах от контейнера (слайд или блок): 0..100 */
  x: number
  y: number
  w: number
  h: number
  /** Уровень отрисовки */
  z?: number
  rotation?: number
  style: FigureStyle
}

