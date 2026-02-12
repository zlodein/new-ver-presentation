import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, or, desc, asc, and, ne } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'
import { toIsoDate } from '../utils/date.js'

function getUserId(req: FastifyRequest): string | null {
  return (req.user as { sub?: string })?.sub ?? null
}

function isUnknownColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /Unknown column|doesn't exist/i.test(msg)
}

/** In-memory store for chat when using file store (no DB) */
const fileStoreChat: { fromUserId: string; toUserId: string; message: string; createdAt: string; id: string }[] = []
function nextFileStoreId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function chatRoutes(app: FastifyInstance) {
  /** GET /api/chat/conversations — список диалогов (с кем переписывался, последнее сообщение) */
  app.get('/api/chat/conversations', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    if (useFileStore) {
      const users = fileStore.load().users
      const myMessages = fileStoreChat.filter((m) => m.fromUserId === userId || m.toUserId === userId)
      const otherIds = new Set<string>()
      for (const m of myMessages.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))) {
        const other = m.fromUserId === userId ? m.toUserId : m.fromUserId
        if (otherIds.has(other)) continue
        otherIds.add(other)
      }
      const list = Array.from(otherIds).map((otherId) => {
        const last = fileStoreChat
          .filter((m) => (m.fromUserId === userId && m.toUserId === otherId) || (m.toUserId === userId && m.fromUserId === otherId))
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0]
        const u = users.find((x) => x.id === otherId)
        const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : 'Пользователь'
        const lastMessage = last?.message ?? ''
        const lastMessageTime = last?.createdAt ? formatTimeAgo(last.createdAt) : ''
        return {
          id: otherId,
          userId: otherId,
          name,
          role: '',
          avatar: null,
          status: 'offline' as const,
          lastMessage,
          lastMessageTime,
        }
      })
      return reply.send(list)
    }

    try {
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const messages = await mysqlDb
          .select()
          .from(mysqlSchema.chatMessages)
          .where(or(eq(mysqlSchema.chatMessages.from_user_id, userIdNum), eq(mysqlSchema.chatMessages.to_user_id, userIdNum)))
          .orderBy(desc(mysqlSchema.chatMessages.created_at))

        const seen = new Set<number>()
        const otherUserIds: number[] = []
        for (const m of messages) {
          const other = m.from_user_id === userIdNum ? m.to_user_id : m.from_user_id
          if (seen.has(other)) continue
          seen.add(other)
          otherUserIds.push(other)
        }

        const result = await Promise.all(
          otherUserIds.map(async (otherId) => {
            const last = messages.find(
              (x) => (x.from_user_id === userIdNum && x.to_user_id === otherId) || (x.to_user_id === userIdNum && x.from_user_id === otherId)
            )
            const userRow = await mysqlDb.query.users.findFirst({
              where: eq(mysqlSchema.users.id, otherId),
              columns: { id: true, name: true, last_name: true, user_img: true, position: true },
            })
            const u = userRow as { id: number; name: string; last_name: string | null; user_img: string | null; position: string | null } | undefined
            const name = u ? [u.name, u.last_name].filter(Boolean).join(' ') || 'Пользователь' : 'Пользователь'
            const role = u?.position ?? ''
            return {
              id: String(otherId),
              userId: String(otherId),
              name,
              role,
              avatar: u?.user_img ?? null,
              status: 'offline' as const,
              lastMessage: last?.message ?? '',
              lastMessageTime: last?.created_at ? formatTimeAgo(String(last.created_at)) : '',
            }
          })
        )
        return reply.send(result)
      }

      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const messages = await pgDb
        .select()
        .from(pgSchema.chatMessages)
        .where(or(eq(pgSchema.chatMessages.fromUserId, userId), eq(pgSchema.chatMessages.toUserId, userId)))
        .orderBy(desc(pgSchema.chatMessages.createdAt))

      const seen = new Set<string>()
      const otherUserIds: string[] = []
      for (const m of messages) {
        const other = m.fromUserId === userId ? m.toUserId : m.fromUserId
        if (seen.has(other)) continue
        seen.add(other)
        otherUserIds.push(other)
      }

      const result = await Promise.all(
        otherUserIds.map(async (otherId) => {
          const last = messages.find((x) => (x.fromUserId === userId && x.toUserId === otherId) || (x.toUserId === userId && x.fromUserId === otherId))
          const userRow = await pgDb.query.users.findFirst({
            where: eq(pgSchema.users.id, otherId),
            columns: { id: true, firstName: true, lastName: true },
          })
          const u = userRow as { id: string; firstName: string | null; lastName: string | null } | undefined
          const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Пользователь' : 'Пользователь'
          return {
            id: otherId,
            userId: otherId,
            name,
            role: '',
            avatar: null,
            status: 'offline' as const,
            lastMessage: last?.message ?? '',
            lastMessageTime: last?.createdAt ? formatTimeAgo(String(last.createdAt)) : '',
          }
        })
      )
      return reply.send(result)
    } catch (err) {
      console.error('[chat] Ошибка получения диалогов:', err)
      return reply.status(500).send({ error: 'Ошибка получения диалогов' })
    }
  })

  /** GET /api/chat/users — список пользователей (для поиска и начала диалога) */
  app.get('/api/chat/users', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    if (useFileStore) {
      const users = fileStore.load().users.filter((u) => u.id !== userId)
      return reply.send(
        users.map((u) => ({
          id: u.id,
          userId: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
          role: '',
          avatar: null,
          status: 'offline' as const,
          lastMessage: '',
          lastMessageTime: '',
        }))
      )
    }

    try {
      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        type UserRow = { id: number; name: string; last_name: string | null; user_img: string | null; position: string | null }
        let allUsers: UserRow[]
        try {
          allUsers = await mysqlDb.query.users.findMany({
            where: and(ne(mysqlSchema.users.id, userIdNum), eq(mysqlSchema.users.available_in_chat, 1)),
            columns: { id: true, name: true, last_name: true, user_img: true, position: true },
          }) as UserRow[]
        } catch (err) {
          if (isUnknownColumnError(err)) {
            allUsers = await mysqlDb.query.users.findMany({
              where: ne(mysqlSchema.users.id, userIdNum),
              columns: { id: true, name: true, last_name: true, user_img: true, position: true },
            }) as UserRow[]
          } else throw err
        }
        const others = allUsers
        return reply.send(
          others.map((u) => ({
            id: String(u.id),
            userId: String(u.id),
            name: [u.name, u.last_name].filter(Boolean).join(' ') || 'Пользователь',
            role: u.position ?? '',
            avatar: u.user_img ?? null,
            status: 'offline' as const,
            lastMessage: '',
            lastMessageTime: '',
          }))
        )
      }

      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      type PgUserRow = { id: string; firstName: string | null; lastName: string | null }
      let allUsers: PgUserRow[]
      try {
        allUsers = await pgDb.query.users.findMany({
          where: and(ne(pgSchema.users.id, userId), eq(pgSchema.users.availableInChat, true)),
          columns: { id: true, firstName: true, lastName: true },
        }) as PgUserRow[]
      } catch (err) {
        if (isUnknownColumnError(err)) {
          allUsers = await pgDb.query.users.findMany({
            where: ne(pgSchema.users.id, userId),
            columns: { id: true, firstName: true, lastName: true },
          }) as PgUserRow[]
        } else throw err
      }
      const others = allUsers
      return reply.send(
        others.map((u) => ({
          id: u.id,
          userId: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Пользователь',
          role: '',
          avatar: null,
          status: 'offline' as const,
          lastMessage: '',
          lastMessageTime: '',
        }))
      )
    } catch (err) {
      console.error('[chat] Ошибка получения пользователей:', err)
      return reply.status(500).send({ error: 'Ошибка получения пользователей' })
    }
  })

  /** GET /api/chat/messages?with=userId — сообщения с пользователем */
  app.get('/api/chat/messages', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    const withUserId = (req.query as { with?: string })?.with
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
    if (!withUserId) return reply.status(400).send({ error: 'Укажите параметр with (id пользователя)' })

      if (useFileStore) {
        const messages = fileStoreChat
          .filter(
            (m) =>
              (m.fromUserId === userId && m.toUserId === withUserId) || (m.fromUserId === withUserId && m.toUserId === userId)
          )
          .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
          .map((m) => ({
            id: m.id,
            fromUserId: m.fromUserId,
            toUserId: m.toUserId,
            message: m.message,
            createdAt: m.createdAt,
            isOwn: m.fromUserId === userId,
          }))
        return reply.send(messages)
      }

      try {
        if (useMysql) {
          const userIdNum = Number(userId)
          const withUserIdNum = Number(withUserId)
          if (Number.isNaN(userIdNum) || Number.isNaN(withUserIdNum))
            return reply.status(400).send({ error: 'Некорректный id пользователя' })
          const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
          const messages = await mysqlDb
            .select()
            .from(mysqlSchema.chatMessages)
            .where(
              or(
                and(eq(mysqlSchema.chatMessages.from_user_id, userIdNum), eq(mysqlSchema.chatMessages.to_user_id, withUserIdNum)),
                and(eq(mysqlSchema.chatMessages.from_user_id, withUserIdNum), eq(mysqlSchema.chatMessages.to_user_id, userIdNum))
              )
            )
            .orderBy(asc(mysqlSchema.chatMessages.created_at))
          return reply.send(
            messages.map((m) => ({
              id: String(m.id),
              fromUserId: String(m.from_user_id),
              toUserId: String(m.to_user_id),
              message: m.message,
              attachmentUrl: m.attachment_url ?? undefined,
              createdAt: toIsoDate(m.created_at),
              isOwn: m.from_user_id === userIdNum,
            }))
          )
        }

        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        const messages = await pgDb
          .select()
          .from(pgSchema.chatMessages)
          .where(
            or(
              and(eq(pgSchema.chatMessages.fromUserId, userId), eq(pgSchema.chatMessages.toUserId, withUserId)),
              and(eq(pgSchema.chatMessages.fromUserId, withUserId), eq(pgSchema.chatMessages.toUserId, userId))
            )
          )
          .orderBy(asc(pgSchema.chatMessages.createdAt))
        return reply.send(
          messages.map((m) => ({
            id: m.id,
            fromUserId: m.fromUserId,
            toUserId: m.toUserId,
            message: m.message,
            attachmentUrl: m.attachmentUrl ?? undefined,
            createdAt: toIsoDate(m.createdAt),
            isOwn: m.fromUserId === userId,
          }))
        )
      } catch (err) {
        console.error('[chat] Ошибка получения сообщений:', err)
        return reply.status(500).send({ error: 'Ошибка получения сообщений' })
      }
    }
  )

  /** POST /api/chat/messages — отправить сообщение */
  app.post<{ Body: { toUserId?: string; message?: string } }>(
    '/api/chat/messages',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { toUserId?: string; message?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      const { toUserId, message } = req.body ?? {}
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      if (!toUserId || toUserId === userId) return reply.status(400).send({ error: 'Укажите получателя' })
      const text = typeof message === 'string' ? message.trim() : ''
      if (!text) return reply.status(400).send({ error: 'Текст сообщения не может быть пустым' })

      if (useFileStore) {
        const id = nextFileStoreId()
        const createdAt = new Date().toISOString()
        fileStoreChat.push({
          id,
          fromUserId: userId,
          toUserId,
          message: text,
          createdAt,
        })
        return reply.status(201).send({
          id,
          fromUserId: userId,
          toUserId,
          message: text,
          createdAt,
          isOwn: true,
        })
      }

      try {
        if (useMysql) {
          const userIdNum = Number(userId)
          const toUserIdNum = Number(toUserId)
          if (Number.isNaN(userIdNum) || Number.isNaN(toUserIdNum))
            return reply.status(400).send({ error: 'Некорректный id пользователя' })
          const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
          await mysqlDb.insert(mysqlSchema.chatMessages).values({
            from_user_id: userIdNum,
            to_user_id: toUserIdNum,
            message: text,
          })
          const rows = await mysqlDb
            .select()
            .from(mysqlSchema.chatMessages)
            .where(
              and(
                eq(mysqlSchema.chatMessages.from_user_id, userIdNum),
                eq(mysqlSchema.chatMessages.to_user_id, toUserIdNum)
              )
            )
            .orderBy(desc(mysqlSchema.chatMessages.created_at))
            .limit(1)
          const r = rows[0]
          if (!r) return reply.status(500).send({ error: 'Ошибка отправки' })
          return reply.status(201).send({
            id: String(r.id),
            fromUserId: String(r.from_user_id),
            toUserId: String(r.to_user_id),
            message: r.message,
            createdAt: toIsoDate(r.created_at),
            isOwn: true,
          })
        }

        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        const [created] = await pgDb
          .insert(pgSchema.chatMessages)
          .values({
            fromUserId: userId,
            toUserId,
            message: text,
          })
          .returning()
        if (!created) return reply.status(500).send({ error: 'Ошибка отправки' })
        return reply.status(201).send({
          id: created.id,
          fromUserId: created.fromUserId,
          toUserId: created.toUserId,
          message: created.message,
          createdAt: toIsoDate(created.createdAt),
          isOwn: true,
        })
      } catch (err) {
        console.error('[chat] Ошибка отправки сообщения:', err)
        return reply.status(500).send({ error: 'Ошибка отправки сообщения' })
      }
    }
  )
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин`
  if (diffHours < 24) return `${diffHours} ч`
  if (diffDays < 7) return `${diffDays} дн`
  return d.toLocaleDateString()
}
