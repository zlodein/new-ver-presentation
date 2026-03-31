/** Числовое z фигуры (экземпляра) */
export function figureZNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Меняет порядок фигуры в стеке относительно соседа выше (delta положительный) или ниже (delta отрицательный).
 * При разных z — обмен z; при равных z — обмен позициями в массиве (стабильный порядок сортировки).
 */
export function swapFigureStackOrder(figures: { id?: string; z?: unknown }[], id: string, delta: number): boolean {
  if (!Array.isArray(figures) || figures.length < 2) return false
  const indexed = figures.map((f, i) => ({ f, i }))
  indexed.sort((a, b) => {
    const zd = figureZNum(a.f?.z) - figureZNum(b.f?.z)
    if (zd !== 0) return zd
    return a.i - b.i
  })
  const pos = indexed.findIndex((x) => x.f?.id === id)
  if (pos < 0) return false
  const targetPos = delta > 0 ? pos + 1 : pos - 1
  if (targetPos < 0 || targetPos >= indexed.length) return false
  const A = indexed[pos].f as { z?: unknown }
  const B = indexed[targetPos].f as { z?: unknown }
  const ia = indexed[pos].i
  const ib = indexed[targetPos].i
  const za = figureZNum(A.z)
  const zb = figureZNum(B.z)
  if (za !== zb) {
    const t = A.z
    A.z = B.z
    B.z = t
  } else {
    ;[figures[ia], figures[ib]] = [figures[ib], figures[ia]]
  }
  return true
}
