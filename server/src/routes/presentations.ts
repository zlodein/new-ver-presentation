import crypto from 'node:crypto'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

function toIsoDate(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString()
}
function normContent(c: unknown): { slides: unknown[] } {
  if (typeof c === 'string') {
    try {
      const parsed = JSON.parse(c) as { slides?: unknown[] } | unknown[]
      const slides = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { slides?: unknown[] })?.slides)
          ? (parsed as { slides: unknown[] }).slides
          : []
      return { slides }
    } catch {
      return { slides: [] }
    }
  }
  const obj = c as { slides?: unknown[] } | undefined
  if (Array.isArray(obj)) return { slides: obj }
  return { slides: Array.isArray(obj?.slides) ? obj.slides : [] }
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
        columns: { id: true, title: true, cover_image: true, updated_at: true, status: true },
        orderBy: [desc(mysqlSchema.presentations.updated_at)],
      })
      return reply.send(
        list.map((p: { id: number; title: string; cover_image: string | null; updated_at: Date; status?: string | null }) => ({
          id: String(p.id),
          title: p.title,
          coverImage: p.cover_image ?? undefined,
          updatedAt: toIsoDate(p.updated_at),
          status: p.status ?? 'draft',
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
      if (useMysql) {
        const idNum = Number(id)
        if (Number.isNaN(idNum) || idNum < 1 || !Number.isInteger(idNum)) {
          return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
        }
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
        const idNum = Number(id)
        const userIdNum = Number(userId)
        if (Number.isNaN(idNum) || Number.isNaN(userIdNum)) return reply.status(404).send({ error: 'Презентация не найдена' })
        const row = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findFirst({
          where: and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!row) return reply.status(404).send({ error: 'Презентация не найдена' })
        const r = row as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date; status?: string; public_hash?: string | null; is_public?: number; public_url?: string | null }
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
        const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .insert(mysqlSchema.presentations)
          .values({
            user_id: userIdNum,
            title: title?.trim() || 'Без названия',
            cover_image: coverImage || null,
            slides_data: JSON.stringify(contentVal),
          })
          .$returningId()
        const createdId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
        if (createdId == null) return reply.status(500).send({ error: 'Ошибка при создании презентации' })
        const now = new Date()
        return reply.status(201).send({
          id: String(createdId),
          title: title?.trim() || 'Без названия',
          coverImage: coverImage ?? undefined,
          content: contentVal,
          updatedAt: toIsoDate(now),
        })
      }
      const [created] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .insert(pgSchema.presentations)
        .values({
          userId,
          title: title?.trim() || 'Без названия',
          coverImage: coverImage || null,
          content: contentVal,
        })
        .returning()
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
    Body: { title?: string; coverImage?: string; content?: { slides: unknown[] } }
  }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { title?: string; coverImage?: string; content?: { slides: unknown[] } } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      const { title, coverImage, content } = req.body ?? {}
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
        const idNum = Number(id)
        const userIdNum = Number(userId)
        if (Number.isNaN(idNum) || Number.isNaN(userIdNum)) return reply.status(404).send({ error: 'Презентация не найдена' })
        const updates: { updated_at: Date; title?: string; cover_image?: string | null; slides_data?: string; status?: string } = { updated_at: new Date() }
        if (title !== undefined) updates.title = title.trim() || 'Без названия'
        if (coverImage !== undefined) updates.cover_image = coverImage || null
        if (content !== undefined) updates.slides_data = JSON.stringify(content)
        if ((req.body as { status?: string }).status !== undefined) updates.status = (req.body as { status: string }).status
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.presentations)
          .set(updates)
          .where(and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const [updated] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
          where: and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
        const u = updated as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date; status?: string; public_hash?: string | null; is_public?: number; public_url?: string | null }
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
        })
      }
      const updates: {
        updatedAt: Date
        title?: string
        coverImage?: string | null
        content?: { slides: unknown[] }
      } = {
        updatedAt: new Date(),
      }
      if (title !== undefined) updates.title = title.trim() || 'Без названия'
      if (coverImage !== undefined) updates.coverImage = coverImage || null
      if (content !== undefined) updates.content = content
      const [updated] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .update(pgSchema.presentations)
        .set(updates)
        .where(and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)))
        .returning()
      if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
      return reply.send({
        id: updated.id,
        title: updated.title,
        coverImage: updated.coverImage ?? undefined,
        content: normContent(updated.content),
        updatedAt: toIsoDate(updated.updatedAt as Date | string),
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
      const idNum = Number(id)
      const userIdNum = Number(userId)
      if (Number.isNaN(idNum) || Number.isNaN(userIdNum)) return reply.status(404).send({ error: 'Презентация не найдена' })
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
      return reply.send({
        id: String(r.id),
        title: r.title,
        coverImage: r.cover_image ?? undefined,
        content: normContent(r.slides_data),
      })
    }
  )

  app.delete<{ Params: { id: string } }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      if (id == null || String(id).trim() === '') {
        return reply.status(400).send({ error: 'Не указан id презентации' })
      }
      if (useMysql) {
        const idNum = Number(id)
        if (Number.isNaN(idNum) || idNum < 1 || !Number.isInteger(idNum)) {
          return reply.status(400).send({ error: 'Неверный формат id презентации (ожидается целое число)' })
        }
      }
      if (useFileStore) {
        const ok = fileStore.deletePresentation(id, userId!)
        if (!ok) return reply.status(404).send({ error: 'Презентация не найдена' })
        return reply.status(204).send()
      }
      if (useMysql) {
        const idNum = Number(id)
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const result = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.presentations)
          .where(and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const raw = result as unknown as { affectedRows?: number } | [{ affectedRows?: number }]
        const affected = Array.isArray(raw) ? (raw[0]?.affectedRows ?? 0) : (raw?.affectedRows ?? 0)
        if (affected === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
        return reply.status(204).send()
      }
      const deleted = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.presentations)
        .where(and(eq(pgSchema.presentations.id, id), eq(pgSchema.presentations.userId, userId!)))
        .returning({ id: pgSchema.presentations.id })
      if (deleted.length === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
      return reply.status(204).send()
    }
  )
}
