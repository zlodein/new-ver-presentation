/**
 * Умные шаблоны (Smart Templates): макеты, адаптируемые под тип недвижимости и аудиторию.
 * При выборе шаблона применяются цвет темы и рекомендуемая структура слайдов.
 * Сетки изображений подстраиваются под количество и соотношение сторон фото в редакторе.
 */

export type PropertyType = 'elite' | 'apartment' | 'commercial' | 'general'
export type AudienceType = 'investors' | 'families' | 'corporate' | 'general'

export interface SmartTemplate {
  id: string
  name: string
  description: string
  propertyType: PropertyType
  audience: AudienceType
  /** Цвет темы (#hex) для подложек и акцентов */
  themeColor: string
  /** Рекомендуемый порядок типов слайдов (если нужен отличный от стандартного) */
  slideTypes?: string[]
}

export const SMART_TEMPLATES: SmartTemplate[] = [
  {
    id: 'elite-investors',
    name: 'Элитная недвижимость — инвесторам',
    description: 'Особняки и премиум-объекты, акцент на статус и детали',
    propertyType: 'elite',
    audience: 'investors',
    themeColor: '#1a1a2e',
  },
  {
    id: 'elite-families',
    name: 'Элитная недвижимость — семьям',
    description: 'Премиум для семейного просмотра, тёплые акценты',
    propertyType: 'elite',
    audience: 'families',
    themeColor: '#2c5f4f',
  },
  {
    id: 'apartment-families',
    name: 'Квартиры — молодым семьям',
    description: 'Типовые и новостройки, удобство и инфраструктура',
    propertyType: 'apartment',
    audience: 'families',
    themeColor: '#2563eb',
  },
  {
    id: 'apartment-general',
    name: 'Квартиры — универсальный',
    description: 'Нейтральный макет под любую аудиторию',
    propertyType: 'apartment',
    audience: 'general',
    themeColor: '#64748b',
  },
  {
    id: 'commercial-corporate',
    name: 'Коммерческая недвижимость',
    description: 'Офисы, склады, ритейл — для корпоративных клиентов',
    propertyType: 'commercial',
    audience: 'corporate',
    themeColor: '#0f766e',
  },
  {
    id: 'general',
    name: 'Универсальный',
    description: 'Любой тип объекта и аудитория',
    propertyType: 'general',
    audience: 'general',
    themeColor: '#465FFF',
  },
]

export function getSmartTemplateById(id: string | null | undefined): SmartTemplate | undefined {
  if (!id) return undefined
  return SMART_TEMPLATES.find((t) => t.id === id)
}

/** Ключ стиля для data-booklet-template: по id шаблона возвращает elite | apartment | commercial | general */
export function getTemplateStyleKey(templateId: string | null | undefined): string {
  if (!templateId) return 'general'
  const t = getSmartTemplateById(templateId)
  return t?.propertyType ?? 'general'
}
