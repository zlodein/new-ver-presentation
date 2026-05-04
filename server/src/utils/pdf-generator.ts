import puppeteer from 'puppeteer'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ViewSlideItem } from './types.js'
import type { PdfFigureDefinition } from './pdf-figure-definitions.js'
import { figuresArrayToMap, renderPdfFiguresOverlayHtml } from './pdf-figures-html.js'

const YANDEX_STATIC_API_KEY = process.env.YANDEX_STATIC_API_KEY ?? ''
const CURRENT_FILE_DIR = dirname(fileURLToPath(import.meta.url))
const UNIVERSAL_TEMPLATE_CSS_PATHS = [
  resolve(process.cwd(), 'src/assets/booklet-template-universal.css'),
  resolve(process.cwd(), '../src/assets/booklet-template-universal.css'),
  resolve(process.cwd(), '../../src/assets/booklet-template-universal.css'),
  resolve(CURRENT_FILE_DIR, '../../../src/assets/booklet-template-universal.css'),
  resolve(CURRENT_FILE_DIR, '../../../../src/assets/booklet-template-universal.css'),
]

function readUniversalTemplateCss(): string {
  for (const path of UNIVERSAL_TEMPLATE_CSS_PATHS) {
    try {
      if (existsSync(path)) return readFileSync(path, 'utf8')
    } catch {
      // Пробуем следующий кандидат.
    }
  }
  return ''
}

/** URL статичной карты для PDF (Static API Яндекс.Карт) */
function getStaticMapImageUrl(lat: number, lng: number, width = 400, height = 300, zoom = 16): string {
  const ll = `${lng},${lat}`
  const size = `${width},${height}`
  const pt = `${lng},${lat}`
  let url = `https://static-maps.yandex.ru/1.x/?ll=${ll}&size=${size}&z=${zoom}&l=map&pt=${pt}`
  if (YANDEX_STATIC_API_KEY) url += `&apikey=${encodeURIComponent(YANDEX_STATIC_API_KEY)}`
  return url
}

interface PresentationData {
  id: string
  title: string
  coverImage?: string
  content: {
    slides: ViewSlideItem[]
    settings?: {
      template?: string
      fontFamily?: string
      themeColor?: string
      imageFrame?: string
    }
  }
  /** Библиотека фигур из БД — для отрисовки slide.data.figures в PDF */
  figureDefinitions?: PdfFigureDefinition[]
}

// A4 альбомная в пикселях (96 DPI): 297mm × 210mm — один слайд = один лист
const A4_LANDSCAPE_WIDTH = Math.round((297 / 25.4) * 96)   // 1123
const A4_LANDSCAPE_HEIGHT = Math.round((210 / 25.4) * 96)  // 794

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Нормализует массив изображений (строка или { url }) в массив URL для img src */
function toImageUrls(arr: unknown[], limit: number): string[] {
  if (!Array.isArray(arr)) return []
  const out: string[] = []
  for (let i = 0; i < Math.min(limit, arr.length); i++) {
    const v = arr[i]
    const u = typeof v === 'string' ? v : (v as { url?: string })?.url
    out.push(u ? String(u) : '')
  }
  while (out.length < limit) out.push('')
  return out.slice(0, limit)
}

/** Превращает относительный URL (например /uploads/...) в абсолютный для загрузки в Puppeteer */
function toAbsoluteImageUrl(url: string, baseUrl: string): string {
  if (!url || !url.trim()) return url
  const u = url.trim()
  if (u.startsWith('data:') || u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return baseUrl.replace(/\/$/, '') + u
  return baseUrl.replace(/\/$/, '') + '/' + u
}

/** Как во Vue: из API может прийти строка "true" / "1" */
function settingBool(v: unknown): boolean {
  if (v === true || v === 1) return true
  if (typeof v === 'string') return v === 'true' || v === '1' || v.toLowerCase() === 'yes'
  return false
}

/** Иконки мессенджеров — те же пути, что в MessengerIcons.vue (для PDF с абсолютным baseUrl) */
const PDF_MESSENGER_ICONS: Array<{ key: string; path: string }> = [
  { key: 'twitter', path: '/images/icons/twitter-color.svg' },
  { key: 'whatsapp', path: '/images/icons/whatsapp-color.svg' },
  { key: 'telegram', path: '/images/icons/telegram-color.svg' },
  { key: 'viber', path: '/images/icons/viber-color.svg' },
  { key: 'instagram', path: '/images/icons/instagram-color.svg' },
  { key: 'vk', path: '/images/icons/vk-color.svg' },
  { key: 'max', path: '/images/icons/max-color.svg' },
  { key: 'x', path: '/images/icons/x-color.svg' },
]

function renderPdfMessengerIcons(messengers: Record<string, string>, baseUrl: string): string {
  const parts: string[] = []
  for (const { key, path } of PDF_MESSENGER_ICONS) {
    const href = String(messengers[key] || '').trim()
    if (!href) continue
    const iconSrc = toAbsoluteImageUrl(path, baseUrl).replace(/"/g, '&quot;')
    const safeHref = escapeHtml(href)
    parts.push(
      `<a href="${safeHref}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:0.5rem;background:#f3f4f6;flex-shrink:0;text-decoration:none;" title="${escapeHtml(key)}">` +
        `<img src="${iconSrc}" alt="" width="16" height="16" style="width:1rem;height:1rem;object-fit:contain;display:block;" />` +
        `</a>`,
    )
  }
  if (!parts.length) return ''
  return `<div class="booklet-contacts__messengers" style="display:flex;flex-wrap:wrap;gap:0.35rem;width:100%;align-items:center;">${parts.join('')}</div>`
}

const DEFAULT_IMAGE_GRID_BY_TYPE: Record<string, string> = {
  description: '1x2',
  infrastructure: '1x2',
  gallery: '3x1',
  layout: '1x1',
  contacts: '1x1',
}

const LAYOUT_IMAGE_GRIDS: Record<string, string[]> = {
  'text-left': ['1x1', '1x2', '2x2', '1x3', '2x3'],
  'text-right': ['1x1', '1x2', '2x2', '1x3', '2x3'],
  'text-top': ['1x1', '2x1', '2x2', '3x1', '3x2'],
  'text-bottom': ['1x1', '2x1', '2x2', '3x1', '3x2'],
}

const GALLERY_LAYOUT_GRIDS = ['1x1', '2x1', '1x2', '2x2', '3x1', '1x3', '3x2', '2x3']

const BLOCK_LAYOUT_VALUES = ['text-left', 'text-right', 'text-top', 'text-bottom'] as const
function blockLayout(dataObj: Record<string, unknown>): string {
  const v = dataObj.blockLayout ?? dataObj.block_layout
  if (typeof v === 'string' && (BLOCK_LAYOUT_VALUES as readonly string[]).includes(v)) return v
  return 'text-left'
}

/** Как PresentationEditor / PresentationView: только допустимые сетки, иначе fallback */
function resolveImageGrid(dataObj: Record<string, unknown>, slideType: string): string {
  const v = dataObj.imageGrid ?? dataObj.image_grid
  let values: string[]
  if (slideType === 'description' || slideType === 'infrastructure') {
    const layout = blockLayout(dataObj)
    values = LAYOUT_IMAGE_GRIDS[layout] ?? LAYOUT_IMAGE_GRIDS['text-left']
  } else {
    values = GALLERY_LAYOUT_GRIDS
  }
  if (typeof v === 'string' && v && values.includes(v)) return v
  return values[0] ?? DEFAULT_IMAGE_GRID_BY_TYPE[slideType] ?? '1x1'
}

function getImageGridLimit(dataObj: Record<string, unknown>, slideType: string): { cols: number; rows: number; limit: number; grid: string } {
  let grid = resolveImageGrid(dataObj, slideType)
  const [c, r] = grid.split('x').map(Number)
  let cols = c || 2
  let rows = r || 2
  // Для инфраструктуры и описания: если сетка 1x2, но заполнено только одно изображение — один блок (1x1), без пустого слота
  if ((slideType === 'infrastructure' || slideType === 'description') && grid === '1x2') {
    const arr = Array.isArray(dataObj.images) ? (dataObj.images as unknown[]) : []
    const filled = arr.filter((v) => {
      const u = typeof v === 'string' ? v : (v as { url?: string })?.url
      return u && String(u).trim()
    })
    if (filled.length <= 1) {
      grid = '1x1'
      cols = 1
      rows = 1
    }
  }
  return { cols, rows, limit: cols * rows, grid }
}

/** Генерирует HTML для презентации */
function generatePresentationHTML(data: PresentationData, baseUrl: string): string {
  const slides = data.content?.slides || []
  const visibleSlides = slides.filter((s) => !s.hidden)
  const fontFamilyRaw = (data.content?.settings?.fontFamily || '').trim()
  const fontFamily = fontFamilyRaw && fontFamilyRaw !== 'system-ui' ? fontFamilyRaw : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  const settings = (data.content?.settings || {}) as Record<string, string>
  const themeColor = typeof settings.themeColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(settings.themeColor) ? settings.themeColor : '#fcfcfc'
  const templateValue = (settings.template || '').trim()
  const isUrbanRealEstate = templateValue === 'urban_real_estate' || templateValue === 'city'
  const isUniversal = templateValue === 'universal'
  const templateName = isUrbanRealEstate ? 'urban_real_estate' : (isUniversal ? 'universal' : 'basic')
  const frameValue = (settings.imageFrame || '').trim()
  const imageFrame = ['default', 'minimal', 'vintage', 'polaroid'].includes(frameValue) ? frameValue : (frameValue === 'none' ? 'none' : 'default')

  const figMap = figuresArrayToMap(data.figureDefinitions)
  const figLayer = (d: Record<string, unknown>) => renderPdfFiguresOverlayHtml(d, figMap)

  const slideHTML = visibleSlides.map((slide) => {
    switch (slide.type) {
      case 'cover': {
        const dataObj = slide.data || {}
        const coverImage = String(dataObj.coverImageUrl || dataObj.background_image || data.coverImage || '')
        const title = String(dataObj.title ?? '').trim()
        const subtitle = String(dataObj.subtitle ?? '').trim()
        const dealType = String(dataObj.deal_type || 'Аренда')
        const price = Number(dataObj.price_value || 0)
        const currency = String(dataObj.currency || 'RUB')
        const showAllCurrencies = settingBool(dataObj.show_all_currencies)
        const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€', CNY: '¥', KZT: '₸' }
        const symbol = currencySymbols[currency] || '₽'
        const formatPrice = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        const EXCHANGE_RATES: Record<string, number> = { RUB: 1, USD: 0.011, EUR: 0.01, CNY: 0.078, KZT: 4.9 }
        const CURRENCIES = [
          { code: 'RUB', symbol: '₽' },
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'CNY', symbol: '¥' },
          { code: 'KZT', symbol: '₸' },
        ]
        const baseRate = EXCHANGE_RATES[currency] ?? 1
        const convertedLines: string[] = []
        if (showAllCurrencies && price && baseRate > 0) {
          for (const c of CURRENCIES) {
            if (c.code === currency) continue
            const rate = EXCHANGE_RATES[c.code] ?? 1
            const priceInRUB = price / baseRate
            const converted = Math.round(priceInRUB * rate)
            convertedLines.push(`${c.symbol} ${formatPrice(converted)}`)
          }
        }

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-main">
                <div class="booklet-main__wrap">
                  <div class="booklet-main__img">
                    ${coverImage ? `<img src="${toAbsoluteImageUrl(coverImage, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}
                  </div>
                  <div class="booklet-main__content">
                    ${title ? `<div class="booklet-main__top">${title.replace(/\n/g, '<br>')}</div>` : ''}
                    ${subtitle ? `<div class="booklet-main__center">${subtitle.replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="booklet-main__bottom booklet-main__bottom--view text-right">
                      <div class="booklet-main__deal-type booklet-main__bottom-line">${escapeHtml(dealType)}</div>
                      <div class="booklet-main__price booklet-main__bottom-line font-semibold text-gray-800">
                        ${formatPrice(Number(price))} ${symbol}
                        ${dealType === 'Аренда' ? '<span class="booklet-main__price-suffix font-normal">/ месяц</span>' : ''}
                      </div>
                      ${convertedLines.length ? `<div class="booklet-main__bottom-line booklet-main__currencies-grid mt-2 text-sm text-gray-600">${convertedLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'description': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ОПИСАНИЕ')
        const text = String(dataObj.text || dataObj.content || '')
        const { limit, grid } = getImageGridLimit(dataObj, 'description')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-info">
                <div class="booklet-info__shell">
                  <div class="booklet-info__title-col">
                    <h2 class="booklet-info__title">${escapeHtml(heading)}</h2>
                  </div>
                <div class="booklet-info__wrap" data-block-layout="${escapeHtml(blockLayout(dataObj))}">
                  <div class="booklet-info__block booklet-info__content">
                    <div class="booklet-info__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-info__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-info__block booklet-info__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'infrastructure': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ИНФРАСТРУКТУРА')
        const text = String(dataObj.content || dataObj.text || '')
        const { limit, grid } = getImageGridLimit(dataObj, 'infrastructure')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-stroen">
                <div class="booklet-stroen__shell">
                  <div class="booklet-stroen__title-col">
                    <h2 class="booklet-stroen__title">${escapeHtml(heading)}</h2>
                  </div>
                <div class="booklet-stroen__wrap" data-block-layout="${escapeHtml(blockLayout(dataObj))}">
                  <div class="booklet-stroen__block booklet-stroen__content">
                    <div class="booklet-stroen__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-stroen__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-stroen__block booklet-stroen__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'location': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'МЕСТОПОЛОЖЕНИЕ')
        const locationName = String(dataObj.location_name || '')
        const address = String(dataObj.address || dataObj.location_address || '')
        const metroStations = Array.isArray(dataObj.metro_stations)
          ? (dataObj.metro_stations as Array<{ name?: string; walk_time_text?: string }>)
          : []
        const lat = Number(dataObj.lat)
        const lng = Number(dataObj.lng)
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
        const mapContent = hasCoords
          ? `<img src="${escapeHtml(getStaticMapImageUrl(lat, lng))}" alt="Карта" width="400" height="300" style="width:100%;height:100%;object-fit:cover;">`
          : '<div class="map-placeholder">Карта</div>'

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-map">
                <div class="booklet-map__wrap">
                  <h2 class="booklet-map__title">${escapeHtml(heading)}</h2>
                  <div class="booklet-map__left">
                    <div class="booklet-map__img">${mapContent}</div>
                  </div>
                  <div class="booklet-map__content">
                    <div class="booklet-map__info">
                      ${locationName ? `<p class="font-medium">${escapeHtml(locationName)}</p>` : ''}
                      ${address ? `<p class="font-medium">${escapeHtml(address)}</p>` : ''}
                      ${metroStations.length ? `
                        <p class="booklet-map__metro-label font-medium mt-2">Ближайшие станции метро</p>
                        <ul class="booklet-map__metro-list mt-1 space-y-0.5">
                          ${metroStations.map((st) => `<li>${escapeHtml(st.name || '')}${st.walk_time_text ? ` — ${escapeHtml(st.walk_time_text)}` : ''}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'image': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || '')
        const imageUrl = String(dataObj.imageUrl || dataObj.image || '')

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-img">
                <div class="booklet-img__wrap">
                  ${heading ? `<h2 class="booklet-img__title mb-2">${heading}</h2>` : ''}
                  <div class="booklet-img__img">${imageUrl ? `<img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'gallery': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ГАЛЕРЕЯ')
        const { limit, grid } = getImageGridLimit(dataObj, 'gallery')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-galery">
                <div class="booklet-galery__wrap">
                  <h2 class="booklet-galery__title">${escapeHtml(heading)}</h2>
                  <div class="booklet-galery__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-galery__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'characteristics': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ХАРАКТЕРИСТИКИ')
        const imageUrl = String(dataObj.charImageUrl || dataObj.image || '')
        const items = Array.isArray(dataObj.items) ? (dataObj.items as Array<{ label?: string; value?: string }>) : []

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-char">
                <div class="booklet-char__shell">
                  <div class="booklet-char__title-col">
                    <h2 class="booklet-char__title">${escapeHtml(heading)}</h2>
                  </div>
                <div class="booklet-char__wrap">
                  <div class="booklet-char__img">${imageUrl ? `<img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>
                  <div class="booklet-char__content">
                    <div class="booklet-char__table">
                      ${items.map((item) => `
                        <div class="booklet-char__row">
                          <div class="booklet-char__item text-gray-600">${escapeHtml(item.label || '')}</div>
                          <div class="booklet-char__item font-medium">${escapeHtml(item.value || '')}</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'layout': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ПЛАНИРОВКА')
        const { limit, grid } = getImageGridLimit(dataObj, 'layout')
        const rawImages = Array.isArray(dataObj.images) ? (dataObj.images as (string | { url?: string })[]) : []
        const singleUrl = dataObj.layoutImageUrl || dataObj.image
        const layoutImages: string[] = rawImages.length
          ? rawImages.slice(0, limit).map((v) => (typeof v === 'string' ? v : (v as { url?: string })?.url) || '')
          : singleUrl
            ? [String(singleUrl), ...Array(Math.max(0, limit - 1)).fill('')]
            : Array(limit).fill('')
        while (layoutImages.length < limit) layoutImages.push('')

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-layout">
                <div class="booklet-layout__wrap">
                  <h2 class="booklet-layout__title">${escapeHtml(heading)}</h2>
                  <div class="booklet-layout__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${layoutImages.slice(0, limit).map((url) => `<div class="booklet-layout__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      case 'contacts': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.contact_title || 'КОНТАКТЫ').trim() || 'КОНТАКТЫ'
        const contactName = String(dataObj.contactName || dataObj.contact_name || '').trim()
        const aboutText = String(dataObj.aboutText || dataObj.about_text || '').trim()
        const phone = String(dataObj.phone || dataObj.contact_phone || '').trim()
        const email = String(dataObj.email || dataObj.contact_email || '').trim()
        const address = String(dataObj.address || dataObj.contact_address || '').trim()
        const websiteUrl = String(dataObj.websiteUrl || '').trim()
        const avatarUrl = String(dataObj.avatarUrl || dataObj.logoUrl || '').trim()
        const contactImageUrl = String(dataObj.contactImageUrl || (Array.isArray(dataObj.images) && dataObj.images[0] ? dataObj.images[0] : '')).trim()
        const messengers = dataObj.messengers && typeof dataObj.messengers === 'object' ? dataObj.messengers as Record<string, string> : null

        const hasTopRow = avatarUrl || contactName || phone
        const topRow = hasTopRow ? `
          <div class="booklet-contacts__top" style="display:flex;align-items:flex-start;gap:1rem;">
            <div class="booklet-contacts__avatar-wrap" style="flex-shrink:0;display:flex;justify-content:center;"><div class="booklet-contacts__avatar">${avatarUrl ? `<img src="${toAbsoluteImageUrl(avatarUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div></div>
            <div class="booklet-contacts__name-phone" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:0.25rem;">
              ${contactName ? `<p style="margin:0;font-size:1.125rem;font-weight:600;">${escapeHtml(contactName)}</p>` : ''}
              ${phone ? `<p style="margin:0;">${escapeHtml(phone)}</p>` : ''}
            </div>
          </div>` : ''
        const messengersBlock = messengers ? renderPdfMessengerIcons(messengers, baseUrl) : ''
        const emailBlock = email ? `<div class="booklet-contacts__block" style="width:100%;"><p style="margin:0;">${escapeHtml(email)}</p></div>` : ''
        const addressBlock = address ? `<div class="booklet-contacts__block" style="width:100%;"><p style="margin:0;">${escapeHtml(address)}</p></div>` : ''
        const aboutBlock = aboutText ? `<div class="booklet-contacts__block" style="width:100%;"><p style="margin:0;white-space:pre-wrap;">${escapeHtml(aboutText)}</p></div>` : ''
        const websiteBlock = websiteUrl ? `<div class="booklet-contacts__block" style="width:100%;"><a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener">${escapeHtml(websiteUrl)}</a></div>` : ''

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-contacts">
                <div class="booklet-contacts__shell">
                  <div class="booklet-contacts__title-col">
                    <h2 class="booklet-contacts__title">${escapeHtml(heading)}</h2>
                  </div>
                <div class="booklet-contacts__wrap">
                  <div class="booklet-contacts__left">
                    ${topRow}
                    ${messengersBlock}
                    ${emailBlock}
                    ${addressBlock}
                    ${aboutBlock}
                    ${websiteBlock}
                  </div>
                  <div class="booklet-contacts__block booklet-contacts__img">${contactImageUrl ? `<img src="${toAbsoluteImageUrl(contactImageUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>
                </div>
                </div>
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
      default: {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || slide.type)
        const text = dataObj.text ? String(dataObj.text) : ''
        const content = dataObj.content ? String(dataObj.content) : ''
        const items = Array.isArray(dataObj.items) ? (dataObj.items as Array<{ label?: string; value?: string; text?: string }>) : []
        const rawImgArr = Array.isArray(dataObj.images) ? (dataObj.images as unknown[]) : []
        const images = toImageUrls(rawImgArr, 8)
        const showFallbackImageGrid = rawImgArr.length > 0 || images.some(Boolean)
        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-scale-root">
              <div class="booklet-content booklet-info p-6">
                <h2 class="booklet-info__title mb-4">${heading}</h2>
                ${text ? `<div class="booklet-info__text">${String(text).replace(/\n/g, '<br>')}</div>` : ''}
                ${content ? `<div class="booklet-info__text">${String(content).replace(/\n/g, '<br>')}</div>` : ''}
                ${items.length ? `<div class="booklet-char__table mt-4">${items.map((item) => `
                  <div class="booklet-char__row">
                    <div class="booklet-char__item text-gray-600">${escapeHtml(String(item.label ?? item.text ?? ''))}</div>
                    <div class="booklet-char__item font-medium">${escapeHtml(String(item.value ?? ''))}</div>
                  </div>
                `).join('')}</div>` : ''}
                ${showFallbackImageGrid ? `<div class="mt-4 grid grid-cols-2 gap-2">${images.slice(0, 4).map((url) => `<div class="booklet-pdf-fallback-cell h-24 w-full overflow-hidden rounded" style="background:var(--theme-main-color)">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="" class="h-full w-full object-cover" />` : ''}</div>`).join('')}</div>` : ''}
              </div>
              ${figLayer(dataObj)}
              </div>
            </div>
          </div>
        `
      }
    }
  }).join('')

  // Встроенные CSS стили для PDF: один слайд = один лист A4 альбомная, контент на всю область
  const embeddedCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${A4_LANDSCAPE_WIDTH}px; font-family: ${fontFamily}; font-size: 16px; line-height: 1.5; color: #1a1a1a; background: #eeeeee; padding: 0; overflow: hidden; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.375rem; }
    .font-medium { font-weight: 600; }
    .font-semibold { font-weight: 600; }
    .font-normal { font-weight: 400; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-800 { color: #1f2937; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-x-4 { column-gap: 1rem; }
    .gap-y-1 { row-gap: 0.25rem; }
    .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
    .presentation-container { width: 100%; margin: 0; background: white; }
    .booklet-page { page-break-after: always; position: relative; width: 100vw; height: 100vh; min-height: 100vh; max-height: 100vh; background-color: #eeeeee; padding: 1rem; overflow: hidden; }
    .booklet-page:has(.pdf-figures-overlay) { overflow: visible; }
    .booklet-page:last-child { page-break-after: auto; }
    .presentation-slider-wrap.booklet-view { --theme-main-color: ${themeColor}; --theme-color: ${themeColor}; }
    .presentation-slider-wrap.booklet-view .booklet-page__inner { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; padding: 0; box-sizing: border-box; overflow: hidden; background: #fff; }
    .presentation-slider-wrap.booklet-view .booklet-page__inner:has(.pdf-figures-overlay) { overflow: visible; }
    .presentation-slider-wrap.booklet-view .booklet-scale-root { position: absolute; left: 0; top: 0; width: 70.16%; height: 70.16%; transform: scale(1.42518); transform-origin: 0 0; padding: 1rem 1rem 1rem 1.5rem; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-scale-root:has(.pdf-figures-overlay) { overflow: visible; }
    /* Заполняем область .booklet-scale-root без лишних отступов у контейнера оверлея */
    .presentation-slider-wrap.booklet-view .pdf-figures-overlay { position: absolute; left: 0; top: 0; right: 0; bottom: 0; width: 100%; height: 100%; margin: 0; padding: 0; box-sizing: border-box; pointer-events: none; overflow: visible; }
    .presentation-slider-wrap.booklet-view .pdf-figures-overlay .pdf-fig-item { position: absolute; transform-origin: center center; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-content { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-main__wrap { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 0; width: 100%; height: 100%; min-height: 0; max-height: 100%; }
    .presentation-slider-wrap.booklet-view .booklet-main__img { position: relative; flex: 0 0 55%; min-width: 200px; min-height: 280px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--theme-main-color); box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-main__img img, .presentation-slider-wrap.booklet-view .booklet-img__img img, .presentation-slider-wrap.booklet-view .booklet-galery__img img, .presentation-slider-wrap.booklet-view .booklet-grid__img img, .presentation-slider-wrap.booklet-view .booklet-char__img img, .presentation-slider-wrap.booklet-view .booklet-layout__img img, .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img img, .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img img { width: 100%; height: 100%; min-width: 0; min-height: 0; max-width: 100%; max-height: 100%; object-fit: cover; object-position: center; display: block; }
    .presentation-slider-wrap.booklet-view .booklet-img__wrap { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-img__img { position: relative; flex: 1; min-height: 200px; width: 100%; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    .presentation-slider-wrap.booklet-view .booklet-main__content { flex: 1 1 45%; min-width: 200px; min-height: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; padding: 25px 25px; overflow: hidden; background: #ffffff; }
    .presentation-slider-wrap.booklet-view .booklet-main__top, .presentation-slider-wrap.booklet-view .booklet-main__center { flex: 0 0 auto; line-height: 1.3; font-weight: 400; letter-spacing: 0.02em; color: #1a1a1a; overflow-wrap: break-word; word-break: break-word; }
    .presentation-slider-wrap.booklet-view .booklet-main__top { font-size: 28px; }
    .presentation-slider-wrap.booklet-view .booklet-main__center { font-size: 28px; margin-top: 0.25rem; }
    .presentation-slider-wrap.booklet-view .booklet-main__short-desc { font-size: 17px; overflow-wrap: break-word; word-break: break-word; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom { flex: 0 0 auto; margin-top: auto; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .booklet-main__bottom-line { display: block; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .booklet-main__deal-type { font-size: 26px; font-weight: 700; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .booklet-main__price { font-size: 24px; font-weight: 500; }
    .presentation-slider-wrap.booklet-view .booklet-main__price { font-size: 24px !important; font-weight: 500; }
    .presentation-slider-wrap.booklet-view .booklet-main__price-line .booklet-main__deal-type { font-size: 26px !important; font-weight: 700; }
    .presentation-slider-wrap.booklet-view .booklet-main__price-line .booklet-main__price-suffix { font-size: 24px !important; font-weight: 500; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom .mt-2 { margin-top: 0.5rem; }
    .presentation-slider-wrap.booklet-view .booklet-main__currencies-grid,
    .booklet-main__currencies-grid { display: grid !important; grid-template-columns: repeat(2, 1fr); gap: 0.25rem 1rem; text-align: right; max-width: max-content; margin-left: auto; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .flex { display: flex; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .flex-wrap { flex-wrap: wrap; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom--view .justify-end { justify-content: flex-end; }
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-info__title-col,
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-stroen__title-col,
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-char__title-col { align-items: center; }
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-info__title-col .booklet-info__title,
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-stroen__title-col .booklet-stroen__title,
    .presentation-slider-wrap.booklet-view:not([data-template="urban_real_estate"]) .booklet-char__title-col .booklet-char__title { text-align: center; width: 100%; }
    .presentation-slider-wrap.booklet-view .booklet-galery__title,
    .presentation-slider-wrap.booklet-view .booklet-layout__title { text-align: center; width: 100%; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-content.booklet-info, .presentation-slider-wrap.booklet-view .booklet-content.booklet-stroen { display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-info__shell, .presentation-slider-wrap.booklet-view .booklet-stroen__shell { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-info__title-col, .presentation-slider-wrap.booklet-view .booklet-stroen__title-col { flex-shrink: 0; margin-bottom: 0.75rem; }
    .presentation-slider-wrap.booklet-view .booklet-info__shell .booklet-info__wrap, .presentation-slider-wrap.booklet-view .booklet-stroen__shell .booklet-stroen__wrap { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap, .presentation-slider-wrap.booklet-view .booklet-stroen__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-info__title-col .booklet-info__title, .presentation-slider-wrap.booklet-view .booklet-stroen__title-col .booklet-stroen__title, .presentation-slider-wrap.booklet-view .booklet-char__title-col .booklet-char__title, .presentation-slider-wrap.booklet-view .booklet-layout__title, .presentation-slider-wrap.booklet-view .booklet-galery__title, .presentation-slider-wrap.booklet-view .booklet-contacts__title-col .booklet-contacts__title { margin: 0 0 0 0; font-size: 28px; font-weight: 400; letter-spacing: 0.02em; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-map__title { margin: 0 0 1rem 0; font-size: 28px; font-weight: 400; letter-spacing: 0.02em; color: #1a1a1a; grid-column: 1 / -1; text-align: center; width: 100%; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-info__text, .presentation-slider-wrap.booklet-view .booklet-stroen__text { flex: 1; min-height: 0; overflow: auto; font-size: 17px; line-height: 1.5; color: #444; overflow-wrap: break-word; word-break: break-word; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid, .presentation-slider-wrap.booklet-view .booklet-stroen__grid { display: grid; gap: 12px; min-height: 0; flex: 1; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-right"] { direction: rtl; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-right"] .booklet-info__block { direction: ltr; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-top"] { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-top"] .booklet-info__block.booklet-info__content { order: 1; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-top"] .booklet-info__grid { order: 2; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-bottom"] { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-bottom"] .booklet-info__block.booklet-info__content { order: 2; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap[data-block-layout="text-bottom"] .booklet-info__grid { order: 1; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-right"] { direction: rtl; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-right"] .booklet-stroen__block { direction: ltr; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-top"] { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-top"] .booklet-stroen__block.booklet-stroen__content { order: 1; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-top"] .booklet-stroen__grid { order: 2; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-bottom"] { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-bottom"] .booklet-stroen__block.booklet-stroen__content { order: 2; }
    .presentation-slider-wrap.booklet-view .booklet-stroen__wrap[data-block-layout="text-bottom"] .booklet-stroen__grid { order: 1; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x1"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x2"] { grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x2"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="3x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="3x1"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x3"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x3"] { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="3x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="3x2"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x3"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x3"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img { position: relative; z-index: 1; min-height: 0; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-content.booklet-char { display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__shell { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__title-col { flex-shrink: 0; margin-bottom: 0.75rem; }
    .presentation-slider-wrap.booklet-view .booklet-char__shell .booklet-char__wrap { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; gap: 1rem; width: 100%; flex: 1; min-height: 280px; }
    .presentation-slider-wrap.booklet-view .booklet-char__img { position: relative; min-height: 180px; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; grid-row: 1; grid-column: 1; }
    .presentation-slider-wrap.booklet-view .booklet-char__content { display: flex; flex-direction: column; min-height: 0; grid-row: 1; grid-column: 2; overflow: auto; }
    .presentation-slider-wrap.booklet-view .booklet-char__table { flex: 1; margin-top: 0; display: flex; flex-direction: column; gap: 0; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(0, 0, 0, 0.08); align-items: center; font-size: 14px; font-weight: 400; }
    .presentation-slider-wrap.booklet-view .booklet-layout__wrap { display: flex; flex-direction: column; gap: 0; width: 100%; height: 100%; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid { display: grid; gap: 8px; flex: 1; min-height: 0; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="1x1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="2x1"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="1x2"] { grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="2x2"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="3x1"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="1x3"] { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="3x2"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-layout__grid.image-grid-bound[data-image-grid="2x3"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-layout__img { position: relative; min-height: 0; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-layout__img img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-map__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-map__left { display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__content { display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__info { flex: none; font-size: 17px; line-height: 1.5; color: #444; overflow: auto; overflow-wrap: break-word; word-break: break-word; }
    .presentation-slider-wrap.booklet-view .booklet-map__info p { margin: 0 0 0.35rem 0; font-size: 17px; line-height: 1.5; color: #1a1a1a; font-weight: 600; }
    .presentation-slider-wrap.booklet-view .booklet-map__info .booklet-map__metro-label { color: #1a1a1a; font-size: 17px; font-weight: 600; margin-top: 0.5rem; }
    .presentation-slider-wrap.booklet-view .booklet-map__info .booklet-map__metro-list { margin: 0.25rem 0 0 0; padding-left: 1.25rem; font-size: 17px; line-height: 1.5; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-map__info .booklet-map__metro-list li { margin-bottom: 0.125rem; }
    .presentation-slider-wrap.booklet-view .booklet-content.booklet-contacts { display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__shell { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__title-col { flex-shrink: 0; margin-bottom: 0.75rem; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__shell .booklet-contacts__wrap { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-content.booklet-contacts .booklet-contacts__wrap { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; width: 100%; height: 100%; min-height: 320px; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__left { display: flex; flex-direction: column; gap: 1rem; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: var(--theme-main-color); flex-shrink: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-galery__wrap { display: flex; flex-direction: column; gap: 0; width: 100%; height: 100%; min-height: 0; max-height: 100%; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid { display: grid; gap: 8px; flex: 1; min-height: 0; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="1x1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="2x1"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="1x2"] { grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="2x2"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="3x1"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="1x3"] { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="3x2"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid.image-grid-bound[data-image-grid="2x3"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-galery__img { position: relative; min-height: 0; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; z-index: 5; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img { position: relative; min-height: 120px; overflow: hidden; background: var(--theme-main-color); display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__content { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-height: 0; overflow: auto; }
    .presentation-slider-wrap.booklet-view .booklet-map__img { position: relative; min-height: 200px; flex: 1; overflow: hidden; border-radius: 8px; display: flex; flex-direction: column; background: var(--theme-main-color); }
    .presentation-slider-wrap.booklet-view .booklet-map__img > * { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .map-placeholder { width: 100%; height: 100%; min-height: 180px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.875rem; }
    /* Шаблон «Городская недвижимость»: обложка (фон + градиент + блоки как в веб) */
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-scale-root { padding: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-info,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-stroen,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-char,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-galery,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-layout,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-map,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-contacts { padding-left: 1.35rem !important; padding-right: 1.15rem !important; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__wrap { position: relative; overflow: hidden; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__wrap::after {
      content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.15) 38%, rgba(15, 23, 42, 0.35) 62%, rgba(15, 23, 42, 0.82) 100%);
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__img { flex: 1 1 100%; min-width: 100%; min-height: 100%; border-radius: 0; z-index: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__img img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__content { position: absolute; inset: 0; padding: 0; background: transparent; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__top { display: block; padding: 1.25rem 1.5rem 0; color: rgba(255,255,255,0.92) !important; font-size: 0.75rem !important; font-weight: 600 !important; letter-spacing: 0.2em !important; text-transform: uppercase !important; line-height: 1.35 !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45); }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__center {
      position: absolute; top: 44%; left: 50%; transform: translate(-50%, -50%);
      width: min(88%, 820px); margin: 0; padding: 1.25rem 1.5rem; border-radius: 1rem;
      background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.22);
      color: #fff; text-align: center; font-size: clamp(1.25rem, 2.6vw, 2rem); font-weight: 700;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__bottom--view {
      position: absolute; top: auto; bottom: 1.25rem; right: 1.25rem; left: auto;
      background: rgba(17, 24, 39, 0.82); border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 9999px; padding: 8px 14px; color: #fff;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__bottom--view .booklet-main__deal-type,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__bottom--view .booklet-main__price,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__bottom--view .booklet-main__price-suffix { color: #fff !important; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-main__bottom .booklet-main__currencies-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.25rem 1rem;
      text-align: right;
      color: rgba(255, 255, 255, 0.9) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      max-width: max-content;
      margin-left: auto;
      font-size: 0.875rem;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-info__shell,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-stroen__shell { display: grid; grid-template-columns: auto 1fr; column-gap: 1rem; align-items: stretch; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-info .booklet-info__wrap,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-stroen .booklet-stroen__wrap { flex: 1; min-height: 0; grid-column: 2; min-width: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-info__title-col,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-stroen__title-col { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; grid-column: 1; min-width: 2.25rem; align-self: stretch; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-info__title-col .booklet-info__title,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-stroen__title-col .booklet-stroen__title,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__title-col .booklet-char__title,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__title-col .booklet-contacts__title { margin: 0; padding: 0; writing-mode: vertical-rl; text-orientation: mixed; text-align: center; line-height: 1; flex: 0 0 auto; align-self: stretch; justify-self: center; direction: ltr; white-space: nowrap; transform: rotate(180deg); transform-origin: center center; }
    /* Галерея и планировка: как в просмотре — заголовок слева (вертикально), сетка изображений справа */
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__wrap {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      grid-template-rows: 1fr !important;
      column-gap: 1rem;
      row-gap: 0;
      align-items: stretch;
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      box-sizing: border-box;
      overflow: visible;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__title {
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      padding: 0;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      text-align: center;
      line-height: 1;
      align-self: stretch;
      justify-self: center;
      direction: ltr;
      white-space: nowrap;
      transform: rotate(180deg);
      transform-origin: center center;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-height: 0;
      flex: 1;
      overflow: visible;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__wrap {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      grid-template-rows: 1fr !important;
      column-gap: 1rem;
      row-gap: 0;
      align-items: stretch;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__title {
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      padding: 0;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      text-align: center;
      line-height: 1;
      align-self: stretch;
      justify-self: center;
      direction: ltr;
      white-space: nowrap;
      transform: rotate(180deg);
      transform-origin: center center;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-height: 0;
      flex: 1;
      overflow: visible;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-map__wrap {
      display: grid !important;
      grid-template-columns: auto 1fr 1fr !important;
      grid-template-rows: 1fr !important;
      column-gap: 1rem;
      row-gap: 0;
      align-items: stretch;
      width: 100%;
      height: 100%;
      min-height: 320px;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-map__title {
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      padding: 0;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      text-align: center;
      line-height: 1;
      align-self: stretch;
      justify-self: center;
      direction: ltr;
      white-space: nowrap;
      transform: rotate(180deg);
      transform-origin: center center;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-map__left { grid-column: 2 !important; grid-row: 1 !important; min-height: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-map__content { grid-column: 3 !important; grid-row: 1 !important; min-height: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__shell { display: grid; grid-template-columns: auto 1fr; column-gap: 1rem; align-items: stretch; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__title-col { grid-column: 1; min-width: 2.25rem; align-self: stretch; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-char,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-info,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-stroen,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-galery,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-layout,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-content.booklet-contacts { overflow: visible; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__wrap { grid-column: 2; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; column-gap: 1rem; row-gap: 0; align-items: stretch; flex: 1; min-height: 0; min-width: 0; position: relative; isolation: isolate; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__wrap::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__wrap::after { content: ''; position: absolute; width: 150px; height: 150px; background: var(--theme-color, #fcfcfc); z-index: 0; pointer-events: none; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__wrap::before { top: -1rem; left: -1rem; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__wrap::after { bottom: -1rem; left: calc((100% - 1rem) / 2 - 150px + 12px); }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__img { grid-column: 1; grid-row: 1; min-height: 0; position: relative; z-index: 1; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-char__content { grid-column: 2; grid-row: 1; min-height: 0; position: relative; z-index: 1; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-info__grid,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-stroen__grid { position: relative; isolation: isolate; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-info__grid::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-stroen__grid::before {
      content: ''; position: absolute; inset: -1rem; z-index: 0; pointer-events: none;
      background-image:
        linear-gradient(var(--theme-color, #fcfcfc), var(--theme-color, #fcfcfc)),
        linear-gradient(var(--theme-color, #fcfcfc), var(--theme-color, #fcfcfc)),
        linear-gradient(var(--theme-color, #fcfcfc), var(--theme-color, #fcfcfc)),
        linear-gradient(var(--theme-color, #fcfcfc), var(--theme-color, #fcfcfc));
      background-size: 50px 50px;
      background-position: 0 0, 100% 0, 0 100%, 100% 100%;
      background-repeat: no-repeat;
    }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid { position: relative; isolation: isolate; overflow: visible; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid::after,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid::after { content: ''; position: absolute; width: 150px; height: 150px; background: var(--theme-color, #fcfcfc); z-index: 0; pointer-events: none; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid::before { top: -1rem; left: -1rem; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid::after,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid::after { bottom: -1rem; right: -1rem; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-galery__grid .booklet-galery__img,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-layout__grid .booklet-layout__img { position: relative; z-index: 1; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__wrap::before,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__wrap::after { content: ''; position: absolute; width: 150px; height: 150px; background: var(--theme-color, #fcfcfc); z-index: 0; pointer-events: none; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__wrap::before { top: -1rem; left: -1rem; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__wrap::after { bottom: -1rem; left: calc((100% - 1.5rem) / 2 - 150px + 12px); }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__block.booklet-contacts__img,
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__left { position: relative; z-index: 1; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__shell { display: grid; grid-template-columns: auto 1fr; column-gap: 1rem; align-items: stretch; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__title-col { grid-column: 1; min-width: 2.25rem; align-self: stretch; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__wrap { grid-column: 2; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; align-items: stretch; gap: 1.5rem; min-height: 280px; flex: 1; width: 100%; min-width: 0; height: auto; box-sizing: border-box; position: relative; isolation: isolate; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__left { grid-column: 2; grid-row: 1; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__block.booklet-contacts__img { grid-column: 1; grid-row: 1; min-height: 280px; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__block.booklet-contacts__img img { min-height: 100%; height: 100%; object-fit: cover; }
    .presentation-slider-wrap.booklet-view[data-template="urban_real_estate"] .booklet-contacts__title-col .booklet-contacts__title { font-size: 28px; font-weight: 400; letter-spacing: 0.02em; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-main__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-img__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-info__block.booklet-info__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-stroen__block.booklet-stroen__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-char__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-galery__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-layout__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="default"] .booklet-contacts__block.booklet-contacts__img::after {
      content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6; box-sizing: border-box;
      border: 4px solid rgba(0,0,0,.3); box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 6px rgba(0,0,0,.3);
    }
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-main__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-img__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-info__block.booklet-info__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-stroen__block.booklet-stroen__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-char__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-galery__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-layout__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="minimal"] .booklet-contacts__block.booklet-contacts__img::after {
      content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6; box-sizing: border-box;
      border: 1px solid rgba(0,0,0,.12); box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-main__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-img__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-info__block.booklet-info__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-stroen__block.booklet-stroen__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-char__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-galery__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-layout__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="vintage"] .booklet-contacts__block.booklet-contacts__img::after {
      content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6; box-sizing: border-box;
      border: 2px solid #c9b896; box-shadow: inset 0 0 0 1px rgba(255,255,255,.4);
    }
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-main__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-img__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-info__block.booklet-info__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-stroen__block.booklet-stroen__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-char__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-galery__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-layout__img::after,
    .presentation-slider-wrap.booklet-view[data-image-frame="polaroid"] .booklet-contacts__block.booklet-contacts__img::after {
      content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6; box-sizing: border-box;
      border: 3px solid #f2ebe0; box-shadow: 0 2px 8px rgba(0,0,0,.1);
    }
    @media print {
      .booklet-page { page-break-after: always; height: 100vh; min-height: 100vh; max-height: 100vh; }
      body { padding: 0; }
    }
  `
  let universalTemplateCss = ''
  if (isUniversal) {
    universalTemplateCss = readUniversalTemplateCss()
  }

  const googleFontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700&family=Open+Sans:ital,wght@0,400;0,600;0,700&family=Raleway:ital,wght@0,400;0,600;0,700&family=Rubik:ital,wght@0,400;0,600;0,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700&display=swap" rel="stylesheet">'
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  ${googleFontsLink}
  <style>${embeddedCSS}${universalTemplateCss ? `\n${universalTemplateCss}` : ''}</style>
</head>
<body>
  <div class="presentation-container presentation-slider-wrap booklet-view" data-image-frame="${imageFrame}" data-template="${templateName}">
   ${slideHTML}
  </div>
</body>
</html>`
}

/** Генерирует PDF из данных презентации */
export async function generatePDF(data: PresentationData, baseUrl: string): Promise<Buffer> {
  const html = generatePresentationHTML(data, baseUrl)
  
  // Пытаемся найти Chrome в различных местах
  const possibleChromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]
  
  let executablePath: string | undefined
  for (const path of possibleChromePaths) {
    if (path) {
      try {
        if (existsSync(path)) {
          executablePath = path
          break
        }
      } catch {
        // Игнорируем ошибки проверки
      }
    }
  }
  
  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  }
  
  if (executablePath) {
    launchOptions.executablePath = executablePath
  }
  
  let browser
  try {
    browser = await puppeteer.launch(launchOptions)
  } catch (error) {
    const err = error as Error
    if (err.message.includes('Could not find Chrome')) {
      throw new Error(
        'Chrome не найден. Установите Chrome одним из способов:\n' +
        '1. Установите системный Chrome: apt-get install -y google-chrome-stable (Linux) или скачайте с google.com/chrome\n' +
        '2. Или установите через Puppeteer: npx puppeteer browsers install chrome\n' +
        '3. Или укажите путь через переменную окружения: PUPPETEER_EXECUTABLE_PATH=/path/to/chrome'
      )
    }
    throw error
  }
  
  try {
    const page = await browser.newPage()

    // Viewport = размер одного листа A4 альбомная, чтобы 100vh/100vw = один слайд
    await page.setViewport({
      width: A4_LANDSCAPE_WIDTH,
      height: A4_LANDSCAPE_HEIGHT,
      deviceScaleFactor: 1,
    })

    // Устанавливаем таймаут для загрузки изображений
    await page.setDefaultNavigationTimeout(30000)
    await page.setDefaultTimeout(30000)

    // Загружаем HTML контент
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Ждем загрузки всех изображений
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(resolve, 5000)
              })
          )
      )
    })

    // Каждый .booklet-page — одна страница PDF (A4 альбомная)
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    })
    
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
