import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'

function toIsoDate(d: Date | string | null): string | undefined {
  if (d == null) return undefined
  return typeof d === 'string' ? d : d.toISOString()
}

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

export async function taskRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest) => (req.user as { sub: string })?.sub

  /** GET /api/tasks — список задач пользователя (опционально фильтр по status) */
  app.get('/api/tasks', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    if (useFileStore) return reply.send([])

    try {
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const statusFilter = (req.query as { status?: string })?.status
        const conditions = [eq(mysqlSchema.tasks.user_id, userIdNum)]
        if (statusFilter && ['todo', 'in_progress', 'completed'].includes(statusFilter)) {
          conditions.push(eq(mysqlSchema.tasks.status, statusFilter))
        }
        const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.tasks.findMany({
          where: and(...conditions),
          orderBy: [desc(mysqlSchema.tasks.updated_at)],
        })
        return reply.send(
          list.map((t: { id: number; user_id: number; title: string; description: string | null; status: string; tag: string | null; due_date: Date | null; created_at: Date; updated_at: Date }) => ({
            id: String(t.id),
            userId: String(t.user_id),
            title: t.title,
            description: t.description ?? undefined,
            status: t.status,
            tag: t.tag ?? undefined,
            dueDate: toIsoDate(t.due_date),
            createdAt: toIsoDate(t.created_at),
            updatedAt: toIsoDate(t.updated_at),
          }))
        )
      }

      const statusFilter = (req.query as { status?: string })?.status
      const conditions = [eq(pgSchema.tasks.userId, userId)]
      if (statusFilter && ['todo', 'in_progress', 'completed'].includes(statusFilter)) {
        conditions.push(eq(pgSchema.tasks.status, statusFilter))
      }
      const list = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.tasks.findMany({
        where: and(...conditions),
        orderBy: [desc(pgSchema.tasks.updatedAt)],
      })
      return reply.send(
        list.map((t) => ({
          id: t.id,
          userId: t.userId,
          title: t.title,
          description: t.description ?? undefined,
          status: t.status,
          tag: t.tag ?? undefined,
          dueDate: toIsoDate(t.dueDate),
          createdAt: toIsoDate(t.createdAt),
          updatedAt: toIsoDate(t.updatedAt),
        }))
      )
    } catch (err) {
      console.error('[tasks] Ошибка получения задач:', err)
      return reply.status(500).send({ error: 'Ошибка получения задач' })
    }
  })

  /** POST /api/tasks — создать задачу */
  app.post<{
    Body: { title?: string; description?: string; status?: string; tag?: string; dueDate?: string }
  }>(
    '/api/tasks',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { title?: string; description?: string; status?: string; tag?: string; dueDate?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

      if (useFileStore) return reply.status(501).send({ error: 'Задачи доступны только при работе с БД' })

      const { title, description, status, tag, dueDate } = req.body ?? {}
      const safeStatus = status && ['todo', 'in_progress', 'completed'].includes(status) ? status : 'todo'
      const dueDateVal = dueDate ? new Date(dueDate) : null

      try {
        if (useMysql) {
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
          const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .insert(mysqlSchema.tasks)
            .values({
              user_id: userIdNum,
              title: (title ?? '').trim() || 'Без названия',
              description: (description ?? '').trim() || null,
              status: safeStatus,
              tag: (tag ?? '').trim() || null,
              due_date: dueDateVal,
            })
            .$returningId()
          const createdId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
          if (createdId == null) return reply.status(500).send({ error: 'Ошибка создания задачи' })
          const [created] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.tasks.findMany({
            where: eq(mysqlSchema.tasks.id, createdId),
          })
          if (!created) return reply.status(500).send({ error: 'Задача не найдена после создания' })
          const t = created as { id: number; user_id: number; title: string; description: string | null; status: string; tag: string | null; due_date: Date | null; created_at: Date; updated_at: Date }
          return reply.status(201).send({
            id: String(t.id),
            userId: String(t.user_id),
            title: t.title,
            description: t.description ?? undefined,
            status: t.status,
            tag: t.tag ?? undefined,
            dueDate: toIsoDate(t.due_date),
            createdAt: toIsoDate(t.created_at),
            updatedAt: toIsoDate(t.updated_at),
          })
        }

        const [created] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .insert(pgSchema.tasks)
          .values({
            userId,
            title: (title ?? '').trim() || 'Без названия',
            description: (description ?? '').trim() || undefined,
            status: safeStatus,
            tag: (tag ?? '').trim() || undefined,
            dueDate: dueDateVal,
          })
          .returning()
        if (!created) return reply.status(500).send({ error: 'Ошибка создания задачи' })
        return reply.status(201).send({
          id: created.id,
          userId: created.userId,
          title: created.title,
          description: created.description ?? undefined,
          status: created.status,
          tag: created.tag ?? undefined,
          dueDate: toIsoDate(created.dueDate),
          createdAt: toIsoDate(created.createdAt),
          updatedAt: toIsoDate(created.updatedAt),
        })
      } catch (err) {
        console.error('[tasks] Ошибка создания задачи:', err)
        return reply.status(500).send({ error: 'Ошибка создания задачи' })
      }
    }
  )

  /** PUT /api/tasks/:id — обновить задачу (в т.ч. статус при перетаскивании) */
  app.put<{
    Params: { id: string }
    Body: { title?: string; description?: string; status?: string; tag?: string; dueDate?: string }
  }>(
    '/api/tasks/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { title?: string; description?: string; status?: string; tag?: string; dueDate?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

      if (useFileStore) return reply.status(501).send({ error: 'Задачи доступны только при работе с БД' })

      const { id } = req.params
      const { title, description, status, tag, dueDate } = req.body ?? {}

      try {
        if (useMysql) {
          const taskId = parseMysqlId(id)
          if (taskId === null) return reply.status(400).send({ error: 'Неверный ID задачи' })
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })

          const updates: Record<string, unknown> = {}
          if (title !== undefined) updates.title = (title ?? '').trim() || 'Без названия'
          if (description !== undefined) updates.description = (description ?? '').trim() || null
          if (status !== undefined && ['todo', 'in_progress', 'completed'].includes(status)) updates.status = status
          if (tag !== undefined) updates.tag = (tag ?? '').trim() || null
          if (dueDate !== undefined) updates.due_date = dueDate ? new Date(dueDate) : null

          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .update(mysqlSchema.tasks)
            .set(updates as { title?: string; description?: string | null; status?: string; tag?: string | null; due_date?: Date | null })
            .where(and(eq(mysqlSchema.tasks.id, taskId), eq(mysqlSchema.tasks.user_id, userIdNum)))

          const [updated] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.tasks.findMany({
            where: and(eq(mysqlSchema.tasks.id, taskId), eq(mysqlSchema.tasks.user_id, userIdNum)),
          })
          if (!updated) return reply.status(404).send({ error: 'Задача не найдена' })
          const t = updated as { id: number; user_id: number; title: string; description: string | null; status: string; tag: string | null; due_date: Date | null; created_at: Date; updated_at: Date }
          return reply.send({
            id: String(t.id),
            userId: String(t.user_id),
            title: t.title,
            description: t.description ?? undefined,
            status: t.status,
            tag: t.tag ?? undefined,
            dueDate: toIsoDate(t.due_date),
            createdAt: toIsoDate(t.created_at),
            updatedAt: toIsoDate(t.updated_at),
          })
        }

        const [updated] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .update(pgSchema.tasks)
          .set({
            ...(title !== undefined && { title: (title ?? '').trim() || 'Без названия' }),
            ...(description !== undefined && { description: (description ?? '').trim() || undefined }),
            ...(status !== undefined && ['todo', 'in_progress', 'completed'].includes(status) && { status }),
            ...(tag !== undefined && { tag: (tag ?? '').trim() || undefined }),
            ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : undefined }),
          })
          .where(and(eq(pgSchema.tasks.id, id), eq(pgSchema.tasks.userId, userId)))
          .returning()
        if (!updated) return reply.status(404).send({ error: 'Задача не найдена' })
        return reply.send({
          id: updated.id,
          userId: updated.userId,
          title: updated.title,
          description: updated.description ?? undefined,
          status: updated.status,
          tag: updated.tag ?? undefined,
          dueDate: toIsoDate(updated.dueDate),
          createdAt: toIsoDate(updated.createdAt),
          updatedAt: toIsoDate(updated.updatedAt),
        })
      } catch (err) {
        console.error('[tasks] Ошибка обновления задачи:', err)
        return reply.status(500).send({ error: 'Ошибка обновления задачи' })
      }
    }
  )

  /** DELETE /api/tasks/:id — удалить задачу */
  app.delete<{ Params: { id: string } }>(
    '/api/tasks/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

      if (useFileStore) return reply.status(501).send({ error: 'Задачи доступны только при работе с БД' })

      const { id } = req.params

      try {
        if (useMysql) {
          const taskId = parseMysqlId(id)
          if (taskId === null) return reply.status(400).send({ error: 'Неверный ID задачи' })
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })

          const existing = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.tasks.findFirst({
            where: and(eq(mysqlSchema.tasks.id, taskId), eq(mysqlSchema.tasks.user_id, userIdNum)),
          })
          if (!existing) return reply.status(404).send({ error: 'Задача не найдена' })

          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .delete(mysqlSchema.tasks)
            .where(and(eq(mysqlSchema.tasks.id, taskId), eq(mysqlSchema.tasks.user_id, userIdNum)))
          return reply.status(204).send()
        }

        const [deleted] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .delete(pgSchema.tasks)
          .where(and(eq(pgSchema.tasks.id, id), eq(pgSchema.tasks.userId, userId)))
          .returning({ id: pgSchema.tasks.id })
        if (!deleted) return reply.status(404).send({ error: 'Задача не найдена' })
        return reply.status(204).send()
      } catch (err) {
        console.error('[tasks] Ошибка удаления задачи:', err)
        return reply.status(500).send({ error: 'Ошибка удаления задачи' })
      }
    }
  )
}
