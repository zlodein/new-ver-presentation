/** Настройки публичных страниц (хранятся в server/data/page-settings.json по ключу pageId). */

export interface HomeSliderSlide {
  title: string
  description: string
  bgImageDesktop?: string | null
  bgImageMobile?: string | null
  buttons: { text: string; href: string }[]
}

export interface HomePageSettings {
  slider?: {
    slides: HomeSliderSlide[]
  }
}

export type DemoCategory = 'city' | 'country' | 'commercial'

export interface DemoCatalogItem {
  id: string
  category: DemoCategory
  title: string
  blurb: string
  /** URL PDF для превью (например /uploads/.../demo.pdf или абсолютный URL) */
  pdfUrl: string
  /** Публичная страница просмотра (например /view/abc123/slug или полный URL) */
  publicViewUrl: string
}

export interface PresentationsPageSettings {
  kicker?: string
  heroTitle?: string
  heroSubtitle?: string
  primaryCta?: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  faq?: { q: string; a: string }[]
  catalog?: DemoCatalogItem[]
}

export interface ContactsPageSettings {
  pageTitle?: string
  intro?: string
  legalAddress?: string
  email?: string
  phone?: string
  supportHours?: string
  requisitesNote?: string
}
