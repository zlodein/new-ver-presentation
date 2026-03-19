/** Элемент слайда в редакторе презентации */
export interface SlideItem {
  id: string
  type: string
  data: Record<string, unknown>
  hidden?: boolean
}
