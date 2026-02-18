import crypto from 'node:crypto'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'
import { deletePresentationImagesFolder } from './upload.js'
import { generatePDF } from '../utils/pdf-generator.js'
import type { ViewSlideItem } from '../utils/types.js'
import { toIsoDateRequired } from '../utils/date.js'

function toIsoDate(d: Date | string): string {
  return toIsoDateRequired(d)
}

const SHORT_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
/** Генерирует короткий идентификатор презентации из 6 цифро-буквенных символов (для тех. поддержки). */
function generatePresentationShortId(): string {
  const bytes = crypto.randomBytes(6)
  let id = ''
  for (let i = 0; i < 6; i++) id += SHORT_ID_CHARS[bytes[i]! % SHORT_ID_CHARS.length]
  return id
}
/** Для MySQL: id может прийти как "1", "1.0" или "1:1" (артефакт) — берём целое число (до двоеточия или первая последовательность цифр). */
function parseMysqlId(id: string): number | null {
  if (id == null || typeof id !== 'string') return null
  const s = String(id).trim()
  const numPart = s.includes(':') ? s.split(':')[0]?.trim() ?? s : s
  let num = Math.floor(Number(numPart))
  if (Number.isNaN(num) || num < 1) {
    const digits = /^\d+/.exec(numPart) ?? /\d+/.exec(s)
    num = digits ? Math.floor(Number(digits[0])) : 0
  }
  return num >= 1 ? num : null
}

/** Извлекает id презентации из path (на случай, если прокси не передаёт :id в params). */
function getIdFromDeleteRequest(req: FastifyRequest<{ Params: { id?: string } }>): string {
  const fromParams = req.params?.id
  if (fromParams != null && String(fromParams).trim() !== '') return String(fromParams).trim()
  const path = (req as { url?: string }).url ?? (req as { raw?: { url?: string } }).raw?.url ?? ''
  const match = /\/api\/presentations\/([^/?#]+)/.exec(path)
  return match ? decodeURIComponent(match[1]) : ''
}
type ContentSettings = {
  fontFamily?: string
  imageBorderRadius?: string
  fontSizePresentationTitle?: string
  fontSizeHeading?: string
  fontSizeText?: string
  fontSizePrice?: string
}

function normContent(c: unknown): { slides: unknown[]; settings?: ContentSettings } {
  let slides: unknown[] = []
  let rawObj: { slides?: unknown[]; settings?: Record<string, unknown> } | undefined
  if (typeof c === 'string') {
    try {
      const parsed = JSON.parse(c) as { slides?: unknown[]; settings?: Record<string, unknown> } | unknown[]
      rawObj = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as { slides?: unknown[]; settings?: Record<string, unknown> }) : undefined
      slides = Array.isArray(parsed) ? parsed : Array.isArray(rawObj?.slides) ? rawObj!.slides : []
    } catch {
      slides = []
    }
  } else {
    const obj = c as { slides?: unknown[]; settings?: Record<string, unknown> } | undefined
    rawObj = obj
    slides = Array.isArray(obj) ? obj : Array.isArray(obj?.slides) ? obj!.slides : []
  }
  // Нормализуем каждый слайд: гарантируем наличие data со всеми полями (для просмотра и PDF)
  const normalized = slides.map((s) => {
    const raw = s as Record<string, unknown>
    const type = String(raw.type ?? '')
    const hidden = Boolean(raw.hidden ?? (raw.data as Record<string, unknown>)?.hidden)
    const dataSource = (raw.data as Record<string, unknown>) ?? raw
    const data = typeof dataSource === 'object' && dataSource !== null && !Array.isArray(dataSource)
      ? { ...dataSource }
      : {}
    // Убедимся, что в data попали все поля из плоского слайда (кроме служебных)
    const skipKeys = new Set(['type', 'id', 'hidden', 'data'])
    for (const [k, v] of Object.entries(raw)) {
      if (!skipKeys.has(k) && v !== undefined && !(k in data)) (data as Record<string, unknown>)[k] = v
    }
    return { type, data, hidden, id: raw.id }
  })
  const result: { slides: unknown[]; settings?: ContentSettings } = { slides: normalized }
  const settings = getContentSettings(rawObj ?? c)
  if (settings && Object.keys(settings).length > 0) {
    result.settings = settings
  }
  return result
}

function getContentSettings(c: unknown): ContentSettings | undefined {
  if (c == null || typeof c !== 'object') return undefined
  const obj = c as { settings?: Record<string, unknown> }
  if (!obj.settings || typeof obj.settings !== 'object') return undefined
  const s = obj.settings
  const fontFamily = typeof s.fontFamily === 'string' ? s.fontFamily : undefined
  const imageBorderRadius = s.imageBorderRadius !== undefined && s.imageBorderRadius !== null ? String(s.imageBorderRadius) : undefined
  const fontSizePresentationTitle = s.fontSizePresentationTitle !== undefined && s.fontSizePresentationTitle !== null ? String(s.fontSizePresentationTitle) : undefined
  const fontSizeHeading = s.fontSizeHeading !== undefined && s.fontSizeHeading !== null ? String(s.fontSizeHeading) : undefined
  const fontSizeText = s.fontSizeText !== undefined && s.fontSizeText !== null ? String(s.fontSizeText) : undefined
  const fontSizePrice = s.fontSizePrice !== undefined && s.fontSizePrice !== null ? String(s.fontSizePrice) : undefined
  if (
    fontFamily == null && imageBorderRadius == null &&
    fontSizePresentationTitle == null && fontSizeHeading == null && fontSizeText == null && fontSizePrice == null
  ) {
    return undefined
  }
  return {
    ...(fontFamily != null ? { fontFamily } : {}),
    ...(imageBorderRadius != null ? { imageBorderRadius } : {}),
    ...(fontSizePresentationTitle != null ? { fontSizePresentationTitle } : {}),
    ...(fontSizeHeading != null ? { fontSizeHeading } : {}),
    ...(fontSizeText != null ? { fontSizeText } : {}),
    ...(fontSizePrice != null ? { fontSizePrice } : {}),
  }
}

export async function presentationRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest) => (req.user as { sub: string })?.sub

  app.get('/api/presentations', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
    if (useFileStore) {
      const list = fileStore.getPresentationsByUserId(userId)
      return reply.send(
        list.map((p) => ({
          id: p.id,
          title: p.title,
          coverImage: p.coverImage ?? undefined,
          updatedAt: toIsoDate(p.updatedAt as string | Date),
          status: (p as { status?: string }).status ?? 'draft',
        }))
      )
    }
    if (useMysql) {
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
      const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
        where: eq(mysqlSchema.presentations.user_id, userIdNum),
        columns: { id: true, title: true, cover_image: true, updated_at: true, status: true, is_public: true, public_url: true, short_id: true },
        orderBy: [desc(mysqlSchema.presentations.updated_at)],
      })
      return reply.send(
        list.map((p: { id: number; title: string; cover_image: string | null; updated_at: Date; status?: string | null; is_public?: number | null; public_url?: string | null; short_id?: string | null }) => ({
          id: String(p.id),
          title: p.title,
          coverImage: p.cover_image ?? undefined,
          updatedAt: toIsoDate(p.updated_at),
          status: p.status ?? 'draft',
          isPublic: Boolean(p.is_public),
          publicUrl: p.public_url ?? undefined,
          shortId: p.short_id ?? undefined,
        }))
      )
    }
    const list = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.presentations.findMany({
      where: eq(pgSchema.presentations.userId, userId),
      columns: { id: true, title: true, coverImage: true, updatedAt: true, status: true },
      orderBy: [desc(pgSchema.presentations.updatedAt)],
    })
    return reply.send(
      list.map((p: { id: string; title: string; coverImage: string | null; updatedAt: Date | string; status?: string | null }) => ({
        id: p.id,
        title: p.title,
        coverImage: p.coverImage ?? undefined,
        updatedAt: toIsoDate(p.updatedAt),
        status: p.status ?? 'draft',
      }))
    )
  })

  app.get<{ Params: { id: string } }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      if (id == null || String(id).trim() === '') {
        return reply.status(400).send({ error: 'Не указан id презентации' })
      }
      const idNum = useMysql ? parseMysqlId(id) : null
      if (useMysql && idNum === null) {
        return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
      }
      if (useFileStore) {
        const row = fileStore.getPresentationById(id, userId!)
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        return reply.send({
          id: row.id,
          title: row.title,
          coverImage: row.coverImage ?? undefined,
          content: normContent(row.content),
          updatedAt: toIsoDate(row.updatedAt),
        })
      }
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        let row = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findFirst({
          where: and(eq(mysqlSchema.presentations.id, idNum!), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        const r = row as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date; status?: string; public_hash?: string | null; is_public?: number; public_url?: string | null; short_id?: string | null }
        let shortId = r.short_id ?? undefined
        if (!shortId) {
          try {
            shortId = generatePresentationShortId()
            await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
              .update(mysqlSchema.presentations)
              .set({ short_id: shortId, updated_at: new Date() })
              .where(and(eq(mysqlSchema.presentations.id, r.id), eq(mysqlSchema.presentations.user_id, userIdNum)))
          } catch {
            shortId = undefined
          }
        }
        return reply.send({
          id: String(r.id),
          title: r.title,
          coverImage: r.cover_image ?? undefined,
          content: normContent(r.slides_data),
          updatedAt: toIsoDate(r.updated_at),
          status: r.status ?? 'draft',
          publicHash: r.public_hash ?? undefined,
          isPublic: Boolean(r.is_public),
          publicUrl: r.public_url ?? undefined,
          shortId: shortId ?? undefined,
        })
      }
      const row = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.presentations.findFirst({
        where: and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)),
      })
      if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
      return reply.send({
        id: row.id,
        title: row.title,
        coverImage: row.coverImage ?? undefined,
        content: normContent(row.content),
        updatedAt: toIsoDate(row.updatedAt as Date | string),
        status: (row as { status?: string }).status ?? 'draft',
      })
    }
  )

  app.post<{
    Body: { title?: string; coverImage?: string; content?: { slides: unknown[] } }
  }>(
    '/api/presentations',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { title?: string; coverImage?: string; content?: { slides: unknown[] } } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const { title, coverImage, content } = req.body ?? {}
      const contentVal = content ?? { slides: [] }
      if (useFileStore) {
        const created = fileStore.createPresentation({
          userId,
          title: title?.trim() || 'Без названия',
          coverImage: coverImage || null,
          content: JSON.stringify(contentVal),
        })
        return reply.status(201).send({
          id: created.id,
          title: created.title,
          coverImage: created.coverImage ?? undefined,
          content: normContent(created.content),
          updatedAt: toIsoDate(created.updatedAt),
        })
      }
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        let userTariff: string | null = null
        let testDriveUsed = false
        let expertPlanQty: number | null = null
        let expertUsed: number | null = null
        try {
          const userRow = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, userIdNum),
            columns: { tariff: true, test_drive_used: true, expert_plan_quantity: true, expert_presentations_used: true },
          })
          const u = userRow as { tariff?: string | null; test_drive_used?: string | boolean; expert_plan_quantity?: number | null; expert_presentations_used?: number | null } | undefined
          userTariff = u?.tariff ?? null
          const tdu = u?.test_drive_used
          testDriveUsed = tdu === 'true' || tdu === true
          expertPlanQty = u?.expert_plan_quantity != null ? Number(u.expert_plan_quantity) : null
          expertUsed = u?.expert_presentations_used != null ? Number(u.expert_presentations_used) : null
        } catch {
          try {
            const userRow = await mysqlDb.query.users.findFirst({
              where: eq(mysqlSchema.users.id, userIdNum),
              columns: { tariff: true, test_drive_used: true },
            })
            const u = userRow as { tariff?: string | null; test_drive_used?: string | boolean } | undefined
            userTariff = u?.tariff ?? null
            const tdu = u?.test_drive_used
            testDriveUsed = tdu === 'true' || tdu === true
          } catch {
            // колонка tariff/test_drive_used может отсутствовать до миграции
          }
        }
        if (userTariff === 'test_drive' && testDriveUsed) {
          return reply.status(403).send({ error: 'Вы уже использовали тест драйв (одну презентацию). Перейдите на тариф «Эксперт» для создания новых презентаций.' })
        }
        const mysqlExpertPlan = expertPlanQty ?? 1
        if (userTariff === 'expert' && expertUsed != null && expertUsed >= mysqlExpertPlan) {
          try {
            await mysqlDb.insert(mysqlSchema.notifications).values({
              user_id: userIdNum,
              title: 'Лимит презентаций исчерпан',
              message: 'Для увеличения лимита выберите в разделе «Тарифы» дополнительное количество презентаций.',
              type: 'presentation',
            })
          } catch (notifErr) {
            req.log.warn(notifErr, 'Ошибка создания уведомления о лимите')
          }
          return reply.status(403).send({ error: `Достигнут лимит презентаций по тарифу (${mysqlExpertPlan}). Удалённые презентации тоже учитываются. Увеличьте пакет в разделе «Тарифы» или дождитесь обновления лимита.` })
        }
        if (userTariff === 'test_drive') {
          const existingList = await mysqlDb.query.presentations.findMany({
            where: eq(mysqlSchema.presentations.user_id, userIdNum),
            columns: { id: true },
          })
          if (existingList.length >= 1) {
            return reply.status(403).send({ error: 'На тарифе «Тест драйв» доступна только одна презентация. Перейдите на тариф «Эксперт» для создания новых.' })
          }
          const slidesCount = Array.isArray(contentVal?.slides) ? contentVal.slides.length : 0
          if (slidesCount > 4) {
            return reply.status(400).send({ error: 'На тарифе «Тест драйв» допускается не более 4 слайдов. Создайте презентацию с 4 слайдами или перейдите на тариф «Эксперт».' })
          }
        }
        let shortId = generatePresentationShortId()
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await mysqlDb
              .insert(mysqlSchema.presentations)
              .values({
                user_id: userIdNum,
                title: title?.trim() || 'Без названия',
                cover_image: coverImage || null,
                slides_data: JSON.stringify(contentVal),
                short_id: shortId,
              })
            break
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            if (attempt < 4 && /Duplicate entry|unique constraint|unique index/i.test(msg)) {
              shortId = generatePresentationShortId()
              continue
            }
            throw err
          }
        }
        const inserted = await mysqlDb.query.presentations.findFirst({
          where: and(eq(mysqlSchema.presentations.user_id, userIdNum), eq(mysqlSchema.presentations.short_id, shortId)),
          columns: { id: true },
        })
        const createdId = (inserted as { id: number } | undefined)?.id
        if (createdId == null) return reply.status(500).send({ error: 'Ошибка при создании презентации' })
        if (userTariff === 'test_drive') {
          try {
            await mysqlDb.update(mysqlSchema.users).set({ test_drive_used: 'true' }).where(eq(mysqlSchema.users.id, userIdNum))
          } catch {
            // колонка может отсутствовать
          }
        }
        if (userTariff === 'expert' && expertUsed != null) {
          try {
            await mysqlDb.update(mysqlSchema.users)
              .set({ expert_presentations_used: expertUsed + 1 })
              .where(eq(mysqlSchema.users.id, userIdNum))
          } catch {
            // колонка может отсутствовать
          }
        }
        const presentationTitle = title?.trim() || 'Без названия'
        const now = new Date()
        return reply.status(201).send({
          id: String(createdId),
          title: presentationTitle,
          coverImage: coverImage ?? undefined,
          content: contentVal,
          updatedAt: toIsoDate(now),
        })
      }
      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const userRow = await pgDb.query.users.findFirst({
        where: eq(pgSchema.users.id, userId),
        columns: { tariff: true, testDriveUsed: true, expertPlanQuantity: true, expertPresentationsUsed: true },
      })
      const pgTestDriveUsed = userRow?.testDriveUsed === 'true'
      if (userRow?.tariff === 'test_drive' && pgTestDriveUsed) {
        return reply.status(403).send({ error: 'Вы уже использовали тест драйв (одну презентацию). Перейдите на тариф «Эксперт» для создания новых презентаций.' })
      }
      const pgExpertPlan = userRow?.expertPlanQuantity != null && userRow.expertPlanQuantity !== '' ? Math.max(1, Math.min(100, Number(userRow.expertPlanQuantity) || 1)) : 1
      const pgExpertUsed = userRow?.expertPresentationsUsed != null && userRow.expertPresentationsUsed !== '' ? Math.max(0, Number(userRow.expertPresentationsUsed) || 0) : 0
      if (userRow?.tariff === 'expert' && pgExpertUsed >= pgExpertPlan) {
        try {
          await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
            .insert(pgSchema.notifications)
            .values({
              userId: userId!,
              title: 'Лимит презентаций исчерпан',
              message: 'Для увеличения лимита выберите в разделе «Тарифы» дополнительное количество презентаций.',
              type: 'presentation',
            })
        } catch (notifErr) {
          req.log.warn(notifErr, 'Ошибка создания уведомления о лимите')
        }
        return reply.status(403).send({ error: `Достигнут лимит презентаций по тарифу (${pgExpertPlan}). Удалённые презентации тоже учитываются. Увеличьте пакет в разделе «Тарифы» или дождитесь обновления лимита.` })
      }
      if (userRow?.tariff === 'test_drive') {
        const existingList = await pgDb.query.presentations.findMany({
          where: eq(pgSchema.presentations.userId, userId),
          columns: { id: true },
        })
        if (existingList.length >= 1) {
          return reply.status(403).send({ error: 'На тарифе «Тест драйв» доступна только одна презентация. Перейдите на тариф «Эксперт» для создания новых.' })
        }
        const slidesCount = Array.isArray(contentVal?.slides) ? contentVal.slides.length : 0
        if (slidesCount > 4) {
          return reply.status(400).send({ error: 'На тарифе «Тест драйв» допускается не более 4 слайдов. Создайте презентацию с 4 слайдами или перейдите на тариф «Эксперт».' })
        }
      }
      const [created] = await pgDb
        .insert(pgSchema.presentations)
        .values({
          userId,
          title: title?.trim() || 'Без названия',
          coverImage: coverImage || null,
          content: contentVal,
        })
        .returning()
      if (userRow?.tariff === 'test_drive') {
        await pgDb.update(pgSchema.users).set({ testDriveUsed: 'true' }).where(eq(pgSchema.users.id, userId))
      }
      if (userRow?.tariff === 'expert' && pgExpertUsed != null) {
        try {
          await pgDb.update(pgSchema.users)
            .set({ expertPresentationsUsed: String(pgExpertUsed + 1) })
            .where(eq(pgSchema.users.id, userId))
        } catch {
          // колонка может отсутствовать
        }
      }
      return reply.status(201).send({
        id: created.id,
        title: created.title,
        coverImage: created.coverImage ?? undefined,
        content: normContent(created.content),
        updatedAt: toIsoDate(created.updatedAt as Date | string),
      })
    }
  )

  app.put<{
    Params: { id: string }
    Body: { title?: string; coverImage?: string; content?: { slides: unknown[] }; status?: string; createNotification?: boolean }
  }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { title?: string; coverImage?: string; content?: { slides: unknown[] }; status?: string; createNotification?: boolean } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      const { title, coverImage, content, status: bodyStatus, createNotification } = req.body ?? {}
      if (useFileStore) {
        const updates: { title?: string; coverImage?: string | null; content?: string; updatedAt?: string } = { updatedAt: new Date().toISOString() }
        if (title !== undefined) updates.title = title.trim() || 'Без названия'
        if (coverImage !== undefined) updates.coverImage = coverImage || null
        if (content !== undefined) updates.content = JSON.stringify(content)
        const updated = fileStore.updatePresentation(id, userId!, updates)
        if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
        return reply.send({
          id: updated.id,
          title: updated.title,
          coverImage: updated.coverImage ?? undefined,
          content: normContent(updated.content),
          updatedAt: toIsoDate(updated.updatedAt),
        })
      }
      if (useMysql) {
        const mysqlId = parseMysqlId(id)
        if (mysqlId === null) return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        if (content?.slides != null && Array.isArray(content.slides) && content.slides.length > 4) {
          try {
            const userRow = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
              where: eq(mysqlSchema.users.id, userIdNum),
              columns: { tariff: true },
            })
            if (userRow?.tariff === 'test_drive') {
              return reply.status(400).send({ error: 'На тарифе «Тест драйв» допускается не более 4 слайдов суммарно.' })
            }
          } catch {
            // колонка tariff может отсутствовать
          }
        }
        const updates: { updated_at: Date; title?: string; cover_image?: string | null; slides_data?: string; status?: string } = { updated_at: new Date() }
        if (title !== undefined) updates.title = title.trim() || 'Без названия'
        if (coverImage !== undefined) updates.cover_image = coverImage || null
        if (content !== undefined) updates.slides_data = JSON.stringify(content)
        if ((req.body as { status?: string }).status !== undefined) updates.status = (req.body as { status: string }).status
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.presentations)
          .set(updates)
          .where(and(eq(mysqlSchema.presentations.id, mysqlId), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const [updated] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
          where: and(eq(mysqlSchema.presentations.id, mysqlId), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
        const u = updated as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date; status?: string; public_hash?: string | null; is_public?: number; public_url?: string | null }
        if (createNotification === true) {
          try {
            await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
              .insert(mysqlSchema.notifications)
              .values({
                user_id: userIdNum,
                title: 'Опубликование',
                message: `Презентация «${u.title}» опубликована.`,
                type: 'presentation',
                source_id: String(u.id),
              })
          } catch (notifErr) {
            console.error('[presentations] Ошибка создания уведомления об публикации:', notifErr)
          }
        }
        return reply.send({
          id: String(u.id),
          title: u.title,
          coverImage: u.cover_image ?? undefined,
          content: normContent(u.slides_data),
          updatedAt: toIsoDate(u.updated_at),
          status: u.status ?? 'draft',
          publicHash: u.public_hash ?? undefined,
          isPublic: Boolean(u.is_public),
          publicUrl: u.public_url ?? undefined,
          shortId: (u as { short_id?: string | null }).short_id ?? undefined,
        })
      }
      const pgDbForUpdate = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const userForUpdate = await pgDbForUpdate.query.users.findFirst({
        where: eq(pgSchema.users.id, userId!),
        columns: { tariff: true },
      })
      if (userForUpdate?.tariff === 'test_drive' && content?.slides != null && Array.isArray(content.slides) && content.slides.length > 4) {
        return reply.status(400).send({ error: 'На тарифе «Тест драйв» допускается не более 4 слайдов суммарно.' })
      }
      const updates: {
        updatedAt: Date
        title?: string
        coverImage?: string | null
        content?: { slides: unknown[] }
        status?: string
      } = {
        updatedAt: new Date(),
      }
      if (title !== undefined) updates.title = title.trim() || 'Без названия'
      if (coverImage !== undefined) updates.coverImage = coverImage || null
      if (content !== undefined) updates.content = content
      if (bodyStatus !== undefined) updates.status = bodyStatus
      const [updated] = await pgDbForUpdate
        .update(pgSchema.presentations)
        .set(updates)
        .where(and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)))
        .returning()
      if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
      if (createNotification === true) {
        try {
          await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
            .insert(pgSchema.notifications)
            .values({
              userId: userId!,
              title: 'Опубликование',
              message: `Презентация «${updated.title}» опубликована.`,
              type: 'presentation',
              sourceId: updated.id,
            })
        } catch (notifErr) {
          console.error('[presentations] Ошибка создания уведомления об публикации:', notifErr)
        }
      }
      return reply.send({
        id: updated.id,
        title: updated.title,
        coverImage: updated.coverImage ?? undefined,
        content: normContent(updated.content),
        updatedAt: toIsoDate(updated.updatedAt as Date | string),
        status: (updated as { status?: string }).status ?? 'draft',
      })
    }
  )

  /** Включить/выключить публичную ссылку (только владелец) */
  app.put<{ Params: { id: string }; Body: { isPublic: boolean } }>(
    '/api/presentations/:id/share',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { isPublic: boolean } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      const isPublic = Boolean(req.body?.isPublic)
      if (!useMysql) return reply.status(501).send({ error: 'Поделиться доступно только при работе с БД' })
      const idNum = parseMysqlId(id)
      if (idNum === null) return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
      if (isPublic) {
        try {
          const userRow = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
            where: eq(mysqlSchema.users.id, userIdNum),
            columns: { tariff: true },
          })
          if (userRow?.tariff === 'test_drive') {
            return reply.status(403).send({ error: 'Публичная ссылка недоступна на тарифе «Тест драйв». Перейдите на тариф «Эксперт» в разделе «Тарифы».' })
          }
        } catch {
          // колонка tariff может отсутствовать
        }
      }
      const baseUrl = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.hostname}`).replace(/\/$/, '')
      const updates: { updated_at: Date; is_public: number; public_hash?: string | null; public_url?: string | null } = {
        updated_at: new Date(),
        is_public: isPublic ? 1 : 0,
      }
      if (!isPublic) {
        updates.public_hash = null
        updates.public_url = null
      } else {
        const hash = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        updates.public_hash = hash
        updates.public_url = `${baseUrl}/view/${hash}`
      }
      await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
        .update(mysqlSchema.presentations)
        .set(updates)
        .where(and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)))
      const [updated] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
        where: and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)),
      })
      if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
      const u = updated as { public_hash?: string | null; is_public?: number; public_url?: string | null }
      return reply.send({
        isPublic: Boolean(u.is_public),
        publicHash: u.public_hash ?? undefined,
        publicUrl: u.public_url ?? undefined,
      })
    }
  )

  /** Публичный просмотр по хешу (без авторизации) */
  app.get<{ Params: { hash: string } }>(
    '/api/presentations/public/:hash',
    async (req: FastifyRequest<{ Params: { hash: string } }>, reply: FastifyReply) => {
      const { hash } = req.params
      if (!useMysql) return reply.status(404).send({ error: 'Презентация не найдена' })
      const row = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findFirst({
        where: and(eq(mysqlSchema.presentations.public_hash, hash), eq(mysqlSchema.presentations.is_public, 1)),
      })
      if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
      const r = row as { id: number; title: string; cover_image: string | null; slides_data: string | null }
      
      // Записываем просмотр
      try {
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null
        const userAgent = req.headers['user-agent'] || null
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .insert(mysqlSchema.presentationViews)
          .values({
            presentation_id: r.id,
            ip_address: ipAddress ? String(ipAddress).split(',')[0].trim() : null,
            user_agent: userAgent ? String(userAgent).substring(0, 512) : null,
          })
      } catch (err) {
        // Игнорируем ошибки записи просмотров, чтобы не блокировать просмотр презентации
        req.log.warn(err, 'Ошибка при записи просмотра')
      }
      
      return reply.send({
        id: String(r.id),
        title: r.title,
        coverImage: r.cover_image ?? undefined,
        content: normContent(r.slides_data),
      })
    }
  )

  /** Удаление по id из тела запроса (как при создании — тот же канал, без проблем с URL/параметрами). */
  app.post<{ Body: { id?: string } }>(
    '/api/presentations/delete',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { id?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      let id = req.body?.id != null ? String(req.body.id).trim() : ''
      if (!id) {
        return reply.status(400).send({ error: 'Не указан id презентации' })
      }
      const idNum = useMysql ? parseMysqlId(id) : null
      if (useMysql && idNum === null) {
        return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
      }
      if (useFileStore) {
        const ok = fileStore.deletePresentation(id, userId!)
        if (!ok) return reply.status(404).send({ error: 'Презентация не найдена' })
        await deletePresentationImagesFolder(id)
        return reply.status(204).send()
      }
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const result = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.presentations)
          .where(and(eq(mysqlSchema.presentations.id, idNum!), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const raw = result as unknown as { affectedRows?: number } | [{ affectedRows?: number }]
        const affected = Array.isArray(raw) ? (raw[0]?.affectedRows ?? 0) : (raw?.affectedRows ?? 0)
        if (affected === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
        try {
          const userRow = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
            where: eq(mysqlSchema.users.id, userIdNum),
            columns: { tariff: true, expert_presentations_used: true },
          })
          const u = userRow as { tariff?: string | null; expert_presentations_used?: number | null } | undefined
          if (u?.tariff === 'expert' && (u?.expert_presentations_used ?? 0) > 0) {
            await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
              .update(mysqlSchema.users)
              .set({ expert_presentations_used: Math.max(0, (u.expert_presentations_used ?? 0) - 1) })
              .where(eq(mysqlSchema.users.id, userIdNum))
          }
        } catch {
          // колонка может отсутствовать
        }
        await deletePresentationImagesFolder(id)
        return reply.status(204).send()
      }
      const deleted = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.presentations)
        .where(and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)))
        .returning({ id: pgSchema.presentations.id })
      if (deleted.length === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
      try {
        const userRow = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
          where: eq(pgSchema.users.id, userId!),
          columns: { tariff: true, expertPresentationsUsed: true },
        })
        const used = userRow?.expertPresentationsUsed != null && userRow.expertPresentationsUsed !== '' ? Math.max(0, Number(userRow.expertPresentationsUsed) || 0) : 0
        if (userRow?.tariff === 'expert' && used > 0) {
          await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
            .update(pgSchema.users)
            .set({ expertPresentationsUsed: String(used - 1) })
            .where(eq(pgSchema.users.id, userId!))
        }
      } catch {
        // колонка может отсутствовать
      }
      await deletePresentationImagesFolder(id)
      return reply.status(204).send()
    }
  )

  app.delete<{ Params: { id?: string } }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      let id = getIdFromDeleteRequest(req)
      try {
        if (id.includes('%')) id = decodeURIComponent(id)
      } catch {
        // оставляем id как есть при ошибке декодирования
      }
      if (!id) {
        return reply.status(400).send({ error: 'Не указан id презентации' })
      }
      const idNum = useMysql ? parseMysqlId(id) : null
      if (useMysql && idNum === null) {
        return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
      }
      if (useFileStore) {
        const ok = fileStore.deletePresentation(id, userId!)
        if (!ok) return reply.status(404).send({ error: 'Презентация не найдена' })
        await deletePresentationImagesFolder(id)
        return reply.status(204).send()
      }
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const result = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.presentations)
          .where(and(eq(mysqlSchema.presentations.id, idNum!), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const raw = result as unknown as { affectedRows?: number } | [{ affectedRows?: number }]
        const affected = Array.isArray(raw) ? (raw[0]?.affectedRows ?? 0) : (raw?.affectedRows ?? 0)
        if (affected === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
        try {
          const userRow = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
            where: eq(mysqlSchema.users.id, userIdNum),
            columns: { tariff: true, expert_presentations_used: true },
          })
          const u = userRow as { tariff?: string | null; expert_presentations_used?: number | null } | undefined
          if (u?.tariff === 'expert' && (u?.expert_presentations_used ?? 0) > 0) {
            await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
              .update(mysqlSchema.users)
              .set({ expert_presentations_used: Math.max(0, (u.expert_presentations_used ?? 0) - 1) })
              .where(eq(mysqlSchema.users.id, userIdNum))
          }
        } catch {
          // колонка может отсутствовать
        }
        await deletePresentationImagesFolder(id)
        return reply.status(204).send()
      }
      const deleted = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.presentations)
        .where(and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)))
        .returning({ id: pgSchema.presentations.id })
      if (deleted.length === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
      try {
        const userRow = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
          where: eq(pgSchema.users.id, userId!),
          columns: { tariff: true, expertPresentationsUsed: true },
        })
        const used = userRow?.expertPresentationsUsed != null && userRow.expertPresentationsUsed !== '' ? Math.max(0, Number(userRow.expertPresentationsUsed) || 0) : 0
        if (userRow?.tariff === 'expert' && used > 0) {
          await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
            .update(pgSchema.users)
            .set({ expertPresentationsUsed: String(used - 1) })
            .where(eq(pgSchema.users.id, userId!))
        }
      } catch {
        // колонка может отсутствовать
      }
      await deletePresentationImagesFolder(id)
      return reply.status(204).send()
    }
  )

  /** Экспорт презентации в PDF */
  app.get<{ Params: { id: string } }>(
    '/api/presentations/:id/export-pdf',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      if (id == null || String(id).trim() === '') {
        return reply.status(400).send({ error: 'Не указан id презентации' })
      }
      const idNum = useMysql ? parseMysqlId(id) : null
      if (useMysql && idNum === null) {
        return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
      }

      let presentationData: { id: string; title: string; coverImage?: string; content: { slides: ViewSlideItem[]; settings?: { fontFamily?: string } } } | null = null

      if (useFileStore) {
        const row = fileStore.getPresentationById(id, userId!)
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        const rawContent = row.content as unknown
        const normalized = normContent(rawContent)
        presentationData = {
          id: row.id,
          title: row.title,
          coverImage: row.coverImage ?? undefined,
          content: { slides: normalized.slides as ViewSlideItem[], settings: getContentSettings(rawContent) },
        }
      } else if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const row = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findFirst({
          where: and(eq(mysqlSchema.presentations.id, idNum!), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        const r = row as { id: number; title: string; cover_image: string | null; slides_data: string | null }
        const rawContent = typeof r.slides_data === 'string' ? (() => { try { return JSON.parse(r.slides_data) } catch { return null } })() : r.slides_data
        const normalized = normContent(r.slides_data)
        presentationData = {
          id: String(r.id),
          title: r.title,
          coverImage: r.cover_image ?? undefined,
          content: { slides: normalized.slides as ViewSlideItem[], settings: getContentSettings(rawContent) },
        }
      } else {
        const row = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.presentations.findFirst({
          where: and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)),
        })
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        const rawContent = row.content as unknown
        const normalized = normContent(rawContent)
        presentationData = {
          id: row.id,
          title: row.title,
          coverImage: row.coverImage ?? undefined,
          content: { slides: normalized.slides as ViewSlideItem[], settings: getContentSettings(rawContent) },
        }
      }

      if (!presentationData) {
        return reply.status(404).send({ error: 'Презентация не найдена' })
      }

      try {
        const baseUrl = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.hostname}`).replace(/\/$/, '')
        const pdfBuffer = await generatePDF(presentationData, baseUrl)
        
        reply.type('application/pdf')
        reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(presentationData.title || 'presentation')}.pdf"`)
        return reply.send(pdfBuffer)
      } catch (error) {
        req.log.error(error, 'Ошибка при генерации PDF')
        return reply.status(500).send({ error: 'Ошибка при генерации PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') })
      }
    }
  )

  /** Статистика просмотров презентации */
  app.get<{ Params: { id: string }; Querystring: { startDate?: string; endDate?: string } }>(
    '/api/presentations/:id/views',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      const { startDate, endDate } = req.query
      if (!useMysql) return reply.status(501).send({ error: 'Статистика доступна только при работе с БД' })
      const idNum = parseMysqlId(id)
      if (idNum === null) return reply.status(400).send({ error: 'Неверный формат id презентации' })
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
      
      // Проверяем, что презентация принадлежит пользователю
      const presentation = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findFirst({
        where: and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)),
      })
      if (!presentation) return reply.status(404).send({ error: 'Презентация не найдена' })
      
      // Получаем просмотры
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const conditions = [eq(mysqlSchema.presentationViews.presentation_id, idNum)]
      
      if (startDate) {
        conditions.push(gte(mysqlSchema.presentationViews.viewed_at, new Date(startDate)))
      }
      if (endDate) {
        const endDateObj = new Date(endDate)
        endDateObj.setHours(23, 59, 59, 999)
        conditions.push(lte(mysqlSchema.presentationViews.viewed_at, endDateObj))
      }
      
      const views = await mysqlDb.query.presentationViews.findMany({
        where: and(...conditions),
        orderBy: [desc(mysqlSchema.presentationViews.viewed_at)],
      })
      
      // Группируем по датам для графика
      const viewsByDate: Record<string, number> = {}
      views.forEach((view) => {
        const date = new Date(view.viewed_at).toISOString().split('T')[0]
        viewsByDate[date] = (viewsByDate[date] || 0) + 1
      })
      
      return reply.send({
        totalViews: views.length,
        viewsByDate,
        views: views.map((v) => ({
          id: v.id,
          viewedAt: toIsoDate(v.viewed_at),
          ipAddress: v.ip_address ?? undefined,
        })),
      })
    }
  )
}
