import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY ?? ''
const DADATA_API_KEY = process.env.DADATA_API_KEY ?? ''
const YANDEX_GEOCODER_API_KEY = process.env.YANDEX_GEOCODER_API_KEY ?? ''

async function gigachatGetToken(log?: { error: (e: unknown) => void }): Promise<string | null> {
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
  if (!res.ok) {
    const body = await res.text()
    log?.error(new Error(`GigaChat OAuth ${res.status}: ${body}`))
    return null
  }
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

type GenerateTextContext = { center?: string; top?: string; characteristics?: Array<{ label?: string; value?: string }> }

async function gigachatGenerateText(
  prompt: string,
  type: 'description' | 'infrastructure',
  log?: { error: (e: unknown) => void },
  context?: GenerateTextContext
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (!GIGACHAT_AUTH_KEY) {
    return { success: false, error: 'GigaChat не настроен. Задайте GIGACHAT_AUTH_KEY в .env на сервере.' }
  }
  const token = await gigachatGetToken(log)
  if (!token) {
    return { success: false, error: 'Не удалось получить токен GigaChat. Проверьте GIGACHAT_AUTH_KEY и доступ к ngw.devices.sberbank.ru.' }
  }

  const systemPrompt =
    type === 'description'
      ? 'Ты помощник по описанию недвижимости. Кратко и по делу опиши объект для слайда презентации: транспортная доступность, местоположение, планировка, особенности. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений. Каждый раз формулируй описание по-разному: используй другие формулировки, акценты и порядок мыслей, не повторяй одни и те же шаблонные фразы. Опирайся в первую очередь на подзаголовок и заголовок с обложки, затем на характеристики объекта.'
      : 'Ты помощник по описанию инфраструктуры рядом с объектом недвижимости. Кратко перечисли, что находится рядом: детский сад, школа, магазины, торговые центры, транспорт. Пиши на русском, без заголовков, одним связным текстом до 3–4 предложений. Каждый раз формулируй по-разному, не повторяй одни и те же формулировки. Опирайся в первую очередь на подзаголовок и заголовок с обложки, затем на характеристики объекта.'

  const parts: string[] = []
  if (context?.center?.trim()) parts.push('Подзаголовок (основной контекст): ' + context.center.trim())
  if (context?.top?.trim()) parts.push('Заголовок: ' + context.top.trim())
  if (context?.characteristics?.length) {
    const lines = context.characteristics
      .filter((item) => item?.label != null || item?.value != null)
      .map((item) => `${String(item.label ?? '').trim() || '—'}: ${String(item.value ?? '').trim() || '—'}`)
    if (lines.length) parts.push('Характеристики: ' + lines.join(', '))
  }
  const contextBlock = parts.length ? 'Контекст объекта:\n' + parts.join('\n') + '\n\n' : ''
  const userMessage = contextBlock + (prompt.trim() ? `Название объекта: ${prompt.trim()}\n\nСгенерируй ${type === 'description' ? 'описание' : 'текст об инфраструктуре'} на основе контекста выше.` : 'Опиши объект недвижимости в общих чертах.')

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
      temperature: 0.85,
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

/** Блок на странице AI-макета: тип, контент, стили (CSS-подобные ключи в camelCase). */
type AiLayoutBlock = {
  id?: string
  type: string
  content?: string
  items?: string[]
  style?: Record<string, string | number>
}

/** Страница AI-макета: название, стили страницы, массив блоков. */
type AiLayoutPage = {
  id?: string
  name?: string
  style?: Record<string, string | number>
  blocks?: AiLayoutBlock[]
}

type AiLayoutResponse = {
  title?: string
  pages?: AiLayoutPage[]
}

async function gigachatGenerateLayout(
  prompt: string,
  log?: { error: (e: unknown) => void }
): Promise<{ success: boolean; layout?: AiLayoutResponse; error?: string }> {
  if (!GIGACHAT_AUTH_KEY) {
    return { success: false, error: 'GigaChat не настроен. Задайте GIGACHAT_AUTH_KEY в .env на сервере.' }
  }
  const token = await gigachatGetToken(log)
  if (!token) {
    return { success: false, error: 'Не удалось получить токен GigaChat. Проверьте GIGACHAT_AUTH_KEY и доступ к ngw.devices.sberbank.ru.' }
  }

  const systemPrompt =
    'Ты дизайнер презентаций. Твоя задача — придумать УНИКАЛЬНУЮ структуру макета презентации: свои страницы, расположение элементов и стили. ' +
    'Не используй готовые шаблоны типа "обложка, описание, контакты". Придумай свой набор страниц и блоков на каждой странице. ' +
    'Ответ — строго один JSON без Markdown и комментариев. ' +
    'Формат: {"title": "Название презентации", "pages": [{"id": "page-1", "name": "Название страницы", "style": {...}, "blocks": [{"id": "b1", "type": "...", "content": "...", "style": {...}}]}]}. ' +
    'Типы блоков: heading (заголовок), title (крупный заголовок), subtitle (подзаголовок), text (абзац), list (список — у блока поле "items": ["пункт1","пункт2"]), quote (цитата), divider (разделитель), image_placeholder (блок под картинку), columns (два столбца — у блока "columns": [{"type":"text","content":"..."},{"type":"text","content":"..."}]). ' +
    'В style для страницы и блоков используй только допустимые CSS-свойства в camelCase: display, flexDirection, alignItems, justifyContent, padding, gap, backgroundColor, color, fontSize, fontWeight, textAlign, lineHeight, marginTop, marginBottom, borderBottom, borderRadius, width, maxWidth. Значения — строки или числа. ' +
    'Создай 3–6 страниц с разным оформлением: разный фон, выравнивание, размеры шрифтов, отступы. Каждая страница — уникальный макет.'

  const userMessage =
    (prompt.trim()
      ? `Запрос пользователя:\n${prompt.trim()}\n\nСгенерируй уникальный макет презентации под этот запрос: свои страницы, блоки и стили. Ответ — только JSON.`
      : 'Сгенерируй уникальный макет презентации по недвижимости: 4–5 страниц со своим расположением блоков и стилями. Ответ — только JSON.')

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
      temperature: 0.8,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    return { success: false, error: err.error?.message ?? 'Ошибка запроса к GigaChat при генерации макета' }
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const raw = data.choices?.[0]?.message?.content ?? ''
  const text = raw.trim()
  if (!text) return { success: false, error: 'Пустой ответ GigaChat' }

  let jsonText = text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonText = codeBlockMatch[1].trim()
  }
  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1)
  }

  try {
    const parsed = JSON.parse(jsonText) as AiLayoutResponse
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Некорректный формат макета от GigaChat' }
    }
    if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return { success: false, error: 'В ответе GigaChat нет массива pages' }
    }
    return { success: true, layout: parsed }
  } catch (e) {
    log?.error?.(e)
    return { success: false, error: 'Не удалось разобрать JSON макета от GigaChat' }
  }
}

type SuggestItem = { display_name: string; address: string; lat?: number; lon?: number }

/** Подсказки по адресам через Dadata (https://dadata.ru/api/suggest/address/) */
async function dadataSuggest(q: string, limit: number): Promise<SuggestItem[]> {
  if (!DADATA_API_KEY) return []
  const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify({ query: q, count: Math.min(limit, 20) }),
  })
  if (!res.ok) return []
  const data = (await res.json()) as {
    suggestions?: Array<{
      value?: string
      unrestricted_value?: string
      data?: { geo_lat?: string | null; geo_lon?: string | null }
    }>
  }
  const list = data.suggestions ?? []
  return list.map((s) => {
    const value = s.value ?? s.unrestricted_value ?? ''
    const lat = s.data?.geo_lat != null ? parseFloat(String(s.data.geo_lat)) : NaN
    const lon = s.data?.geo_lon != null ? parseFloat(String(s.data.geo_lon)) : NaN
    return {
      display_name: value,
      address: value,
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
    }
  })
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
    if (!DADATA_API_KEY) {
      return reply.send({
        suggestions: [],
        error: 'Подсказки адресов не настроены. Задайте DADATA_API_KEY в .env на сервере (dadata.ru).',
      })
    }
    const q = (req.query.q ?? '').trim()
    if (q.length < 2) {
      return reply.send({ suggestions: [] })
    }
    try {
      const suggestions = await dadataSuggest(q, 10)
      return reply.send({ suggestions })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ suggestions: [] })
    }
  })

  app.get<{ Querystring: { address?: string; q?: string } }>('/geocode', async (req: FastifyRequest<{ Querystring: { address?: string; q?: string } }>, reply: FastifyReply) => {
    if (!YANDEX_GEOCODER_API_KEY) {
      return reply.status(503).send({ success: false, error: 'Геокодер не настроен. Задайте YANDEX_GEOCODER_API_KEY в .env на сервере.' })
    }
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
    if (!YANDEX_GEOCODER_API_KEY) {
      return reply.status(503).send({ success: false, stations: [], error: 'Поиск метро не настроен. Задайте YANDEX_GEOCODER_API_KEY в .env на сервере.' })
    }
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

  app.post<{ Body: { type?: string; prompt?: string; object_title?: string; center?: string; top?: string; characteristics?: Array<{ label?: string; value?: string }> } }>('/generate_text', async (req: FastifyRequest<{ Body: { type?: string; prompt?: string; object_title?: string; center?: string; top?: string; characteristics?: Array<{ label?: string; value?: string }> } }>, reply: FastifyReply) => {
    const type = (req.body?.type === 'infrastructure' ? 'infrastructure' : 'description') as 'description' | 'infrastructure'
    const prompt = String(req.body?.prompt ?? req.body?.object_title ?? '').trim() || 'объект недвижимости'
    const context: GenerateTextContext = {
      center: req.body?.center != null ? String(req.body.center) : undefined,
      top: req.body?.top != null ? String(req.body.top) : undefined,
      characteristics: Array.isArray(req.body?.characteristics) ? req.body.characteristics : undefined,
    }
    try {
      const result = await gigachatGenerateText(prompt, type, app.log, context)
      if (result.success && result.text) {
        return reply.send({ text: result.text })
      }
      return reply.status(400).send({ error: result.error ?? 'Не удалось сгенерировать текст' })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Ошибка сервера при генерации текста' })
    }
  })

  app.post<{ Body: { prompt?: string } }>('/generate_layout', async (req: FastifyRequest<{ Body: { prompt?: string } }>, reply: FastifyReply) => {
    const prompt = String(req.body?.prompt ?? '').trim()
    try {
      const result = await gigachatGenerateLayout(prompt, app.log)
      if (result.success && result.layout) {
        const title = typeof result.layout.title === 'string' && result.layout.title.trim().length
          ? result.layout.title.trim()
          : prompt || 'Новая презентация'
        const pages = Array.isArray(result.layout.pages) ? result.layout.pages : []
        return reply.send({ title, pages })
      }
      return reply.status(400).send({ error: result.error ?? 'Не удалось сгенерировать макет презентации' })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Ошибка сервера при генерации макета' })
    }
  })
}
