import type { InjectionKey } from 'vue'
import type { SlideItem } from '@/types/presentationSlide'

export type DadataSuggestionItem = { value: string; geo_lat?: number; geo_lon?: number }

/** Контекст для тела слайда (inject в slide-blocks/PresentationEditorSlideBlock*.vue) */
export type PresentationEditorSlideInject = {
  canEditImages: boolean
  generateTextLoading: string | null
  dadataToken: string
  dadataLoadingBySlideId: Record<string, boolean>
  dadataSuggestionsBySlideId: Record<string, DadataSuggestionItem[]>
  activeDadataSlideId: string | null
  dadataDropdownStyle: Record<string, string>
  hasCompanyBlockFilled: boolean
  showAdditionalTextInput: boolean
  hasCompanyWebsite: boolean
  CURRENCIES: Array<{ code: string; symbol: string }>
  coverPriceValue: (slide: SlideItem) => string
  coverPricePlaceholder: (slide: SlideItem) => string
  onCoverPriceInput: (slide: SlideItem, value: string) => void
  onCoverCurrencyChange: (slide: SlideItem, event: Event) => void
  coverConvertedPrices: (slide: SlideItem) => string[]
  getBlockLayout: (slide: SlideItem) => string
  getImageGrid: (slide: SlideItem) => string
  descriptionImages: (slide: SlideItem) => string[]
  onDescriptionImageUpload: (slide: SlideItem, event: Event, index: number) => void | Promise<void>
  infrastructureImages: (slide: SlideItem) => string[]
  onInfrastructureImageUpload: (slide: SlideItem, event: Event, index: number) => void | Promise<void>
  setLocationInputRef: (slideId: string, el: HTMLInputElement | null) => void
  onLocationAddressInput: (slide: SlideItem, v: string) => void
  onLocationAddressFocus: (slide: SlideItem) => void
  onLocationAddressBlur: () => void
  applyDadataSuggestion: (slide: SlideItem, item: DadataSuggestionItem) => void
  locationMetroLoading: (slide: SlideItem) => boolean
  findNearestMetro: (slide: SlideItem) => void | Promise<void>
  galleryImages3: (slide: SlideItem) => string[]
  onGalleryImageUpload: (slide: SlideItem, event: Event, index: number) => void | Promise<void>
  charItems: (slide: SlideItem) => Array<{ label: string; value: string }>
  removeCharacteristicItem: (slide: SlideItem, index: number) => void
  addCharacteristicItem: (slide: SlideItem) => void
  layoutImages: (slide: SlideItem) => string[]
  onLayoutImageUpload: (slide: SlideItem, event: Event, index: number) => void | Promise<void>
  onSingleImageUpload: (slide: SlideItem, event: Event, field: string) => void | Promise<void>
  openPalettePopup: (slideId: string, event: MouseEvent) => void
  generateTextWithAI: (slide: SlideItem, type: 'description' | 'infrastructure') => void | Promise<void>
  contactsAvatarDisplayUrl: (slide: SlideItem) => string
  onContactsAvatarUpload: (slide: SlideItem, event: Event) => void | Promise<void>
  contactsImageDisplayUrl: (slide: SlideItem) => string
  onContactsImageUpload: (slide: SlideItem, event: Event, index: number) => void | Promise<void>
  onPhoneInput: (slide: SlideItem, event: Event) => void
  customSlidePageStyle: (slide: SlideItem) => Record<string, string | number>
  customBlockTag: (blockType: string) => string
  customBlockStyle: (style: unknown) => Record<string, string | number>
}

export const PRESENTATION_EDITOR_SLIDE_KEY = Symbol('presentationEditorSlide') as InjectionKey<
  PresentationEditorSlideInject
>
