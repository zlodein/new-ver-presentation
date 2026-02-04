import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore } from '../db/index.js'
import { fileStore } from '../db/file-store.js'

function toIsoDate(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString()
}
function normContent(c: unknown): { slides: unknown[] } {
  if (typeof c === 'string') {
    try {
      return JSON.parse(c) as { slides: unknown[] }
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
    const list = await db!.query.presentations.findMany({
      where: eq(schema!.presentations.userId, userId),
      columns: { id: true, title: true, coverImage: true, updatedAt: true },
      orderBy: [desc(schema!.presentations.updatedAt)],
    })
    return reply.send(
      list.map((p) => ({
        id: p.id,
        title: p.title,
        coverImage: p.coverImage ?? undefined,
        updatedAt: toIsoDate(p.updatedAt as Date | string),
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
      const row = await db!.query.presentations.findFirst({
        where: and(eq(schema!.presentations.id, id), eq(schema!.presentations.userId, userId!)),
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
      const [created] = await db!
        .insert(schema!.presentations)
        .values({
          userId,
          title: title?.trim() || 'Без названия',
          coverImage: coverImage || null,
          content: isSqlite ? JSON.stringify(contentVal) : contentVal,
        } as Record<string, unknown>)
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
      const updates: Record<string, unknown> = {
        updatedAt: isSqlite ? new Date().toISOString() : new Date(),
      }
      if (title !== undefined) updates.title = title.trim() || 'Без названия'
      if (coverImage !== undefined) updates.coverImage = coverImage || null
      if (content !== undefined) updates.content = isSqlite ? JSON.stringify(content) : content
      const [updated] = await db!
        .update(schema!.presentations)
        .set(updates as { updatedAt: Date | string; title?: string; coverImage?: string | null; content?: string | { slides: unknown[] } })
        .where(and(eq(schema!.presentations.id, id), eq(schema!.presentations.userId, userId!)))
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
      const deleted = await db!
        .delete(schema!.presentations)
        .where(and(eq(schema!.presentations.id, id), eq(schema!.presentations.userId, userId!)))
        .returning({ id: schema!.presentations.id })
      if (deleted.length === 0) return reply.status(404).send({ error: 'Презентация не найдена' })
      return reply.status(204).send()
    }
  )
}
