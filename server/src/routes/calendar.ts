import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, desc, gte, lte, and } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

function toIsoDate(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString()
}

export async function calendarRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest) => (req.user as { sub: string })?.sub

  // Получить все события пользователя
  app.get('/api/calendar/events', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает календарь - возвращаем пустой массив
        return reply.send([])
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const list = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.calendarEvents.findMany({
          where: eq(mysqlSchema.calendarEvents.user_id, userIdNum),
          orderBy: [desc(mysqlSchema.calendarEvents.start)],
        })
        return reply.send(
          list.map((e: { id: number; title: string; start: Date; end: Date | null; all_day: string; color: string }) => ({
            id: String(e.id),
            title: e.title,
            start: toIsoDate(e.start),
            end: e.end ? toIsoDate(e.end) : undefined,
            allDay: e.all_day === 'true',
            extendedProps: { calendar: e.color },
          }))
        )
      }

      // PostgreSQL
      const events = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.calendarEvents.findMany({
        where: eq(pgSchema.calendarEvents.userId, userId),
        orderBy: [desc(pgSchema.calendarEvents.start)],
      })

      return reply.send(events.map((e) => ({
        id: e.id,
        title: e.title,
        start: toIsoDate(e.start),
        end: e.end ? toIsoDate(e.end) : undefined,
        allDay: e.allDay === 'true',
        extendedProps: { calendar: e.color },
      })))
    } catch (err) {
      console.error('[calendar] Ошибка получения событий:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Создать событие
  app.post('/api/calendar/events', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const body = req.body as { title?: string; start?: string; end?: string; allDay?: boolean; color?: string }
    const { title, start, end, allDay = false, color = 'Primary' } = body

    if (!title || !start) {
      return reply.status(400).send({ error: 'Название и дата начала обязательны' })
    }

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает календарь
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает календарь' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const [event] = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).insert(mysqlSchema.calendarEvents).values({
          user_id: userIdNum,
          title,
          start: new Date(start),
          end: end ? new Date(end) : undefined,
          all_day: allDay ? 'true' : 'false',
          color,
        }).$returningId()
        const created = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.calendarEvents.findFirst({
          where: eq(mysqlSchema.calendarEvents.id, Number(event)),
        })
        if (!created) return reply.status(500).send({ error: 'Ошибка создания события' })
        return reply.status(201).send({
          id: String(created.id),
          title: created.title,
          start: toIsoDate(created.start),
          end: created.end ? toIsoDate(created.end) : undefined,
          allDay: created.all_day === 'true',
          extendedProps: { calendar: created.color },
        })
      }

      // PostgreSQL
      const [event] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).insert(pgSchema.calendarEvents).values({
        userId,
        title,
        start: new Date(start),
        end: end ? new Date(end) : undefined,
        allDay: allDay ? 'true' : 'false',
        color,
      }).returning()

      return reply.status(201).send({
        id: event.id,
        title: event.title,
        start: toIsoDate(event.start),
        end: event.end ? toIsoDate(event.end) : undefined,
        allDay: event.allDay === 'true',
        extendedProps: { calendar: event.color },
      })
    } catch (err) {
      console.error('[calendar] Ошибка создания события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Обновить событие
  app.put('/api/calendar/events/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const params = req.params as { id?: string }
    const body = req.body as { title?: string; start?: string; end?: string; allDay?: boolean; color?: string }
    const { id } = params
    const { title, start, end, allDay, color } = body

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает календарь
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает календарь' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const eventIdNum = Number(id)
        if (Number.isNaN(eventIdNum)) return reply.status(400).send({ error: 'Неверный ID события' })
        
        const updateData: {
          title?: string
          start?: Date
          end?: Date | null
          all_day?: string
          color?: string
        } = {}
        if (title) updateData.title = title
        if (start) updateData.start = new Date(start)
        if (end !== undefined) updateData.end = end ? new Date(end) : null
        if (allDay !== undefined) updateData.all_day = allDay ? 'true' : 'false'
        if (color) updateData.color = color

        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.calendarEvents)
          .set(updateData)
          .where(and(eq(mysqlSchema.calendarEvents.id, eventIdNum), eq(mysqlSchema.calendarEvents.user_id, userIdNum)))

        const updated = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.calendarEvents.findFirst({
          where: eq(mysqlSchema.calendarEvents.id, eventIdNum),
        })
        if (!updated) return reply.status(404).send({ error: 'Событие не найдено' })
        return reply.send({
          id: String(updated.id),
          title: updated.title,
          start: toIsoDate(updated.start),
          end: updated.end ? toIsoDate(updated.end) : undefined,
          allDay: updated.all_day === 'true' || updated.all_day === true,
          extendedProps: { calendar: updated.color },
        })
      }

      // PostgreSQL
      const updateData: {
        title?: string
        start?: Date
        end?: Date | null
        allDay?: string
        color?: string
        updatedAt?: Date
      } = {}
      if (title) updateData.title = title
      if (start) updateData.start = new Date(start)
      if (end !== undefined) updateData.end = end ? new Date(end) : null
      if (allDay !== undefined) updateData.allDay = allDay ? 'true' : 'false'
      if (color) updateData.color = color
      updateData.updatedAt = new Date()

      if (!id) return reply.status(400).send({ error: 'ID события обязателен' })
      const [event] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .update(pgSchema.calendarEvents)
        .set(updateData)
        .where(and(eq(pgSchema.calendarEvents.id, id), eq(pgSchema.calendarEvents.userId, userId)))
        .returning()

      if (!event) return reply.status(404).send({ error: 'Событие не найдено' })

      return reply.send({
        id: event.id,
        title: event.title,
        start: toIsoDate(event.start),
        end: event.end ? toIsoDate(event.end) : undefined,
        allDay: event.allDay === 'true',
        extendedProps: { calendar: event.color },
      })
    } catch (err) {
      console.error('[calendar] Ошибка обновления события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Удалить событие
  app.delete('/api/calendar/events/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const params = req.params as { id?: string }
    const { id } = params

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает календарь
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает календарь' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const eventIdNum = Number(id)
        if (Number.isNaN(eventIdNum)) return reply.status(400).send({ error: 'Неверный ID события' })
        
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .delete(mysqlSchema.calendarEvents)
          .where(and(eq(mysqlSchema.calendarEvents.id, eventIdNum), eq(mysqlSchema.calendarEvents.user_id, userIdNum)))

        return reply.status(204).send()
      }

      // PostgreSQL
      if (!id) return reply.status(400).send({ error: 'ID события обязателен' })
      const [deleted] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .delete(pgSchema.calendarEvents)
        .where(and(eq(pgSchema.calendarEvents.id, id), eq(pgSchema.calendarEvents.userId, userId)))
        .returning()

      if (!deleted) return reply.status(404).send({ error: 'Событие не найдено' })

      return reply.status(204).send()
    } catch (err) {
      console.error('[calendar] Ошибка удаления события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })
}
