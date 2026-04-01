import type { FigureInstance } from '@/types/figures'

export const SLIDE_WIDE_BLOCK_ID = 'slide'

export function normalizeFigureBlockId(raw: string | undefined | null): string {
  const s = raw != null && String(raw).trim() ? String(raw).trim() : ''
  return s || SLIDE_WIDE_BLOCK_ID
}

/** Уникальные blockId по фигурам слайда (несколько SVG-оверлеев в просмотре). Без фигур — один слой `slide`. */
export function figureBlockScopesForSlide(slide: { data?: Record<string, unknown> }): string[] {
  const figs = slide.data?.figures
  if (!Array.isArray(figs) || figs.length === 0) return [SLIDE_WIDE_BLOCK_ID]
  const ids = new Set<string>()
  for (const f of figs) {
    ids.add(normalizeFigureBlockId((f as FigureInstance).blockId))
  }
  return Array.from(ids)
}
