/**
 * Утилиты для pixel-perfect рендера шаблона №1 по данным из slides.json (960×540).
 */

import template1LayoutJson from './template-1-layout.json'

export type LayoutElement = {
  type: string
  top: number
  left: number
  width: number
  height: number
  fill?: { type: string; value: string }
  color?: string
}

export type LayoutSlide = {
  fill?: { type: string; value: string }
  elements: Array<LayoutElement & { placeholder?: string }>
  layoutElements: LayoutElement[]
}

type LayoutJson = {
  size: { width: number; height: number }
  themeColors?: string[]
  slides?: LayoutSlide[]
}
const template1Layout = template1LayoutJson as LayoutJson

const LAYOUT_W = template1Layout.size?.width ?? 960
const LAYOUT_H = template1Layout.size?.height ?? 540

export const TEMPLATE_1_THEME_COLORS = template1Layout.themeColors ?? []

/** Слайд по индексу (0 = обложка, 1 = описание, …) */
export function getTemplate1Slide(slideIndex: number): LayoutSlide | undefined {
  return template1Layout.slides?.[slideIndex]
}

/** Перевод координат из 960×540 в проценты для position: absolute */
export function toPercent(left: number, top: number, width: number, height: number) {
  return {
    left: (left / LAYOUT_W) * 100,
    top: (top / LAYOUT_H) * 100,
    width: (width / LAYOUT_W) * 100,
    height: (height / LAYOUT_H) * 100,
  }
}

export function getShapeStyle(el: LayoutElement): Record<string, string> {
  const { left, top, width, height } = toPercent(el.left, el.top, el.width, el.height)
  const style: Record<string, string> = {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    margin: '0',
    padding: '0',
    pointerEvents: 'none',
  }
  const color = el.fill?.value ?? el.color
  if (color) {
    style.backgroundColor = color
  }
  return style
}
