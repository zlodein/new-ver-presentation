/**
 * Шаблоны оформления презентаций.
 * Стили (цвета, шрифты) берутся из JSON, сгенерированных из PPTX; контент (текст, изображения, данные) остаётся редактируемым.
 */

export interface PresentationTemplate {
  id: string
  name: string
  /** Основной цвет темы (#hex) для подложек и акцентов */
  themeColor: string
  /** Дополнительные цвета из темы PPTX (для акцентов, границ и т.д.) */
  themeColors?: string[]
  /** Шрифт (значение для font-family), если задан — подставляется в настройки */
  fontFamily?: string
  /** Скругление изображений (например '8px'), опционально */
  imageBorderRadius?: string
  /** Рамка изображения: none | default | minimal | vintage | polaroid */
  imageFrame?: string
  /** Размеры шрифтов (опционально) */
  fontSizeHeading?: string
  fontSizeText?: string
  fontSizePrice?: string
  fontSizePresentationTitle?: string
}

/** Шаблон по умолчанию — без переопределения стилей из шаблона */
export const DEFAULT_TEMPLATE_ID = ''

/** Шаблон №1: оформление из pptx-json/slides.json (themeColors: #632423, #B51200, #FD1B17, #F9EBE5, #03C9C6, #01B9D1) */
export const TEMPLATE_1_THEME_COLORS = [
  '#632423',
  '#B51200',
  '#FD1B17',
  '#F9EBE5',
  '#03C9C6',
  '#01B9D1',
] as const

export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: 'По умолчанию',
    themeColor: '#fcfcfc',
  },
  {
    id: 'template-1',
    name: 'Шаблон №1',
    themeColor: TEMPLATE_1_THEME_COLORS[0] ?? '#632423',
    themeColors: [...TEMPLATE_1_THEME_COLORS],
    fontFamily: '"Open Sans", sans-serif',
    imageBorderRadius: '8px',
    imageFrame: 'minimal',
    fontSizeHeading: '38px',
    fontSizeText: '20px',
    fontSizePrice: '20px',
    fontSizePresentationTitle: '38px',
  },
]

export function getPresentationTemplateById(id: string | null | undefined): PresentationTemplate | undefined {
  if (id == null || id === '') return PRESENTATION_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? undefined
  return PRESENTATION_TEMPLATES.find((t) => t.id === id)
}

/** Применить стили шаблона к объекту настроек (поля шаблона перезаписывают только если в шаблоне заданы) */
export function applyTemplateToSettings(
  settings: Record<string, string>,
  templateId: string | null | undefined
): Record<string, string> {
  const template = getPresentationTemplateById(templateId)
  if (!template || template.id === DEFAULT_TEMPLATE_ID) return settings
  const out = { ...settings }
  if (template.themeColor) out.themeColor = template.themeColor
  if (template.fontFamily) out.fontFamily = template.fontFamily
  if (template.imageBorderRadius != null) out.imageBorderRadius = template.imageBorderRadius
  if (template.imageFrame != null) out.imageFrame = template.imageFrame
  if (template.fontSizeHeading) out.fontSizeHeading = template.fontSizeHeading
  if (template.fontSizeText) out.fontSizeText = template.fontSizeText
  if (template.fontSizePrice) out.fontSizePrice = template.fontSizePrice
  if (template.fontSizePresentationTitle) out.fontSizePresentationTitle = template.fontSizePresentationTitle
  return out
}

/** CSS-переменные для дополнительных цветов темы (--theme-color-1 … --theme-color-6) для использования в стилях шаблона */
export function getTemplateThemeCssVars(templateId: string | null | undefined): Record<string, string> {
  const template = getPresentationTemplateById(templateId)
  const colors = template?.themeColors
  if (!colors || colors.length === 0) return {}
  const vars: Record<string, string> = {}
  colors.forEach((hex, i) => {
    vars[`--theme-color-${i + 1}`] = hex
  })
  return vars
}
