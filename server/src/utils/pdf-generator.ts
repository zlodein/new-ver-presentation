import puppeteer from 'puppeteer'
import { existsSync } from 'node:fs'
import type { ViewSlideItem } from './types.js'

interface PresentationData {
  id: string
  title: string
  coverImage?: string
  content: { slides: ViewSlideItem[] }
}

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
  grid: '2x2',
  contacts: '1x2',
}

function getImageGridLimit(dataObj: Record<string, unknown>, slideType: string): { cols: number; rows: number; limit: number } {
  const grid = String(dataObj.imageGrid || DEFAULT_IMAGE_GRID[slideType] || '2x2')
  const [c, r] = grid.split('x').map(Number)
  const cols = c || 2
  const rows = r || 2
  return { cols, rows, limit: cols * rows }
}

/** Генерирует HTML для презентации */
function generatePresentationHTML(data: PresentationData, baseUrl: string): string {
  const slides = data.content?.slides || []
  const visibleSlides = slides.filter((s) => !s.hidden)

  const slideHTML = visibleSlides.map((slide) => {
    switch (slide.type) {
      case 'cover': {
        const dataObj = slide.data || {}
        const coverImage = String(dataObj.coverImageUrl || dataObj.background_image || data.coverImage || '')
        const title = String(dataObj.title || 'ЭКСКЛЮЗИВНОЕ ПРЕДЛОЖЕНИЕ')
        const subtitle = String(dataObj.subtitle || '')
        const dealType = String(dataObj.deal_type || 'Аренда')
        const price = Number(dataObj.price_value || 0)
        const currency = String(dataObj.currency || 'RUB')
        const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€', CNY: '¥', KZT: '₸' }
        const symbol = currencySymbols[currency] || '₽'
        const formatPrice = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

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
                    <div class="booklet-main__bottom">
                      <p class="text-sm font-medium text-gray-600">${dealType}</p>
                      <p class="text-lg font-semibold text-gray-800">
                        ${formatPrice(Number(price))} ${symbol}
                        ${dealType === 'Аренда' ? '<span class="text-sm font-normal">/ месяц</span>' : ''}
                      </p>
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
        const { cols, rows, limit } = getImageGridLimit(dataObj, 'description')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const gridStyle = `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-info">
                <div class="booklet-info__top-square"></div>
                <div class="booklet-info__bottom-square"></div>
                <div class="booklet-info__wrap">
                  <div class="booklet-info__block booklet-info__content">
                    <h2 class="booklet-info__title">${heading}</h2>
                    <div class="booklet-info__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-info__grid" style="${gridStyle}">
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
        const { cols, rows, limit } = getImageGridLimit(dataObj, 'infrastructure')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const gridStyle = `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-stroen">
                <div class="booklet-stroen__top-square"></div>
                <div class="booklet-stroen__bottom-square"></div>
                <div class="booklet-stroen__wrap">
                  <div class="booklet-stroen__block booklet-stroen__content">
                    <h2 class="booklet-stroen__title">${heading}</h2>
                    <div class="booklet-stroen__text">${String(text).replace(/\n/g, '<br>')}</div>
                  </div>
                  <div class="booklet-stroen__grid" style="${gridStyle}">
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

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-map">
                <div class="booklet-map__wrap">
                  <h2 class="booklet-map__title">${heading}</h2>
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
                <div class="booklet-img__top-square"></div>
                <div class="booklet-img__bottom-square"></div>
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
        const heading = String(dataObj.heading || dataObj.title || '')
        const { cols, rows, limit } = getImageGridLimit(dataObj, 'gallery')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const gridStyle = `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-galery">
                <div class="booklet-galery__top-square"></div>
                <div class="booklet-galery__bottom-square"></div>
                <div class="booklet-galery__wrap">
                  ${heading ? `<h2 class="mb-2 font-semibold uppercase col-span-full">${heading}</h2>` : ''}
                  <div class="booklet-galery__grid" style="${gridStyle}">
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
                  <h2 class="booklet-char__title">${heading}</h2>
                  ${imageUrl ? `
                    <div class="booklet-char__img">
                      <div class="booklet-char__top-square"></div>
                      <div class="booklet-char__bottom-square"></div>
                      <img src="${toAbsoluteImageUrl(imageUrl, baseUrl).replace(/"/g, '&quot;')}" alt="">
                    </div>
                  ` : ''}
                  <div class="booklet-char__content">
                    <div class="booklet-char__table">
                      ${items.map((item) => `
                        <div class="booklet-char__row">
                          <div class="booklet-char__item text-gray-600">${item.label || ''}</div>
                          <div class="booklet-char__item font-medium">${item.value || ''}</div>
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
      case 'grid': {
        const dataObj = slide.data || {}
        const heading = String(dataObj.heading || dataObj.title || '')
        const { cols, rows, limit } = getImageGridLimit(dataObj, 'grid')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const gridStyle = `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-grid">
                <div class="booklet-grid__top-square"></div>
                <div class="booklet-grid__bottom-square"></div>
                <div class="booklet-grid__wrap">
                  ${heading ? `<h2 class="mb-2 font-semibold uppercase col-span-full">${heading}</h2>` : ''}
                  <div class="booklet-grid__grid" style="${gridStyle}">
                    ${images.map((url) => `<div class="booklet-grid__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                  </div>
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
        const { cols, rows, limit } = getImageGridLimit(dataObj, 'contacts')
        const images = toImageUrls((dataObj.images as unknown[]) || [], limit)
        const gridStyle = `grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`

        return `
          <div class="booklet-page">
            <div class="booklet-page__inner">
              <div class="booklet-content booklet-contacts">
                <div class="booklet-contacts__wrap">
                  <div class="booklet-contacts__block booklet-contacts__content">
                    <h2 class="mb-2 text-base font-semibold uppercase">${heading}</h2>
                    ${contactName ? `<p>${contactName}</p>` : ''}
                    ${phone ? `<p>${phone}</p>` : ''}
                    ${email ? `<p>${email}</p>` : ''}
                    ${role ? `<p>${role}</p>` : ''}
                    ${address ? `<p>${address}</p>` : ''}
                  </div>
                  <div class="booklet-contacts__images-wrap">
                    <div class="booklet-contacts__top-square"></div>
                    <div class="booklet-contacts__bottom-square"></div>
                    <div class="booklet-contacts-grid" style="${gridStyle}">
                      ${images.map((url) => `<div class="booklet-contacts__block booklet-contacts__img">${url ? `<img src="${toAbsoluteImageUrl(url, baseUrl).replace(/"/g, '&quot;')}" alt="">` : ''}</div>`).join('')}
                    </div>
                  </div>
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

  // Встроенные CSS стили для PDF (упрощенная версия основных стилей)
  const embeddedCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #eeeeee; padding: 20px; }
    .presentation-container { max-width: 1200px; margin: 0 auto; background: white; }
    .booklet-page { page-break-after: always; position: relative; width: 100%; min-height: 100vh; background-color: #eeeeee; padding: 1rem; }
    .booklet-page:last-child { page-break-after: auto; }
    .presentation-slider-wrap.booklet-view { --theme-main-color: #2c7f8d; }
    .presentation-slider-wrap.booklet-view .booklet-page__inner { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; padding: 1rem; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-content { position: relative; width: 100%; height: 100%; min-height: 0; max-height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-main__wrap { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 0; width: 100%; height: 100%; min-height: 0; max-height: 100%; }
    .presentation-slider-wrap.booklet-view .booklet-main__img { position: relative; flex: 0 0 50%; min-width: 200px; min-height: 280px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #e8e8e8; box-sizing: border-box; padding: 40px 0 40px 40px; box-shadow: 7px 7px 7px rgba(73, 71, 71, 0.2); }
    .presentation-slider-wrap.booklet-view .booklet-main__img img, .presentation-slider-wrap.booklet-view .booklet-img__img img, .presentation-slider-wrap.booklet-view .booklet-galery__img img, .presentation-slider-wrap.booklet-view .booklet-grid__img img, .presentation-slider-wrap.booklet-view .booklet-char__img img, .presentation-slider-wrap.booklet-view .booklet-layout__img img, .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img img, .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img img { width: 100%; height: 100%; min-width: 0; min-height: 0; max-width: 100%; max-height: 100%; object-fit: contain; object-position: center; display: block; }
    .presentation-slider-wrap.booklet-view .booklet-main__content { flex: 1 1 50%; min-width: 200px; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; padding: 40px 25px; }
    .presentation-slider-wrap.booklet-view .booklet-main__top, .presentation-slider-wrap.booklet-view .booklet-main__center { flex: 0 0 auto; font-size: 1rem; line-height: 1.3; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-main__center { font-size: 1.25rem; margin-top: 0.25rem; }
    .presentation-slider-wrap.booklet-view .booklet-main__bottom { flex: 0 0 auto; margin-top: auto; }
    .presentation-slider-wrap.booklet-view .booklet-info__top-square, .presentation-slider-wrap.booklet-view .booklet-info__bottom-square, .presentation-slider-wrap.booklet-view .booklet-stroen__top-square, .presentation-slider-wrap.booklet-view .booklet-stroen__bottom-square, .presentation-slider-wrap.booklet-view .booklet-img__top-square, .presentation-slider-wrap.booklet-view .booklet-img__bottom-square, .presentation-slider-wrap.booklet-view .booklet-galery__top-square, .presentation-slider-wrap.booklet-view .booklet-galery__bottom-square, .presentation-slider-wrap.booklet-view .booklet-grid__top-square, .presentation-slider-wrap.booklet-view .booklet-grid__bottom-square { position: absolute; width: 45px; height: 45px; z-index: 2; background-color: var(--theme-main-color); border-radius: 0; }
    .presentation-slider-wrap.booklet-view .booklet-info__top-square, .presentation-slider-wrap.booklet-view .booklet-stroen__top-square, .presentation-slider-wrap.booklet-view .booklet-img__top-square, .presentation-slider-wrap.booklet-view .booklet-galery__top-square, .presentation-slider-wrap.booklet-view .booklet-grid__top-square { top: 15px; left: 15px; }
    .presentation-slider-wrap.booklet-view .booklet-info__bottom-square, .presentation-slider-wrap.booklet-view .booklet-stroen__bottom-square, .presentation-slider-wrap.booklet-view .booklet-img__bottom-square, .presentation-slider-wrap.booklet-view .booklet-galery__bottom-square, .presentation-slider-wrap.booklet-view .booklet-grid__bottom-square { bottom: 15px; right: 15px; }
    .presentation-slider-wrap.booklet-view .booklet-info__wrap, .presentation-slider-wrap.booklet-view .booklet-stroen__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-info__title, .presentation-slider-wrap.booklet-view .booklet-stroen__title, .presentation-slider-wrap.booklet-view .booklet-char__title, .presentation-slider-wrap.booklet-view .booklet-layout__title, .presentation-slider-wrap.booklet-view .booklet-map__title { margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #1a1a1a; }
    .presentation-slider-wrap.booklet-view .booklet-info__text, .presentation-slider-wrap.booklet-view .booklet-stroen__text { flex: 1; min-height: 60px; overflow: auto; font-size: 0.9375rem; line-height: 1.5; color: #444; }
    .presentation-slider-wrap.booklet-view .booklet-info__grid, .presentation-slider-wrap.booklet-view .booklet-stroen__grid { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; min-height: 0; flex: 1; }
    .presentation-slider-wrap.booklet-view .booklet-info__block.booklet-info__img, .presentation-slider-wrap.booklet-view .booklet-stroen__block.booklet-stroen__img { position: relative; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-char__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-char__img { position: relative; min-height: 180px; overflow: visible; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-char__table { flex: 1; margin-top: 2.5rem; display: flex; flex-direction: column; gap: 0; }
    .presentation-slider-wrap.booklet-view .booklet-char__row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(0, 0, 0, 0.08); align-items: center; }
    .presentation-slider-wrap.booklet-view .booklet-layout__wrap { display: flex; flex-direction: column; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-layout__img { position: relative; flex: 1; min-height: 240px; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-layout__img img { width: 100%; height: 100%; object-fit: contain; }
    .presentation-slider-wrap.booklet-view .booklet-galery__wrap, .presentation-slider-wrap.booklet-view .booklet-grid__wrap { display: flex; flex-direction: column; gap: 8px; padding: 15px 15px 70px 70px; width: 100%; height: 100%; min-height: 0; max-height: 100%; box-sizing: border-box; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-galery__grid, .presentation-slider-wrap.booklet-view .booklet-grid__grid { display: grid; gap: 12px; flex: 1; min-height: 0; overflow: hidden; }
    .presentation-slider-wrap.booklet-view .booklet-galery__img, .presentation-slider-wrap.booklet-view .booklet-grid__img { position: relative; min-height: 0; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; z-index: 2; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding: 15px 15px 70px 70px; width: 100%; height: 100%; min-height: 320px; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__images-wrap { position: relative; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__images-wrap .booklet-contacts__top-square, .presentation-slider-wrap.booklet-view .booklet-contacts__images-wrap .booklet-contacts__bottom-square { position: absolute; width: 45px; height: 45px; z-index: 1; background-color: var(--theme-main-color); border-radius: 0; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__images-wrap .booklet-contacts__top-square { top: 15px; left: 15px; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__images-wrap .booklet-contacts__bottom-square { bottom: 15px; right: 15px; }
    .presentation-slider-wrap.booklet-view .booklet-contacts-grid { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__img { position: relative; min-height: 120px; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; }
    .presentation-slider-wrap.booklet-view .booklet-contacts__block.booklet-contacts__content { display: flex; flex-direction: column; gap: 0.5rem; }
    .presentation-slider-wrap.booklet-view .booklet-img__wrap { position: relative; width: 100%; height: 100%; min-height: 320px; padding: 20px 20px 80px 80px; box-sizing: border-box; }
    .presentation-slider-wrap.booklet-view .booklet-img__img { position: relative; width: 100%; height: 100%; min-height: 280px; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; z-index: 2; margin: -30px; padding: 30px; }
    .presentation-slider-wrap.booklet-view .booklet-map__wrap { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; width: 100%; height: 100%; min-height: 320px; }
    .presentation-slider-wrap.booklet-view .booklet-map__img { position: relative; min-height: 200px; height: 100%; overflow: hidden; border-radius: 8px; display: flex; flex-direction: column; min-height: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__content { position: relative; display: flex; flex-direction: column; gap: 0.75rem; }
    .presentation-slider-wrap.booklet-view .booklet-map__top-square, .presentation-slider-wrap.booklet-view .booklet-map__bottom-square { position: absolute; width: 40px; height: 40px; z-index: 2; background-color: var(--theme-main-color); border-radius: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__top-square { top: 0; right: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__bottom-square { bottom: 0; left: 0; }
    .presentation-slider-wrap.booklet-view .booklet-map__info { flex: 1; font-size: 0.9375rem; color: #444; }
    @media print { .booklet-page { page-break-after: always; min-height: 100vh; } body { padding: 0; } }
  `

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
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
          .filter(img => !img.complete)
          .map(img => new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = resolve // Продолжаем даже если изображение не загрузилось
            setTimeout(resolve, 5000) // Таймаут 5 секунд на изображение
          }))
      )
    })
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    })
    
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
