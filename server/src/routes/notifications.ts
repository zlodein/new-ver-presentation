import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, desc, and } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

function toIsoDate(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString()
}

export async function notificationRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest) => (req.user as { sub: string })?.sub

  // Получить все уведомления пользователя
  app.get('/api/notifications', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { read } = req.query as { read?: string }

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает уведомления - возвращаем пустой массив
        return reply.send([])
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const whereConditions: any[] = [eq(mysqlSchema.notifications.user_id, userIdNum)]
        if (read !== undefined) {
          whereConditions.push(eq(mysqlSchema.notifications.read, read === 'true' ? 'true' : 'false'))
        }
        const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.notifications.findMany({
          where: and(...whereConditions),
          orderBy: [desc(mysqlSchema.notifications.created_at)],
        })
        return reply.send(
          list.map((n: { id: number; title: string; message: string | null; type: string; read: string; created_at: Date }) => ({
            id: String(n.id),
            title: n.title,
            message: n.message ?? undefined,
            type: n.type,
            read: n.read === 'true',
            createdAt: toIsoDate(n.created_at),
          }))
        )
      }

      // PostgreSQL
      const whereConditions = [eq(pgSchema.notifications.userId, userId)]
      if (read !== undefined) {
        whereConditions.push(eq(pgSchema.notifications.read, read === 'true' ? 'true' : 'false'))
      }

      const notifications = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.notifications.findMany({
        where: and(...whereConditions),
        orderBy: [desc(pgSchema.notifications.createdAt)],
      })

      return reply.send(notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read === 'true',
        createdAt: toIsoDate(n.createdAt),
      })))
    } catch (err) {
      console.error('[notifications] Ошибка получения уведомлений:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Создать уведомление
  app.post('/api/notifications', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const body = req.body as { title?: string; message?: string; type?: string }
    const { title, message, type = 'info' } = body

    if (!title) {
      return reply.status(400).send({ error: 'Название обязательно' })
    }

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает уведомления
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает уведомления' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .insert(mysqlSchema.notifications)
          .values({
            user_id: userIdNum,
            title,
            message,
            type,
          })
          .$returningId()
        const notificationId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
        if (notificationId == null) return reply.status(500).send({ error: 'Ошибка создания уведомления' })
        const created = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.notifications.findFirst({
          where: eq(mysqlSchema.notifications.id, notificationId),
        })
        if (!created) return reply.status(500).send({ error: 'Ошибка создания уведомления' })
        return reply.status(201).send({
          id: String(created.id),
          title: created.title,
          message: created.message ?? undefined,
          type: created.type,
          read: created.read === 'true',
          createdAt: toIsoDate(created.created_at),
        })
      }

      // PostgreSQL
      const [notification] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).insert(pgSchema.notifications).values({
        userId,
        title,
        message,
        type,
      }).returning()

      return reply.status(201).send({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read === 'true',
        createdAt: toIsoDate(notification.createdAt),
      })
    } catch (err) {
      console.error('[notifications] Ошибка создания уведомления:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Отметить уведомление как прочитанное
  app.put('/api/notifications/:id/read', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const params = req.params as { id?: string }
    const { id } = params

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает уведомления
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает уведомления' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const notificationIdNum = Number(id)
        if (Number.isNaN(notificationIdNum)) return reply.status(400).send({ error: 'Неверный ID уведомления' })
        
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.notifications)
          .set({ read: 'true' })
          .where(and(eq(mysqlSchema.notifications.id, notificationIdNum), eq(mysqlSchema.notifications.user_id, userIdNum)))

        const notification = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.notifications.findFirst({
          where: eq(mysqlSchema.notifications.id, notificationIdNum),
        })
        if (!notification) return reply.status(404).send({ error: 'Уведомление не найдено' })
        return reply.send({
          id: String(notification.id),
          title: notification.title,
          message: notification.message ?? undefined,
          type: notification.type,
          read: notification.read === 'true',
          createdAt: toIsoDate(notification.created_at),
        })
      }

      // PostgreSQL
      if (!id) return reply.status(400).send({ error: 'ID уведомления обязателен' })
      const [notification] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .update(pgSchema.notifications)
        .set({ read: 'true' })
        .where(and(eq(pgSchema.notifications.id, id), eq(pgSchema.notifications.userId, userId)))
        .returning()

      if (!notification) return reply.status(404).send({ error: 'Уведомление не найдено' })

      return reply.send({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read === 'true',
        createdAt: toIsoDate(notification.createdAt),
      })
    } catch (err) {
      console.error('[notifications] Ошибка обновления уведомления:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Удалить уведомление
  app.delete('/api/notifications/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const params = req.params as { id?: string }
    const { id } = params

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает уведомления
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает уведомления' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const notificationIdNum = Number(id)
        if (Number.isNaN(notificationIdNum)) return reply.status(400).send({ error: 'Неверный ID уведомления' })
        
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.notifications)
          .where(and(eq(mysqlSchema.notifications.id, notificationIdNum), eq(mysqlSchema.notifications.user_id, userIdNum)))

        return reply.status(204).send()
      }

      // PostgreSQL
      if (!id) return reply.status(400).send({ error: 'ID уведомления обязателен' })
      const [deleted] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.notifications)
        .where(and(eq(pgSchema.notifications.id, id), eq(pgSchema.notifications.userId, userId)))
        .returning()

      if (!deleted) return reply.status(404).send({ error: 'Уведомление не найдено' })

      return reply.status(204).send()
    } catch (err) {
      console.error('[notifications] Ошибка удаления уведомления:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Очистить все уведомления
  app.delete('/api/notifications', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает уведомления
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает уведомления' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.notifications)
          .where(eq(mysqlSchema.notifications.user_id, userIdNum))
        return reply.status(204).send()
      }

      // PostgreSQL
      await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.notifications)
        .where(eq(pgSchema.notifications.userId, userId))

      return reply.status(204).send()
    } catch (err) {
      console.error('[notifications] Ошибка очистки уведомлений:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })
}
