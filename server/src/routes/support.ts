import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, desc, asc } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import { fileStore } from '../db/file-store.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { toIsoDate } from '../utils/date.js'

/** Отображаемый ID тикета: для MySQL #123, для PG #A1B2C3D4 (первые 8 символов UUID) */
function formatTicketId(id: string | number, isPg: boolean): string {
  if (isPg && typeof id === 'string') {
    return '#' + id.replace(/-/g, '').slice(0, 8).toUpperCase()
  }
  return '#' + String(id)
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
            ticketId: formatTicketId(r.id, false),
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
          ticketId: formatTicketId(r.id, true),
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
            ticketId: formatTicketId(r.id, false),
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
          ticketId: formatTicketId(created.id, true),
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

  /** GET /api/support/:id — один тикет с ответами (владелец или админ) */
  app.get<{ Params: { id: string } }>(
    '/api/support/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const idRaw = req.params.id.trim()
      if (!idRaw) return reply.status(400).send({ error: 'ID не указан' })

      if (useFileStore) return reply.status(404).send({ error: 'Запрос не найден' })

      try {
        const isAdmin = await (async () => {
          if (useMysql) {
            const uid = Number(userId)
            if (Number.isNaN(uid)) return false
            const u = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
              where: eq(mysqlSchema.users.id, uid),
              columns: { role_id: true },
            })
            return (u as { role_id?: number })?.role_id === 2
          }
          return false
        })()

        if (useMysql) {
          const reqId = parseMysqlId(idRaw)
          if (reqId === null) return reply.status(404).send({ error: 'Запрос не найден' })
          const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
          const ticket = await mysqlDb.query.supportRequests.findFirst({
            where: eq(mysqlSchema.supportRequests.id, reqId),
          })
          if (!ticket) return reply.status(404).send({ error: 'Запрос не найден' })
          const t = ticket as { id: number; user_id: number; subject: string; message: string | null; status: string; created_at: Date; updated_at: Date }
          if (!isAdmin && String(t.user_id) !== userId) return reply.status(404).send({ error: 'Запрос не найден' })

          const replies = await mysqlDb.query.supportReplies.findMany({
            where: eq(mysqlSchema.supportReplies.support_request_id, reqId),
            orderBy: [asc(mysqlSchema.supportReplies.created_at)],
          })
          const replyUserIds = [...new Set(replies.map((r: { user_id: number }) => r.user_id))]
          const replyUsersMap = new Map<number, { email?: string; name?: string }>()
          for (const uid of replyUserIds) {
            const u = await mysqlDb.query.users.findFirst({
              where: eq(mysqlSchema.users.id, uid),
              columns: { email: true, name: true, last_name: true },
            })
            if (u) replyUsersMap.set(uid, { email: u.email, name: [u.name, (u as { last_name?: string }).last_name].filter(Boolean).join(' ') })
          }
          const ticketUser = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, t.user_id),
            columns: { email: true, name: true, last_name: true },
          })
          const ticketUserData = ticketUser ? { userEmail: ticketUser.email, userName: [ticketUser.name, (ticketUser as { last_name?: string }).last_name].filter(Boolean).join(' ') } : {}

          return reply.send({
            ticket: {
              id: String(t.id),
              ticketId: formatTicketId(t.id, false),
              userId: String(t.user_id),
              subject: t.subject,
              message: t.message ?? undefined,
              status: t.status,
              createdAt: toIsoDate(t.created_at),
              updatedAt: toIsoDate(t.updated_at),
              ...ticketUserData,
            },
            replies: replies.map((r: { id: number; user_id: number; message: string; created_at: Date }) => {
              const u = replyUsersMap.get(r.user_id)
              return {
                id: String(r.id),
                userId: String(r.user_id),
                message: r.message,
                createdAt: toIsoDate(r.created_at),
                userEmail: u?.email,
                userName: u?.name,
              }
            }),
          })
        }

        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        const ticket = await pgDb.query.supportRequests.findFirst({
          where: eq(pgSchema.supportRequests.id, idRaw),
        })
        if (!ticket) return reply.status(404).send({ error: 'Запрос не найден' })
        if (ticket.userId !== userId) return reply.status(404).send({ error: 'Запрос не найден' })

        const replies = await pgDb.query.supportReplies.findMany({
          where: eq(pgSchema.supportReplies.supportRequestId, idRaw),
          orderBy: [asc(pgSchema.supportReplies.createdAt)],
        })
        const replyUserIds = [...new Set(replies.map((r) => r.userId))]
        const replyUsersMap = new Map<string, { email?: string; name?: string }>()
        for (const uid of replyUserIds) {
          const u = await pgDb.query.users.findFirst({
            where: eq(pgSchema.users.id, uid),
            columns: { email: true, firstName: true, lastName: true },
          })
          if (u) replyUsersMap.set(uid, { email: u.email, name: [u.firstName, u.lastName].filter(Boolean).join(' ') })
        }
        const ticketUser = await pgDb.query.users.findFirst({
          where: eq(pgSchema.users.id, ticket.userId),
          columns: { email: true, firstName: true, lastName: true },
        })
        const ticketUserData = ticketUser ? { userEmail: ticketUser.email, userName: [ticketUser.firstName, ticketUser.lastName].filter(Boolean).join(' ') } : {}

        return reply.send({
          ticket: {
            id: ticket.id,
            ticketId: formatTicketId(ticket.id, true),
            userId: ticket.userId,
            subject: ticket.subject,
            message: ticket.message ?? undefined,
            status: ticket.status,
            createdAt: toIsoDate(ticket.createdAt),
            updatedAt: toIsoDate(ticket.updatedAt),
            ...ticketUserData,
          },
          replies: replies.map((r) => ({
            id: r.id,
            userId: r.userId,
            message: r.message,
            createdAt: toIsoDate(r.createdAt),
            userEmail: replyUsersMap.get(r.userId)?.email,
            userName: replyUsersMap.get(r.userId)?.name,
          })),
        })
      } catch (err) {
        console.error('[support] Ошибка получения тикета:', err)
        return reply.status(500).send({ error: 'Ошибка получения тикета' })
      }
    }
  )

  /** POST /api/support/:id/reply — добавить ответ в тикет */
  app.post<{ Params: { id: string }; Body: { message?: string } }>(
    '/api/support/:id/reply',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { message?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const idRaw = req.params.id.trim()
      const message = (req.body?.message ?? '').trim()
      if (!message) return reply.status(400).send({ error: 'Текст ответа не указан' })

      if (useFileStore) return reply.status(501).send({ error: 'Недоступно без БД' })

      try {
        if (useMysql) {
          const reqId = parseMysqlId(idRaw)
          if (reqId === null) return reply.status(404).send({ error: 'Запрос не найден' })
          const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
          const ticket = await mysqlDb.query.supportRequests.findFirst({
            where: eq(mysqlSchema.supportRequests.id, reqId),
          })
          if (!ticket) return reply.status(404).send({ error: 'Запрос не найден' })
          const t = ticket as { user_id: number }
          const userIdNum = Number(userId)
          if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
          const isAdmin = await (async () => {
            const u = await mysqlDb.query.users.findFirst({
              where: eq(mysqlSchema.users.id, userIdNum),
              columns: { role_id: true },
            })
            return (u as { role_id?: number })?.role_id === 2
          })()
          if (!isAdmin && t.user_id !== userIdNum) return reply.status(404).send({ error: 'Запрос не найден' })

          await mysqlDb.insert(mysqlSchema.supportReplies).values({
            support_request_id: reqId,
            user_id: userIdNum,
            message,
          })
          const replies = await mysqlDb.query.supportReplies.findMany({
            where: eq(mysqlSchema.supportReplies.support_request_id, reqId),
            orderBy: [asc(mysqlSchema.supportReplies.created_at)],
          })
          const last = replies[replies.length - 1] as { id: number; user_id: number; message: string; created_at: Date }
          const author = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, last.user_id),
            columns: { email: true, name: true, last_name: true },
          })
          return reply.status(201).send({
            id: String(last.id),
            userId: String(last.user_id),
            message: last.message,
            createdAt: toIsoDate(last.created_at),
            userEmail: author?.email,
            userName: author ? [author.name, (author as { last_name?: string }).last_name].filter(Boolean).join(' ') : undefined,
          })
        }

        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        const ticket = await pgDb.query.supportRequests.findFirst({
          where: eq(pgSchema.supportRequests.id, idRaw),
        })
        if (!ticket) return reply.status(404).send({ error: 'Запрос не найден' })
        const ticketUserId = ticket.userId
        if (ticketUserId !== userId) {
          const roleRow = await pgDb.select().from(pgSchema.users).where(eq(pgSchema.users.id, userId)).limit(1)
          const r = roleRow[0] as { role_id?: number } | undefined
          if (r?.role_id !== 2) return reply.status(404).send({ error: 'Запрос не найден' })
        }

        const [created] = await pgDb
          .insert(pgSchema.supportReplies)
          .values({
            supportRequestId: idRaw,
            userId,
            message,
          })
          .returning()
        if (!created) return reply.status(500).send({ error: 'Ошибка добавления ответа' })
        const author = await pgDb.query.users.findFirst({
          where: eq(pgSchema.users.id, created.userId),
          columns: { email: true, firstName: true, lastName: true },
        })
        return reply.status(201).send({
          id: created.id,
          userId: created.userId,
          message: created.message,
          createdAt: toIsoDate(created.createdAt),
          userEmail: author?.email,
          userName: author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : undefined,
        })
      } catch (err) {
        console.error('[support] Ошибка добавления ответа:', err)
        return reply.status(500).send({ error: 'Ошибка добавления ответа' })
      }
    }
  )

  /** PATCH /api/support/:id — обновить статус тикета (только админ) */
  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    '/api/support/:id',
    { preHandler: [app.authenticate, requireAdmin] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { status?: string } }>, reply: FastifyReply) => {
      const idRaw = req.params.id.trim()
      const status = req.body?.status
      if (!status || !['pending', 'solved'].includes(status)) return reply.status(400).send({ error: 'Укажите status: pending или solved' })

      if (useFileStore) return reply.status(501).send({ error: 'Недоступно без БД' })

      try {
        if (useMysql) {
          const reqId = parseMysqlId(idRaw)
          if (reqId === null) return reply.status(404).send({ error: 'Запрос не найден' })
          const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
          await mysqlDb.update(mysqlSchema.supportRequests).set({ status, updated_at: new Date() }).where(eq(mysqlSchema.supportRequests.id, reqId))
          return reply.send({ success: true, status })
        }
        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        await pgDb.update(pgSchema.supportRequests).set({ status, updatedAt: new Date() }).where(eq(pgSchema.supportRequests.id, idRaw))
        return reply.send({ success: true, status })
      } catch (err) {
        console.error('[support] Ошибка обновления статуса:', err)
        return reply.status(500).send({ error: 'Ошибка обновления статуса' })
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
              ticketId: formatTicketId(r.id, false),
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
          ticketId: formatTicketId(r.id, true),
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
