import puppeteer from 'puppeteer'
import { existsSync } from 'node:fs'
import type { ViewSlideItem } from './types.js'

const YANDEX_STATIC_API_KEY = process.env.YANDEX_STATIC_API_KEY ?? ''

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
  content: { slides: ViewSlideItem[]; settings?: { fontFamily?: string } }
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

const DEFAULT_IMAGE_GRID: Record<string, string> = {
  description: '1x2',
  infrastructure: '1x2',
  gallery: '3x1',
  location: '1x2',
  contacts: '1x2',
}

function getImageGridLimit(dataObj: Record<string, unknown>, slideType: string): { cols: number; rows: number; limit: number; grid: string } {
  const grid = String(dataObj.imageGrid || DEFAULT_IMAGE_GRID[slideType] || '2x2')
  const [c, r] = grid.split('x').map(Number)
  const cols = c || 2
  const rows = r || 2
  return { cols, rows, limit: cols * rows, grid }
}

/** Генерирует HTML для презентации */
function generatePresentationHTML(data: PresentationData, baseUrl: string): string {
  const slides = data.content?.slides || []
  const visibleSlides = slides.filter((s) => !s.hidden)
  const fontFamilyRaw = (data.content?.settings?.fontFamily || '').trim()
  const fontFamily = fontFamilyRaw && fontFamilyRaw !== 'system-ui' ? fontFamilyRaw : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  const settings = (data.content?.settings || {}) as Record<string, string>
  const fontSizeVars = [
    settings.fontSizePresentationTitle != null ? `--booklet-font-size-presentation-title: ${settings.fontSizePresentationTitle}` : '',
    settings.fontSizeHeading != null ? `--booklet-font-size-heading: ${settings.fontSizeHeading}` : '',
    settings.fontSizeText != null ? `--booklet-font-size-text: ${settings.fontSizeText}` : '',
    settings.fontSizePrice != null ? `--booklet-font-size-price: ${settings.fontSizePrice}` : '',
  ].filter(Boolean).join('; ')

  const slideHTML = visibleSlides.map((slide) => {
    switch (slide.type) {
      case 'cover': {
        const dataObj = slide.data || {}
        const coverImage = String(dataObj.coverImageUrl || dataObj.background_image || data.coverImage || '')
        const title = String(dataObj.title || 'ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ')
        const subtitle = String(dataObj.subtitle || '')
        const shortDescription = String(dataObj.shortDescription || '')
        const dealType = String(dataObj.deal_type || 'Аренда')
        const price = Number(dataObj.price_value || 0)
        const currency = String(dataObj.currency || 'RUB')
        const showAllCurrencies = Boolean(dataObj.show_all_currencies)
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
              <div class="booklet-content booklet-main">
                <div class="booklet-main__wrap">
                  <div class="booklet-main__img">
                    ${coverImage ? `<img src="${toAbsoluteImageUrl(coverImage, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}
                  </div>
                  <div class="booklet-main__content">
                    <div class="booklet-main__top">${title.replace(/\n/g, '<br>')}</div>
                    <div class="booklet-main__center">${subtitle.replace(/\n/g, '<br>')}</div>
                    ${shortDescription ? `<div class="booklet-main__short-desc booklet-main__short-desc--view">${shortDescription.replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="booklet-main__bottom">
                      <p class="text-sm font-medium text-gray-600">${dealType}</p>
                      <p class="booklet-main__price text-lg font-semibold text-gray-800">
                        ${formatPrice(Number(price))}
                        ${dealType === 'Аренда' ? '<span class="text-sm font-normal">/ месяц</span>' : ''}
                      </p>
                      <p class="text-sm font-medium text-gray-600">${symbol}</p>
                      ${convertedLines.length ? `<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">${convertedLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>` : ''}
                    </div>
                  </div>
                </div>
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
              <div class="booklet-content booklet-info">
                <div class="booklet-info__wrap">
                  <div class="booklet-info__block booklet-info__content">
                    <h2 class="booklet-info__title">${escapeHtml(heading)}</h2>
                    <div class="booklet-info__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-info__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-info__block booklet-info__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
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
              <div class="booklet-content booklet-stroen">
                <div class="booklet-stroen__wrap">
                  <div class="booklet-stroen__block booklet-stroen__content">
                    <h2 class="booklet-stroen__title">${escapeHtml(heading)}</h2>
                    <div class="booklet-stroen__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-stroen__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-stroen__block booklet-stroen__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
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
        const { limit, grid } = getImageGridLimit(dataObj, 'location')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const hasImages = images.some(Boolean)
        const lat = Number(dataObj.lat)
        const lng = Number(dataObj.lng)
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
        const mapContent = hasCoords
          ? `<img src="${escapeHtml(getStaticMapImageUrl(lat, lng))}" alt="Карта" width="400" height="300" style="width:100%;height:100%;object-fit:cover;">`
          : '<div class="map-placeholder">Карта</div>'

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
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
                        <p class="font-medium text-gray-500 mt-2">Ближайшие станции метро</p>
                        <ul class="mt-1 space-y-0.5 text-sm text-gray-600">
                          ${metroStations.map((st) => `<li>${escapeHtml(st.name || '')}${st.walk_time_text ? ` — ${escapeHtml(st.walk_time_text)}` : ''}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                    ${hasImages ? `<div class="booklet-map__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">${images.filter(Boolean).map((url) => `<div class="booklet-map__grid-img"><img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt=""></div>`).join('')}</div>` : ''}
                  </div>
                </div>
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
              <div class="booklet-content booklet-img">
                <div class="booklet-img__wrap">
                  ${heading ? `<h2 class="booklet-img__title mb-2">${heading}</h2>` : ''}
                  ${imageUrl ? `<div class="booklet-img__img"><img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt=""></div>` : ''}
                </div>
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
              <div class="booklet-content booklet-galery">
                <div class="booklet-galery__wrap">
                  <h2 class="booklet-galery__title">${escapeHtml(heading)}</h2>
                  <div class="booklet-galery__grid image-grid-bound" data-image-grid="${escapeHtml(grid)}">
                    ${images.map((url) => `<div class="booklet-galery__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
                </div>
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
              <div class="booklet-content booklet-char">
                <div class="booklet-char__wrap">
                  <h2 class="booklet-char__title">${escapeHtml(heading)}</h2>
                  ${imageUrl ? `
                    <div class="booklet-char__img">
                      <img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">
                    </div>
                  ` : ''}
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
          </div>
        `
      }
      case 'layout': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || 'ПЛАНИРОВКА')
        const imageUrl = String(dataObj.layoutImageUrl || dataObj.image || '')

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-layout">
                <div class="booklet-layout__wrap">
                  <h2 class="booklet-layout__title">${heading}</h2>
                  ${imageUrl ? `<div class="booklet-layout__img"><img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt=""></div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `
      }
      case 'contacts': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.contact_title || 'КОНТАКТЫ')
        const contactName = String(dataObj.contact_name || '')
        const phone = String(dataObj.phone || dataObj.contact_phone || '')
        const email = String(dataObj.email || dataObj.contact_email || '')
        const role = String(dataObj.contact_role || '')
        const address = String(dataObj.address || dataObj.contact_address || '')
        const avatarUrl = String(dataObj.avatarUrl || dataObj.logoUrl || '')
        const contactImageUrl = String(dataObj.contactImageUrl || (Array.isArray(dataObj.images) && dataObj.images[0] ? dataObj.images[0] : ''))

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-contacts">
                <div class="booklet-contacts__wrap">
                  <div class="booklet-contacts__left">
                    <h2 class="booklet-contacts__title">${escapeHtml(heading)}</h2>
                    ${avatarUrl ? `<div class="booklet-contacts__avatar-wrap"><div class="booklet-contacts__avatar"><img src="${toAbsoluteImageUrl(avatarUrl, baseUrl).replace(/"/g, '&quot;')}" alt=""></div></div>` : ''}
                    <div class="booklet-contacts__block booklet-contacts__content">
                      ${contactName ? `<p>${contactName}</p>` : ''}
                      ${phone ? `<p>${phone}</p>` : ''}
                      ${email ? `<p>${email}</p>` : ''}
                      ${role ? `<p>${role}</p>` : ''}
                      ${address ? `<p>${address}</p>` : ''}
                    </div>
                  </div>
                  ${contactImageUrl ? `<div class="booklet-contacts__block booklet-contacts__img"><img src="${toAbsoluteImageUrl(contactImageUrl, baseUrl).replace(/"/g, '&quot;')}" alt=""></div>` : ''}
                </div>
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
        const images = toImageUrls((dataObj.images as unknown[]) || [], 8)
        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
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
                ${images.some(Boolean) ? `<div class="mt-4 grid grid-cols-2 gap-2">${images.filter(Boolean).map((url) => `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="" class="h-24 w-full object-cover rounded" />`).join('')}</div>` : ''}
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
    .booklet-page:last-child { page-break-after: auto; }
    .presentation-slider-wrap.booklet-view { --theme-main-color: #2c7f8d;${fontSizeVars ? ` ${fontSizeVars}` : ''} }
    .presentation-slider-wrap.booklet-view .booklet-page__inner { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; padding: 1rem; box-sizing: border-box; overflow: hidden; background: #fff; }
    .presentation-slider-wrap.booklet-view .booklet-content { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-main__wrap { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 0; width: 100%; height: 100%; min-height: 0; max-height: 100%; }
    .presentation-slider-wrap.booklet-view .booklet-main__img { position: relative; flex: 0 0 55%; min-width: 200px; min-height: 280px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #C4C4C4; box-sizing: border-box; padding: 40px 0 40px 40px; }
    .presentation-slider-wrap.booklet-view .booklet-main__img img, .presentation-slider-wrap.booklet-view .booklet-img__img img, .presentation-slider-wrap.booklet-view .booklet-galery__img img, .presentation-slider-wrap.booklet-view .booklet-grid__img img, .presentation-slider-wrap.booklet-view .booklet-char__img img, .presentation-slider-wrap.booklet-view .booklet-layout__img img, .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img img, .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img img, .presentation-slider-wrap.booklet-view .booklet-map__grid-img img, .presentation-slider-wrap.booklet-view .booklet-galery__img img { width: 100%; height: 100%; min-width: 0; min-height: 0; max-width: 100%; max-height: 100%; object-fit: cover; object-position: center; display: block; }
    .presentation-slider-wrap.booklet-view .booklet-main__content { flex: 1 1 45%; min-width: 200px; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; padding: 40px 25px; }
    .presentation-slider-wrap.booklet-view .booklet-main__top, .presentation-slider-wrap.booklet-view .booklet-main__center { flex: 0 0 auto; font-size: var(--booklet-font-size-presentation-title, 16px); line-height: 1.3; font-weight: 700; letter-spacing: 0.02em; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-main__center { font-size: var(--booklet-font-size-text, 16px); margin-top: 0.25rem; }
    .presentation-slider-wrap.booklet-view .booklet-main__short-desc { font-size: var(--booklet-font-size-text, 16px); }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom { flex: 0 0 auto; margin-top: auto; }
    .presentation-slider-wrap.booklet-view .booklet-main__price { font-size: var(--booklet-font-size-price, 18px) !important; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom .mt-2 { margin-top: 0.5rem; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap, .presentation-slider-wrap.booklet-view .booklet-stroen__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-info__title, .presentation-slider-wrap.booklet-view .booklet-stroen__title, .presentation-slider-wrap.booklet-view .booklet-char__title, .presentation-slider-wrap.booklet-view .booklet-layout__title, .presentation-slider-wrap.booklet-view .booklet-galery__title, .presentation-slider-wrap.booklet-view .booklet-contacts__title { margin: 0 0 1rem 0; font-size: var(--booklet-font-size-heading, 20px); font-weight: 700; letter-spacing: 0.02em; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-map__title { margin: 0 0 1rem 0; font-size: var(--booklet-font-size-heading, 20px); font-weight: 700; letter-spacing: 0.02em; color: #1a1a1a; grid-column: 1 / -1; }
    .presentation-slider-wrap.booklet-view .booklet-info__text, .presentation-slider-wrap.booklet-view .booklet-stroen__text { flex: 1; min-height: 60px; overflow: auto; font-size: var(--booklet-font-size-text, 16px); line-height: 1.5; color: #444; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid, .presentation-slider-wrap.booklet-view .booklet-stroen__grid { display: grid; gap: 12px; min-height: 0; flex: 1; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x1"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x2"] { grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x2"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="3x1"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="3x1"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="1x3"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="1x3"] { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="3x2"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="3x2"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__grid.image-grid-bound[data-image-grid="2x3"], .presentation-slider-wrap.booklet-view .booklet-stroen__grid.image-grid-bound[data-image-grid="2x3"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img { position: relative; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-char__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-char__title { grid-column: 1 / -1; }
    .presentation-slider-wrap.booklet-view .booklet-char__img { position: relative; min-height: 180px; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; grid-row: 2; grid-column: 1; }
    .presentation-slider-wrap.booklet-view .booklet-char__content { display: flex; flex-direction: column; min-height: 0; grid-row: 2; grid-column: 2; overflow: auto; }
    .presentation-slider-wrap.booklet-view .booklet-char__table { flex: 1; margin-top: 0; display: flex; flex-direction: column; gap: 0; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(0, 0, 0, 0.08); align-items: center; }
    .presentation-slider-wrap.booklet-view .booklet-layout__wrap { display: flex; flex-direction: column; gap: 0; width: 100%; height: 100%; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-layout__img { position: relative; flex: 1; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-layout__img img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-map__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-map__left { display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__content { display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__info { flex: none; font-size: var(--booklet-font-size-text, 16px); line-height: 1.5; color: #444; overflow: auto; }
    .presentation-slider-wrap.booklet-view .booklet-map__info p { margin: 0 0 0.35rem 0; font-size: var(--booklet-font-size-text, 16px); line-height: 1.5; color: #1a1a1a; font-weight: 600; }
    .presentation-slider-wrap.booklet-view .booklet-map__info p.text-gray-500 { color: #6b7280; font-weight: 600; margin-top: 0.5rem; }
    .presentation-slider-wrap.booklet-view .booklet-map__info ul { margin: 0.25rem 0 0 0; padding-left: 1.25rem; font-size: 0.875rem; line-height: 1.5; color: #4b5563; }
    .presentation-slider-wrap.booklet-view .booklet-map__info li { margin-bottom: 0.125rem; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid { display: grid; gap: 8px; flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="1x1"] { grid-template-columns: 1fr; grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="2x1"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="1x2"] { grid-template-columns: 1fr; grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="2x2"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="3x1"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="1x3"] { grid-template-columns: 1fr; grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="3x2"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-map__grid.image-grid-bound[data-image-grid="2x3"] { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); }
    .presentation-slider-wrap.booklet-view .booklet-map__grid-img { position: relative; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-map__grid-img img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; width: 100%; height: 100%; min-height: 320px; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__left { display: flex; flex-direction: column; gap: 1rem; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #e8e8e8; flex-shrink: 0; }
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
    .presentation-slider-wrap.booklet-view .booklet-galery__img { position: relative; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; z-index: 2; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img { position: relative; min-height: 120px; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__content { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-height: 0; overflow: auto; }
    .presentation-slider-wrap.booklet-view .booklet-map__img { position: relative; min-height: 200px; flex: 1; overflow: hidden; border-radius: 8px; display: flex; flex-direction: column; background: #e8e8e8; }
    .presentation-slider-wrap.booklet-view .booklet-map__img > * { flex: 1; min-height: 0; }
    .presentation-slider-wrap.booklet-view .map-placeholder { width: 100%; height: 100%; min-height: 180px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.875rem; }
    @media print {
      .booklet-page { page-break-after: always; height: 100vh; min-height: 100vh; max-height: 100vh; }
      body { padding: 0; }
    }
  `

  const googleFontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700&family=Open+Sans:ital,wght@0,400;0,600;0,700&family=Raleway:ital,wght@0,400;0,600;0,700&family=Rubik:ital,wght@0,400;0,600;0,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700&display=swap" rel="stylesheet">'
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  ${googleFontsLink}
  <style>${embeddedCSS}</style>
</head>
<body>
  <div class="presentation-container presentation-slider-wrap booklet-view">
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
