/**
 * Сервис для работы с сессиями пользователей.
 * Геолокация по IP через ip-api.com (бесплатно, без ключа).
 */

export interface SessionGeo {
  country?: string
  city?: string
  lat?: number
  lon?: number
}

/** Получить геолокацию по IP (ip-api.com, бесплатно) */
export async function getGeoByIp(ip: string): Promise<SessionGeo | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { country?: string; city?: string; lat?: number; lon?: number }
    if (data.lat == null || data.lon == null) return null
    return {
      country: data.country,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
    }
  } catch {
    return null
  }
}

/** Извлечь браузер из User-Agent */
export function parseBrowserFromUserAgent(ua: string | undefined): string {
  if (!ua) return 'Неизвестный браузер'
  const u = ua.toLowerCase()
  if (u.includes('edg/')) return 'Edge'
  if (u.includes('opr/') || u.includes('opera')) return 'Opera'
  if (u.includes('chrome/') && !u.includes('edg')) return 'Chrome'
  if (u.includes('firefox/') || u.includes('fxios')) return 'Firefox'
  if (u.includes('safari/') && !u.includes('chrome')) return 'Safari'
  if (u.includes('yandex')) return 'Yandex Browser'
  if (u.includes('msie') || u.includes('trident')) return 'Internet Explorer'
  return 'Неизвестный браузер'
}

/** Извлечь ОС из User-Agent */
export function parseOsFromUserAgent(ua: string | undefined): string {
  if (!ua) return ''
  const u = ua.toLowerCase()
  if (u.includes('windows')) return 'Windows'
  if (u.includes('mac os') || u.includes('macintosh')) return 'macOS'
  if (u.includes('linux')) return 'Linux'
  if (u.includes('android')) return 'Android'
  if (u.includes('iphone') || u.includes('ipad')) return 'iOS'
  return ''
}
