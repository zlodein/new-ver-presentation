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
        let notifications = fileStore.getNotificationsByUserId(userId)
        if (read !== undefined) {
          const readBool = read === 'true'
          notifications = notifications.filter((n) => (n.read === 'true' || n.read === true) === readBool)
        }
        return reply.send(notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read === 'true' || n.read === true,
          createdAt: toIsoDate(n.createdAt),
        })))
      }

      if (useMysql) {
        // MySQL не поддерживается для уведомлений в этой версии
        return reply.send([])
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
        read: n.read === 'true' || n.read === true,
        createdAt: toIsoDate(n.createdAt),
      })))
    } catch (err) {
      console.error('[notifications] Ошибка получения уведомлений:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Создать уведомление
  app.post('/api/notifications', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { title: string; message?: string; type?: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { title, message, type = 'info' } = req.body

    if (!title) {
      return reply.status(400).send({ error: 'Название обязательно' })
    }

    try {
      if (useFileStore) {
        const notification = fileStore.createNotification({
          userId,
          title,
          message,
          type,
        })
        return reply.status(201).send({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read === 'true' || notification.read === true,
          createdAt: toIsoDate(notification.createdAt),
        })
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для уведомлений' })
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
        read: notification.read === 'true' || notification.read === true,
        createdAt: toIsoDate(notification.createdAt),
      })
    } catch (err) {
      console.error('[notifications] Ошибка создания уведомления:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Отметить уведомление как прочитанное
  app.put('/api/notifications/:id/read', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { id } = req.params

    try {
      if (useFileStore) {
        const notification = fileStore.updateNotification(id, userId, { read: 'true' })
        if (!notification) return reply.status(404).send({ error: 'Уведомление не найдено' })
        return reply.send({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read === 'true' || notification.read === true,
          createdAt: toIsoDate(notification.createdAt),
        })
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для уведомлений' })
      }

      // PostgreSQL
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
        read: notification.read === 'true' || notification.read === true,
        createdAt: toIsoDate(notification.createdAt),
      })
    } catch (err) {
      console.error('[notifications] Ошибка обновления уведомления:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Удалить уведомление
  app.delete('/api/notifications/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { id } = req.params

    try {
      if (useFileStore) {
        const deleted = fileStore.deleteNotification(id, userId)
        if (!deleted) return reply.status(404).send({ error: 'Уведомление не найдено' })
        return reply.status(204).send()
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для уведомлений' })
      }

      // PostgreSQL
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
        fileStore.clearNotifications(userId)
        return reply.status(204).send()
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для уведомлений' })
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
