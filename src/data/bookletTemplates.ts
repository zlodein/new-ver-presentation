/** Идентификаторы буклетных шаблонов (settings.template) */
export const BOOKLET_TEMPLATE_BASIC = 'basic'
export const BOOKLET_TEMPLATE_UNIVERSAL = 'universal'

/** Нормализует id шаблона после загрузки из API / localStorage */
export function normalizeBookletTemplateId(raw: string | null | undefined): string {
  const t = (raw ?? '').trim().toLowerCase()
  if (t === BOOKLET_TEMPLATE_BASIC || t === BOOKLET_TEMPLATE_UNIVERSAL) return t
  return BOOKLET_TEMPLATE_BASIC
}
