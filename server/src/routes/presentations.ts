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
      const parsed = JSON.parse(c) as { slides?: unknown[] }
      return { slides: Array.isArray(parsed?.slides) ? parsed.slides : [] }
    } catch {
      return { slides: [] }
    }
  }
  return (c as { slides: unknown[] }) ?? { slides: [] }
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
          updatedAt: toIsoDate(p.updatedAt),
        }))
      )
    }
    if (useMysql) {
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
      const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
        where: eq(mysqlSchema.presentations.user_id, userIdNum),
        columns: { id: true, title: true, cover_image: true, updated_at: true },
        orderBy: [desc(mysqlSchema.presentations.updated_at)],
      })
      return reply.send(
        list.map((p: { id: number; title: string; cover_image: string | null; updated_at: Date }) => ({
          id: String(p.id),
          title: p.title,
          coverImage: p.cover_image ?? undefined,
          updatedAt: toIsoDate(p.updated_at),
        }))
      )
    }
    const list = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.presentations.findMany({
      where: eq(pgSchema.presentations.userId, userId),
      columns: { id: true, title: true, coverImage: true, updatedAt: true },
      orderBy: [desc(pgSchema.presentations.updatedAt)],
    })
    return reply.send(
      list.map((p: { id: string; title: string; coverImage: string | null; updatedAt: Date | string }) => ({
        id: p.id,
        title: p.title,
        coverImage: p.coverImage ?? undefined,
        updatedAt: toIsoDate(p.updatedAt),
      }))
    )
  })

  app.get<{ Params: { id: string } }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
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
        const r = row as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date }
        return reply.send({
          id: String(r.id),
          title: r.title,
          coverImage: r.cover_image ?? undefined,
          content: normContent(r.slides_data),
          updatedAt: toIsoDate(r.updated_at),
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
        const updates: { updated_at: Date; title?: string; cover_image?: string | null; slides_data?: string } = { updated_at: new Date() }
        if (title !== undefined) updates.title = title.trim() || 'Без названия'
        if (coverImage !== undefined) updates.cover_image = coverImage || null
        if (content !== undefined) updates.slides_data = JSON.stringify(content)
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.presentations)
          .set(updates)
          .where(and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const [updated] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.presentations.findMany({
          where: and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)),
        })
        if (!updated) return reply.status(404).send({ error: 'Презентация не найдена' })
        const u = updated as { id: number; title: string; cover_image: string | null; slides_data: string | null; updated_at: Date }
        return reply.send({
          id: String(u.id),
          title: u.title,
          coverImage: u.cover_image ?? undefined,
          content: normContent(u.slides_data),
          updatedAt: toIsoDate(u.updated_at),
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

  app.delete<{ Params: { id: string } }>(
    '/api/presentations/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { id } = req.params
      if (useFileStore) {
        const ok = fileStore.deletePresentation(id, userId!)
        if (!ok) return reply.status(404).send({ error: 'Презентация не найдена' })
        return reply.status(204).send()
      }
      if (useMysql) {
        const idNum = Number(id)
        const userIdNum = Number(userId)
        if (Number.isNaN(idNum) || Number.isNaN(userIdNum)) return reply.status(404).send({ error: 'Презентация не найдена' })
        const deleted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.presentations)
          .where(and(eq(mysqlSchema.presentations.id, idNum), eq(mysqlSchema.presentations.user_id, userIdNum)))
        const affected = (deleted as unknown as { affectedRows?: number })?.affectedRows ?? 0
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
