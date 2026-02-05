import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY ?? ''
const YANDEX_GEOCODER_API_KEY = process.env.YANDEX_GEOCODER_API_KEY ?? ''

async function gigachatGetToken(): Promise<string | null> {
  if (!GIGACHAT_AUTH_KEY) return null
  const rqUid = crypto.randomUUID()
  const res = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: rqUid,
      Authorization: 'Basic ' + GIGACHAT_AUTH_KEY,
    },
    body: 'scope=GIGACHAT_API_PERS',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

async function gigachatGenerateText(
  prompt: string,
  type: 'description' | 'infrastructure'
): Promise<{ success: boolean; text?: string; error?: string }> {
  const token = await gigachatGetToken()
  if (!token) return { success: false, error: 'Не удалось получить токен GigaChat' }

  const systemPrompt =
    type === 'description'
      ? 'Ты помощник по описанию недвижимости. Кратко и по делу опиши объект для слайда презентации: транспортная доступность, местоположение, планировка, особенности. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений.'
      : 'Ты помощник по описанию инфраструктуры рядом с объектом недвижимости. Кратко перечисли, что находится рядом: детский сад, школа, магазины, торговые центры, транспорт. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений.'

  const userMessage = prompt.trim() || 'Опиши объект недвижимости в общих чертах.'

  const res = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    return { success: false, error: err.error?.message ?? 'Ошибка запроса к GigaChat' }
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (text) return { success: true, text }
  return { success: false, error: 'Пустой ответ GigaChat' }
}

async function yandexSuggest(q: string, limit: number): Promise<Array<{ display_name: string; address: string; lat?: number; lon?: number }>> {
  if (!YANDEX_GEOCODER_API_KEY) return []
  const url =
    'https://suggest-maps.yandex.ru/v1/suggest?' +
    new URLSearchParams({
      apikey: YANDEX_GEOCODER_API_KEY,
      text: q,
      types: 'geo',
      results: String(Math.min(limit, 10)),
      lang: 'ru_RU',
    })
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { results?: Array<{ title?: { text?: string }; subtitle?: { text?: string }; uri?: string }> }
  const list = data.results ?? []
  const out: Array<{ display_name: string; address: string; lat?: number; lon?: number }> = []
  for (const item of list) {
    const title = item.title?.text ?? ''
    const subtitle = item.subtitle?.text ?? ''
    const displayName = subtitle ? title + ', ' + subtitle : title
    if (!displayName) continue
    let lat: number | undefined
    let lon: number | undefined
    const toGeocode = item.uri ?? displayName
    const point = await yandexGeocode(toGeocode)
    if (point) {
      lat = point.lat
      lon = point.lon
    }
    out.push({ display_name: displayName, address: displayName, lat, lon })
  }
  return out
}

async function yandexGeocode(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  if (!YANDEX_GEOCODER_API_KEY) return null
  const url =
    'https://geocode-maps.yandex.ru/1.x/?' +
    new URLSearchParams({
      apikey: YANDEX_GEOCODER_API_KEY,
      geocode: address,
      format: 'json',
      results: '1',
      lang: 'ru_RU',
    })
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: { Point?: { pos?: string } }
        }>
      }
    }
  }
  const pos = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
  if (!pos) return null
  const [lonStr, latStr] = pos.trim().split(/\s+/)
  const lon = parseFloat(lonStr)
  const lat = parseFloat(latStr)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  return null
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function yandexFindNearestMetro(
  lat: number,
  lng: number,
  limit: number
): Promise<Array<{ name: string; distance_text: string; walk_time_text: string; drive_time_text: string }>> {
  if (!YANDEX_GEOCODER_API_KEY) return []
  const url =
    'https://geocode-maps.yandex.ru/1.x/?' +
    new URLSearchParams({
      apikey: YANDEX_GEOCODER_API_KEY,
      geocode: `${lng},${lat}`,
      kind: 'metro',
      results: String(limit),
      format: 'json',
      lang: 'ru_RU',
    })
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: {
            name?: string
            Point?: { pos?: string }
          }
        }>
      }
    }
  }
  const members = data.response?.GeoObjectCollection?.featureMember ?? []
  const stations: Array<{ name: string; distance_text: string; walk_time_text: string; drive_time_text: string }> = []
  for (const m of members.slice(0, limit)) {
    const obj = m.GeoObject
    const name = obj?.name ?? 'Станция метро'
    const pos = obj?.Point?.pos
    let distance_text = ''
    let walk_time_text = ''
    let drive_time_text = ''
    if (pos) {
      const [mlonStr, mlatStr] = pos.trim().split(/\s+/)
      const mlat = parseFloat(mlatStr)
      const mlon = parseFloat(mlonStr)
      if (Number.isFinite(mlat) && Number.isFinite(mlon)) {
        const km = haversineKm(lat, lng, mlat, mlon)
        distance_text = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(2)} км`
        const walkMin = Math.max(1, Math.round(km * 12))
        walk_time_text = `${walkMin} мин`
        const driveMin = Math.max(1, Math.round(km * 2.5))
        drive_time_text = `${driveMin} мин`
      }
    }
    stations.push({ name, distance_text, walk_time_text, drive_time_text })
  }
  return stations
}

export async function editorApiRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { q?: string } }>('/suggest', async (req: FastifyRequest<{ Querystring: { q?: string } }>, reply: FastifyReply) => {
    const q = (req.query.q ?? '').trim()
    if (q.length < 2) {
      return reply.send({ suggestions: [] })
    }
    try {
      const suggestions = await yandexSuggest(q, 10)
      return reply.send({ suggestions })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ suggestions: [] })
    }
  })

  app.get<{ Querystring: { address?: string; q?: string } }>('/geocode', async (req: FastifyRequest<{ Querystring: { address?: string; q?: string } }>, reply: FastifyReply) => {
    const address = (req.query.address ?? req.query.q ?? '').trim()
    if (!address) {
      return reply.status(400).send({ success: false, error: 'Укажите адрес' })
    }
    try {
      const point = await yandexGeocode(address)
      if (point) return reply.send({ success: true, lat: point.lat, lng: point.lon })
      return reply.status(404).send({ success: false, error: 'Адрес не найден' })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ success: false, error: 'Ошибка геокодирования' })
    }
  })

  app.post<{ Body: { lat?: number; lng?: number } }>('/find_nearest_metro', async (req: FastifyRequest<{ Body: { lat?: number; lng?: number } }>, reply: FastifyReply) => {
    const lat = Number(req.body?.lat)
    const lng = Number(req.body?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return reply.status(400).send({ error: 'Неверные координаты', stations: [] })
    }
    try {
      const stations = await yandexFindNearestMetro(lat, lng, 3)
      return reply.send({ success: true, stations })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ success: false, stations: [] })
    }
  })

  app.post<{ Body: { type?: string; prompt?: string; object_title?: string } }>('/generate_text', async (req: FastifyRequest<{ Body: { type?: string; prompt?: string; object_title?: string } }>, reply: FastifyReply) => {
    const type = (req.body?.type === 'infrastructure' ? 'infrastructure' : 'description') as 'description' | 'infrastructure'
    const prompt = String(req.body?.prompt ?? req.body?.object_title ?? '').trim() || 'объект недвижимости'
    try {
      const result = await gigachatGenerateText(prompt, type)
      if (result.success && result.text) {
        return reply.send({ text: result.text })
      }
      return reply.status(400).send({ error: result.error ?? 'Не удалось сгенерировать текст' })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Ошибка сервера при генерации текста' })
    }
  })
}
