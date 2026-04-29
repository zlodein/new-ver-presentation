/** Идентификаторы буклетных шаблонов (settings.template) */
export const BOOKLET_TEMPLATE_BASIC = 'basic'
export const BOOKLET_TEMPLATE_URBAN_REAL_ESTATE = 'urban_real_estate'
export const BOOKLET_TEMPLATE_UNIVERSAL = 'universal'

/** Устаревший id; при загрузке заменяется на BOOKLET_TEMPLATE_URBAN_REAL_ESTATE */
const LEGACY_TEMPLATE_CITY = 'city'

/** Нормализует id шаблона после загрузки из API / localStorage */
export function normalizeBookletTemplateId(raw: string | null | undefined): string {
  const t = (raw ?? '').trim()
  if (t === LEGACY_TEMPLATE_CITY) return BOOKLET_TEMPLATE_URBAN_REAL_ESTATE
  if (
    t === BOOKLET_TEMPLATE_BASIC ||
    t === BOOKLET_TEMPLATE_URBAN_REAL_ESTATE ||
    t === BOOKLET_TEMPLATE_UNIVERSAL
  ) {
    return t
  }
  return BOOKLET_TEMPLATE_BASIC
}

/** Стили «городской недвижимости» (бывш. city) */
export function isUrbanRealEstateBookletTemplate(id: string | null | undefined): boolean {
  return normalizeBookletTemplateId(id) === BOOKLET_TEMPLATE_URBAN_REAL_ESTATE
}
