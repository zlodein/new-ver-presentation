import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import { fileStore } from '../db/file-store.js'
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
  const num = Math.floor(Number(numPart))
  if (Number.isNaN(num) || num < 1) {
    const digits = /^\d+/.exec(numPart) ?? /\d+/.exec(s)
    return digits ? Math.floor(Number(digits[0])) : null
  }
  return num >= 1 ? num : null
}

/** Middleware: только для пользователей с role_id === 2 (admin) */
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const payload = req.user as { sub: string }
  const userId = payload.sub
  if (useFileStore) {
    const user = fileStore.findUserById(userId)
    if (!user) return reply.status(403).send({ error: 'Доступ запрещён' })
    const allUsers = fileStore.load().users
    const isFirst = allUsers[0]?.id === userId
    if (!isFirst) return reply.status(403).send({ error: 'Требуются права администратора' })
  } else if (useMysql) {
    const uid = Number(userId)
    if (Number.isNaN(uid)) return reply.status(403).send({ error: 'Доступ запрещён' })
    const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
    const user = await mysqlDb.query.users.findFirst({
      where: eq(mysqlSchema.users.id, uid),
      columns: { role_id: true },
    })
    if (!user || (user as { role_id?: number }).role_id !== 2) {
      return reply.status(403).send({ error: 'Требуются права администратора' })
    }
  } else {
    return reply.status(403).send({ error: 'Требуются права администратора' })
  }
}

export async function supportRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest) => (req.user as { sub: string })?.sub

  /** GET /api/support — список запросов текущего пользователя */
  app.get('/api/support', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    if (useFileStore) return reply.send([])

    try {
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.supportRequests.findMany({
          where: eq(mysqlSchema.supportRequests.user_id, userIdNum),
          orderBy: [desc(mysqlSchema.supportRequests.created_at)],
        })
        return reply.send(
          list.map((r: { id: number; user_id: number; subject: string; message: string | null; status: string; created_at: Date; updated_at: Date }) => ({
            id: String(r.id),
            userId: String(r.user_id),
            subject: r.subject,
            message: r.message ?? undefined,
            status: r.status,
            createdAt: toIsoDate(r.created_at),
            updatedAt: toIsoDate(r.updated_at),
          }))
        )
      }

      const list = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.supportRequests.findMany({
        where: eq(pgSchema.supportRequests.userId, userId),
        orderBy: [desc(pgSchema.supportRequests.createdAt)],
      })
      return reply.send(
        list.map((r) => ({
          id: r.id,
          userId: r.userId,
          subject: r.subject,
          message: r.message ?? undefined,
          status: r.status,
          createdAt: toIsoDate(r.createdAt),
          updatedAt: toIsoDate(r.updatedAt),
        }))
      )
    } catch (err) {
      console.error('[support] Ошибка получения запросов:', err)
      return reply.status(500).send({ error: 'Ошибка получения запросов' })
    }
  })

  /** POST /api/support — создать запрос */
  app.post<{ Body: { subject?: string; message?: string } }>(
    '/api/support',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { subject?: string; message?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

      if (useFileStore) return reply.status(501).send({ error: 'Запросы в поддержку доступны только при работе с БД' })

      const { subject, message } = req.body ?? {}

      try {
        if (useMysql) {
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
          const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .insert(mysqlSchema.supportRequests)
            .values({
              user_id: userIdNum,
              subject: (subject ?? '').trim() || 'Без темы',
              message: (message ?? '').trim() || null,
              status: 'pending',
            })
            .$returningId()
          const createdId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
          if (createdId == null) return reply.status(500).send({ error: 'Ошибка создания запроса' })
          const [created] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.supportRequests.findMany({
            where: eq(mysqlSchema.supportRequests.id, createdId),
          })
          if (!created) return reply.status(500).send({ error: 'Запрос не найден после создания' })
          const r = created as { id: number; user_id: number; subject: string; message: string | null; status: string; created_at: Date; updated_at: Date }
          return reply.status(201).send({
            id: String(r.id),
            userId: String(r.user_id),
            subject: r.subject,
            message: r.message ?? undefined,
            status: r.status,
            createdAt: toIsoDate(r.created_at),
            updatedAt: toIsoDate(r.updated_at),
          })
        }

        const [created] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .insert(pgSchema.supportRequests)
          .values({
            userId,
            subject: (subject ?? '').trim() || 'Без темы',
            message: (message ?? '').trim() || undefined,
            status: 'pending',
          })
          .returning()
        if (!created) return reply.status(500).send({ error: 'Ошибка создания запроса' })
        return reply.status(201).send({
          id: created.id,
          userId: created.userId,
          subject: created.subject,
          message: created.message ?? undefined,
          status: created.status,
          createdAt: toIsoDate(created.createdAt),
          updatedAt: toIsoDate(created.updatedAt),
        })
      } catch (err) {
        console.error('[support] Ошибка создания запроса:', err)
        return reply.status(500).send({ error: 'Ошибка создания запроса' })
      }
    }
  )

  /** GET /api/support/actions/delete/:id — удалить свой запрос */
  app.get<{ Params: { id?: string } }>(
    '/api/support/actions/delete/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const idRaw = String(req.params?.id ?? '').trim()
      if (!idRaw) return reply.status(400).send({ error: 'ID запроса не указан' })
      try {
        if (useFileStore) return reply.status(501).send({ error: 'Запросы доступны только при работе с БД' })
        if (useMysql) {
          const reqId = parseMysqlId(idRaw)
          if (reqId === null) return reply.status(400).send({ error: 'Неверный ID запроса' })
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
          const existing = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.supportRequests.findFirst({
            where: and(eq(mysqlSchema.supportRequests.id, reqId), eq(mysqlSchema.supportRequests.user_id, userIdNum)),
          })
          if (!existing) return reply.status(404).send({ error: 'Запрос не найден' })
          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .delete(mysqlSchema.supportRequests)
            .where(and(eq(mysqlSchema.supportRequests.id, reqId), eq(mysqlSchema.supportRequests.user_id, userIdNum)))
          return reply.status(204).send()
        }
        const [deleted] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .delete(pgSchema.supportRequests)
          .where(and(eq(pgSchema.supportRequests.id, idRaw), eq(pgSchema.supportRequests.userId, userId)))
          .returning({ id: pgSchema.supportRequests.id })
        if (!deleted) return reply.status(404).send({ error: 'Запрос не найден' })
        return reply.status(204).send()
      } catch (err) {
        console.error('[support] Ошибка удаления запроса:', err)
        return reply.status(500).send({ error: 'Ошибка удаления запроса' })
      }
    }
  )

  /** GET /api/admin/support — список всех запросов (только админ) */
  app.get('/api/admin/support', { preHandler: [app.authenticate, requireAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    if (useFileStore) return reply.send([])
    try {
      if (useMysql) {
        const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.supportRequests.findMany({
          orderBy: [desc(mysqlSchema.supportRequests.created_at)],
        })
        const userIds = [...new Set(list.map((r: { user_id: number }) => r.user_id))]
        const usersMap = new Map<number, { email?: string; name?: string }>()
        for (const uid of userIds) {
          const u = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
            where: eq(mysqlSchema.users.id, uid),
            columns: { email: true, name: true, last_name: true },
          })
          if (u) usersMap.set(uid, { email: u.email, name: [u.name, (u as { last_name?: string }).last_name].filter(Boolean).join(' ') })
        }
        return reply.send(
          list.map((r: { id: number; user_id: number; subject: string; message: string | null; status: string; created_at: Date; updated_at: Date }) => {
            const u = usersMap.get(r.user_id)
            return {
              id: String(r.id),
              userId: String(r.user_id),
              subject: r.subject,
              message: r.message ?? undefined,
              status: r.status,
              createdAt: toIsoDate(r.created_at),
              updatedAt: toIsoDate(r.updated_at),
              userEmail: u?.email,
              userName: u?.name,
            }
          })
        )
      }

      const list = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.supportRequests.findMany({
        orderBy: [desc(pgSchema.supportRequests.createdAt)],
      })
      const userIds = [...new Set(list.map((r) => r.userId))]
      const usersMap = new Map<string, { email?: string; name?: string }>()
      for (const uid of userIds) {
        const u = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
          where: eq(pgSchema.users.id, uid),
          columns: { email: true, firstName: true, lastName: true },
        })
        if (u) usersMap.set(uid, { email: u.email, name: [u.firstName, u.lastName].filter(Boolean).join(' ') })
      }
      return reply.send(
        list.map((r) => ({
          id: r.id,
          userId: r.userId,
          subject: r.subject,
          message: r.message ?? undefined,
          status: r.status,
          createdAt: toIsoDate(r.createdAt),
          updatedAt: toIsoDate(r.updatedAt),
          userEmail: usersMap.get(r.userId)?.email,
          userName: usersMap.get(r.userId)?.name,
        }))
      )
    } catch (err) {
      console.error('[support] Ошибка получения запросов (админ):', err)
      return reply.status(500).send({ error: 'Ошибка получения запросов' })
    }
  })

  /** GET /api/admin/support/actions/delete/:id — удалить любой запрос (админ) */
  app.get<{ Params: { id?: string } }>(
    '/api/admin/support/actions/delete/:id',
    { preHandler: [app.authenticate, requireAdmin] },
    async (req: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
      const idRaw = String(req.params?.id ?? '').trim()
      if (!idRaw) return reply.status(400).send({ error: 'ID запроса не указан' })
      try {
        if (useFileStore) return reply.status(501).send({ error: 'Запросы доступны только при работе с БД' })
        if (useMysql) {
          const reqId = parseMysqlId(idRaw)
          if (reqId === null) return reply.status(400).send({ error: 'Неверный ID запроса' })
          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .delete(mysqlSchema.supportRequests)
            .where(eq(mysqlSchema.supportRequests.id, reqId))
          return reply.status(204).send()
        }
        await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
          .delete(pgSchema.supportRequests)
          .where(eq(pgSchema.supportRequests.id, idRaw))
        return reply.status(204).send()
      } catch (err) {
        console.error('[support] Ошибка удаления запроса (админ):', err)
        return reply.status(500).send({ error: 'Ошибка удаления запроса' })
      }
    }
  )
}
