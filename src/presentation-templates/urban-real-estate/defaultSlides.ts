import type { SlideItem } from '@/types/presentationSlide'
import { DEFAULT_BOOKLET_SLIDE_ORDER } from '@/presentation-templates/defaultSlideTypes'
import { genSlideId } from '@/presentation-templates/basic/defaultSlides'

/**
 * Начальный набор слайдов для шаблона «Городская недвижимость».
 * Полная копия структуры базового шаблона — правки можно вносить независимо.
 */
export function createDefaultSlidesUrbanRealEstate(): SlideItem[] {
  return DEFAULT_BOOKLET_SLIDE_ORDER.map((type) => ({
    id: genSlideId(),
    type,
    data:
      type === 'cover'
        ? {
            figures: [],
            title: 'Новая презентация',
            subtitle: '',
            deal_type: 'Аренда',
            currency: 'RUB',
            price_value: 0,
            show_all_currencies: false,
          }
        : type === 'location'
          ? { figures: [], heading: 'Местоположение', address: '', lat: 55.755864, lng: 37.617698, show_metro: true, metro_stations: [] }
          : { figures: [] },
    hidden: false,
  }))
}
