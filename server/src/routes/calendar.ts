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
        // Для файлового хранилища
        const events = fileStore.getCalendarEventsByUserId(userId)
        return reply.send(events.map((e) => ({
          id: e.id,
          title: e.title,
          start: toIsoDate(e.start),
          end: e.end ? toIsoDate(e.end) : undefined,
          allDay: e.allDay === 'true' || e.allDay === true,
          extendedProps: { calendar: e.color },
        })))
      }

      if (useMysql) {
        // MySQL не поддерживается для календаря в этой версии
        return reply.send([])
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
        allDay: e.allDay === 'true' || e.allDay === true,
        extendedProps: { calendar: e.color },
      })))
    } catch (err) {
      console.error('[calendar] Ошибка получения событий:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Создать событие
  app.post('/api/calendar/events', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { title: string; start: string; end?: string; allDay?: boolean; color?: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { title, start, end, allDay = false, color = 'Primary' } = req.body

    if (!title || !start) {
      return reply.status(400).send({ error: 'Название и дата начала обязательны' })
    }

    try {
      if (useFileStore) {
        const event = fileStore.createCalendarEvent({
          userId,
          title,
          start: new Date(start),
          end: end ? new Date(end) : undefined,
          allDay: allDay ? 'true' : 'false',
          color,
        })
        return reply.status(201).send({
          id: event.id,
          title: event.title,
          start: toIsoDate(event.start),
          end: event.end ? toIsoDate(event.end) : undefined,
          allDay: event.allDay === 'true' || event.allDay === true,
          extendedProps: { calendar: event.color },
        })
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для календаря' })
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
        allDay: event.allDay === 'true' || event.allDay === true,
        extendedProps: { calendar: event.color },
      })
    } catch (err) {
      console.error('[calendar] Ошибка создания события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Обновить событие
  app.put('/api/calendar/events/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Params: { id: string }; Body: { title?: string; start?: string; end?: string; allDay?: boolean; color?: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { id } = req.params
    const { title, start, end, allDay, color } = req.body

    try {
      if (useFileStore) {
        const event = fileStore.updateCalendarEvent(id, userId, {
          title,
          start: start ? new Date(start) : undefined,
          end: end ? new Date(end) : undefined,
          allDay: allDay !== undefined ? (allDay ? 'true' : 'false') : undefined,
          color,
        })
        if (!event) return reply.status(404).send({ error: 'Событие не найдено' })
        return reply.send({
          id: event.id,
          title: event.title,
          start: toIsoDate(event.start),
          end: event.end ? toIsoDate(event.end) : undefined,
          allDay: event.allDay === 'true' || event.allDay === true,
          extendedProps: { calendar: event.color },
        })
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для календаря' })
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
        allDay: event.allDay === 'true' || event.allDay === true,
        extendedProps: { calendar: event.color },
      })
    } catch (err) {
      console.error('[calendar] Ошибка обновления события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Удалить событие
  app.delete('/api/calendar/events/:id', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const { id } = req.params

    try {
      if (useFileStore) {
        const deleted = fileStore.deleteCalendarEvent(id, userId)
        if (!deleted) return reply.status(404).send({ error: 'Событие не найдено' })
        return reply.status(204).send()
      }

      if (useMysql) {
        return reply.status(501).send({ error: 'MySQL не поддерживается для календаря' })
      }

      // PostgreSQL
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
