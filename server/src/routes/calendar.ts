import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, desc, gte, lte, and, lt, isNotNull, isNull } from 'drizzle-orm'
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'
import { toIsoDateRequired } from '../utils/date.js'

function toIsoDate(d: Date | string): string {
  return toIsoDateRequired(d)
}

/** Для MySQL: id может прийти как "1", "1.0" или "1:1" (артефакт) — берём целое число (до двоеточия или первая последовательность цифр). */
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

/** Извлекает id события из path (на случай, если прокси не передаёт :id в params). */
function getIdFromDeleteRequest(req: FastifyRequest<{ Params: { id?: string } }>): string {
  const fromParams = req.params?.id
  if (fromParams != null && String(fromParams).trim() !== '') return String(fromParams).trim()
  const path = (req as { url?: string }).url ?? (req as { raw?: { url?: string } }).raw?.url ?? ''
  const match = /\/api\/calendar\/events\/([^/?#]+)/.exec(path)
  return match ? decodeURIComponent(match[1]) : ''
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
        // Проверяем истекшие события и отправляем уведомления
        const now = new Date()
        for (const e of list) {
          const eventEnd = e.end ? new Date(e.end) : new Date(e.start)
          if (eventEnd < now) {
            const existingNotification = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.notifications.findFirst({
              where: and(
                eq(mysqlSchema.notifications.user_id, userIdNum),
                eq(mysqlSchema.notifications.type, 'calendar'),
                eq(mysqlSchema.notifications.source_id, String(e.id))
              ),
            })
            if (!existingNotification) {
              try {
                const baseMsg = `Событие "${e.title}" истекло (${eventEnd.toLocaleString('ru-RU')})`
                await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).insert(mysqlSchema.notifications).values({
                  user_id: userIdNum,
                  title: 'Истекшее событие в календаре',
                  message: baseMsg,
                  type: 'calendar',
                  source_id: String(e.id),
                })
              } catch (notifErr) {
                console.error('[calendar] Ошибка создания уведомления об истекшем событии:', notifErr)
              }
            }
          }
        }

        const calendarEvents = list.map((e: { id: number; title: string; start: Date; end: Date | null; all_day: string; color: string; notes: string | null }) => ({
          id: String(e.id),
          title: e.title,
          start: toIsoDate(e.start),
          end: e.end ? toIsoDate(e.end) : undefined,
          allDay: e.all_day === 'true',
          extendedProps: { calendar: e.color, notes: e.notes ?? '', type: 'event' },
        }))
        const tasksWithDue = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.tasks.findMany({
          where: and(eq(mysqlSchema.tasks.user_id, userIdNum), isNotNull(mysqlSchema.tasks.due_date)),
        })
        const taskEvents = (tasksWithDue as { id: number; title: string; due_date: Date | null }[])
          .filter((t) => t.due_date)
          .map((t) => {
            const d = new Date(t.due_date!)
            const start = d.toISOString().slice(0, 10) + 'T00:00:00.000Z'
            const end = d.toISOString().slice(0, 10) + 'T23:59:59.999Z'
            return {
              id: `task-${t.id}`,
              title: `📋 ${t.title}`,
              start,
              end,
              allDay: true,
              extendedProps: { calendar: 'Primary', notes: '', type: 'task', taskId: String(t.id) },
            }
          })
        return reply.send([...calendarEvents, ...taskEvents])
      }

      // PostgreSQL
      const events = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.calendarEvents.findMany({
        where: eq(pgSchema.calendarEvents.userId, userId),
        orderBy: [desc(pgSchema.calendarEvents.start)],
      })

      // Проверяем истекшие события и отправляем уведомления
      const now = new Date()
      for (const e of events) {
        const eventEnd = e.end ? new Date(e.end) : new Date(e.start)
        if (eventEnd < now) {
          const existingNotification = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.notifications.findFirst({
            where: and(
              eq(pgSchema.notifications.userId, userId),
              eq(pgSchema.notifications.type, 'calendar'),
              eq(pgSchema.notifications.sourceId, e.id)
            ),
          })
          if (!existingNotification) {
            try {
              const baseMsg = `Событие "${e.title}" истекло (${eventEnd.toLocaleString('ru-RU')})`
              await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).insert(pgSchema.notifications).values({
                userId,
                title: 'Истекшее событие в календаре',
                message: baseMsg,
                type: 'calendar',
                sourceId: e.id,
              })
            } catch (notifErr) {
              console.error('[calendar] Ошибка создания уведомления об истекшем событии:', notifErr)
            }
          }
        }
      }

      const calendarEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        start: toIsoDate(e.start),
        end: e.end ? toIsoDate(e.end) : undefined,
        allDay: e.allDay === 'true',
        extendedProps: { calendar: e.color, notes: (e as { notes?: string | null }).notes ?? '', type: 'event' },
      }))
      const tasksWithDue = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.tasks.findMany({
        where: and(eq(pgSchema.tasks.userId, userId), isNotNull(pgSchema.tasks.dueDate)),
      })
      const taskEvents = tasksWithDue
        .filter((t) => t.dueDate)
        .map((t) => {
          const d = new Date(t.dueDate!)
          const start = d.toISOString().slice(0, 10) + 'T00:00:00.000Z'
          const end = d.toISOString().slice(0, 10) + 'T23:59:59.999Z'
          return {
            id: `task-${t.id}`,
            title: `📋 ${t.title}`,
            start,
            end,
            allDay: true,
            extendedProps: { calendar: 'Primary', notes: '', type: 'task', taskId: t.id },
          }
        })
      return reply.send([...calendarEvents, ...taskEvents])
    } catch (err) {
      console.error('[calendar] Ошибка получения событий:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  // Создать событие
  app.post('/api/calendar/events', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })

    const body = req.body as { title?: string; start?: string; end?: string; allDay?: boolean; color?: string; notes?: string }
    const { title, start, end, allDay = false, color = 'Primary', notes } = body

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
        const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .insert(mysqlSchema.calendarEvents)
          .values({
            user_id: userIdNum,
            title,
            start: new Date(start),
            end: end ? new Date(end) : undefined,
            all_day: allDay ? 'true' : 'false',
            color,
            notes: notes ?? null,
          })
          .$returningId()
        const createdId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
        if (createdId == null) return reply.status(500).send({ error: 'Ошибка создания события' })
        const created = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.calendarEvents.findFirst({
          where: eq(mysqlSchema.calendarEvents.id, createdId),
        })
        if (!created) return reply.status(500).send({ error: 'Ошибка создания события' })
        
        // Создаем уведомление о новом событии
        try {
          const eventEnd = created.end ? new Date(created.end) : new Date(created.start)
          const now = new Date()
          const isExpired = eventEnd < now
          const baseMsg = isExpired
            ? `Событие "${created.title}" уже истекло (${eventEnd.toLocaleString('ru-RU')})`
            : `Событие "${created.title}" добавлено в календарь`
          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).insert(mysqlSchema.notifications).values({
            user_id: userIdNum,
            title: isExpired ? 'Истекшее событие в календаре' : 'Новое событие в календаре',
            message: baseMsg,
            type: 'calendar',
            source_id: String(created.id),
          })
        } catch (notifErr) {
          console.error('[calendar] Ошибка создания уведомления:', notifErr)
          // Не прерываем выполнение, если уведомление не создалось
        }
        
        return reply.status(201).send({
          id: String(created.id),
          title: created.title,
          start: toIsoDate(created.start),
          end: created.end ? toIsoDate(created.end) : undefined,
          allDay: created.all_day === 'true',
          extendedProps: { calendar: created.color, notes: (created as { notes?: string | null }).notes ?? '' },
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
        notes: notes ?? null,
      }).returning()

      const eventData = {
        id: event.id,
        title: event.title,
        start: toIsoDate(event.start),
        end: event.end ? toIsoDate(event.end) : undefined,
        allDay: event.allDay === 'true',
        extendedProps: { calendar: event.color, notes: (event as { notes?: string | null }).notes ?? '' },
      }

      // Создаем уведомление о новом событии
      try {
        const eventEnd = event.end ? new Date(event.end) : new Date(event.start)
        const now = new Date()
        const isExpired = eventEnd < now
        const baseMsg = isExpired
          ? `Событие "${event.title}" уже истекло (${eventEnd.toLocaleString('ru-RU')})`
          : `Событие "${event.title}" добавлено в календарь`
        await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).insert(pgSchema.notifications).values({
          userId,
          title: isExpired ? 'Истекшее событие в календаре' : 'Новое событие в календаре',
          message: baseMsg,
          type: 'calendar',
          sourceId: event.id,
        })
      } catch (notifErr) {
        console.error('[calendar] Ошибка создания уведомления:', notifErr)
        // Не прерываем выполнение, если уведомление не создалось
      }

      return reply.status(201).send(eventData)
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
    const body = req.body as { title?: string; start?: string; end?: string; allDay?: boolean; color?: string; notes?: string }
    const { id } = params
    const { title, start, end, allDay, color, notes } = body

    try {
      if (useFileStore) {
        // Файловое хранилище не поддерживает календарь
        return reply.status(501).send({ error: 'Файловое хранилище не поддерживает календарь' })
      }

      if (useMysql) {
        const userIdNum = Number(userId)
        if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
        const eventIdNum = parseMysqlId(id || '')
        if (eventIdNum === null) return reply.status(400).send({ error: 'Неверный ID события' })
        
        const updateData: {
          title?: string
          start?: Date
          end?: Date | null
          all_day?: string
          color?: string
          notes?: string | null
        } = {}
        if (title) updateData.title = title
        if (start) updateData.start = new Date(start)
        if (end !== undefined) updateData.end = end ? new Date(end) : null
        if (allDay !== undefined) updateData.all_day = allDay ? 'true' : 'false'
        if (color) updateData.color = color
        if (notes !== undefined) updateData.notes = notes || null

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
          allDay: updated.all_day === 'true',
          extendedProps: { calendar: updated.color, notes: (updated as { notes?: string | null }).notes ?? '' },
        })
      }

      // PostgreSQL
      const updateData: {
        title?: string
        start?: Date
        end?: Date | null
        allDay?: string
        color?: string
        notes?: string | null
        updatedAt?: Date
      } = {}
      if (title) updateData.title = title
      if (start) updateData.start = new Date(start)
      if (end !== undefined) updateData.end = end ? new Date(end) : null
      if (allDay !== undefined) updateData.allDay = allDay ? 'true' : 'false'
      if (color) updateData.color = color
      if (notes !== undefined) updateData.notes = notes || null
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
        extendedProps: { calendar: event.color, notes: (event as { notes?: string | null }).notes ?? '' },
      })
    } catch (err) {
      console.error('[calendar] Ошибка обновления события:', err)
      return reply.status(500).send({ error: 'Ошибка сервера' })
    }
  })

  async function deleteCalendarEventById(
    userId: string,
    idRaw: string,
    reply: FastifyReply
  ): Promise<boolean> {
    const id = String(idRaw ?? '').trim()
    if (!id) {
      reply.status(400).send({ error: 'Не указан id события' })
      return false
    }
    if (useFileStore) {
      reply.status(501).send({ error: 'Файловое хранилище не поддерживает календарь' })
      return false
    }
    if (useMysql) {
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) {
        reply.status(401).send({ error: 'Не авторизован' })
        return false
      }
      const idNum = parseMysqlId(id)
      if (idNum === null) {
        reply.status(400).send({ error: 'Неверный формат id события (ожидается целое число)' })
        return false
      }
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      await mysqlDb.delete(mysqlSchema.notifications).where(and(eq(mysqlSchema.notifications.user_id, userIdNum), eq(mysqlSchema.notifications.type, 'calendar'), eq(mysqlSchema.notifications.source_id, id)))
      const result = await mysqlDb
        .delete(mysqlSchema.calendarEvents)
        .where(and(eq(mysqlSchema.calendarEvents.id, idNum), eq(mysqlSchema.calendarEvents.user_id, userIdNum)))
      const raw = result as unknown as { affectedRows?: number } | [{ affectedRows?: number }]
      const affected = Array.isArray(raw) ? (raw[0]?.affectedRows ?? 0) : (raw?.affectedRows ?? 0)
      if (affected === 0) {
        reply.status(404).send({ error: 'Событие не найдено' })
        return false
      }
      reply.status(204).send()
      return true
    }
    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    await pgDb.delete(pgSchema.notifications).where(and(eq(pgSchema.notifications.userId, userId), eq(pgSchema.notifications.type, 'calendar'), eq(pgSchema.notifications.sourceId, id)))
    const deleted = await pgDb
      .delete(pgSchema.calendarEvents)
      .where(and(eq(pgSchema.calendarEvents.id, id), eq(pgSchema.calendarEvents.userId, userId)))
      .returning({ id: pgSchema.calendarEvents.id })
    if (deleted.length === 0) {
      reply.status(404).send({ error: 'Событие не найдено' })
      return false
    }
    reply.status(204).send()
    return true
  }

  // Удалить событие: GET (как у уведомлений — надёжно работает за прокси)
  app.get<{ Params: { id?: string } }>(
    '/api/calendar/events/actions/delete/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const idRaw = req.params?.id ?? ''
      try {
        await deleteCalendarEventById(userId, idRaw, reply)
      } catch (err) {
        console.error('[calendar] Ошибка удаления события:', err)
        return reply.status(500).send({ error: 'Ошибка сервера' })
      }
    }
  )

  // Удалить событие: DELETE (оставляем для совместимости)
  app.delete<{ Params: { id?: string } }>(
    '/api/calendar/events/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      let id = getIdFromDeleteRequest(req)
      try {
        if (id.includes('%')) id = decodeURIComponent(id)
      } catch {
        // оставляем id как есть при ошибке декодирования
      }
      try {
        await deleteCalendarEventById(userId, id, reply)
      } catch (err) {
        console.error('[calendar] Ошибка удаления события:', err)
        return reply.status(500).send({ error: 'Ошибка сервера' })
      }
    }
  )

  // Периодическая проверка истекших событий по дате/времени окончания (уведомления создаются в момент истечения)
  async function checkExpiredEventsAndNotify() {
    if (useFileStore) return
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    if (useMysql) {
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const withEnd = await mysqlDb.query.calendarEvents.findMany({
        where: and(
          isNotNull(mysqlSchema.calendarEvents.end),
          lt(mysqlSchema.calendarEvents.end, now),
          gte(mysqlSchema.calendarEvents.end, oneHourAgo)
        ),
        columns: { id: true, user_id: true, title: true, start: true, end: true },
      })
      const withoutEnd = await mysqlDb.query.calendarEvents.findMany({
        where: and(
          isNull(mysqlSchema.calendarEvents.end),
          lt(mysqlSchema.calendarEvents.start, now),
          gte(mysqlSchema.calendarEvents.start, oneHourAgo)
        ),
        columns: { id: true, user_id: true, title: true, start: true, end: true },
      })
      const expired = [...withEnd, ...withoutEnd]
      for (const e of expired) {
        const eventEnd = e.end ? new Date(e.end) : new Date(e.start)
        const existing = await mysqlDb.query.notifications.findFirst({
          where: and(
            eq(mysqlSchema.notifications.user_id, e.user_id),
            eq(mysqlSchema.notifications.type, 'calendar'),
            eq(mysqlSchema.notifications.source_id, String(e.id))
          ),
        })
        if (!existing) {
          try {
            const message = `Событие "${e.title}" истекло (${eventEnd.toLocaleString('ru-RU')})`
            await mysqlDb.insert(mysqlSchema.notifications).values({
              user_id: e.user_id,
              title: 'Истекшее событие в календаре',
              message,
              type: 'calendar',
              source_id: String(e.id),
            })
          } catch (err) {
            console.error('[calendar] Ошибка уведомления об истекшем событии:', err)
          }
        }
      }
      return
    }

    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    const withEnd = await pgDb.query.calendarEvents.findMany({
      where: and(
        isNotNull(pgSchema.calendarEvents.end),
        lt(pgSchema.calendarEvents.end, now),
        gte(pgSchema.calendarEvents.end, oneHourAgo)
      ),
      columns: { id: true, userId: true, title: true, start: true, end: true },
    })
    const withoutEnd = await pgDb.query.calendarEvents.findMany({
      where: and(
        isNull(pgSchema.calendarEvents.end),
        lt(pgSchema.calendarEvents.start, now),
        gte(pgSchema.calendarEvents.start, oneHourAgo)
      ),
      columns: { id: true, userId: true, title: true, start: true, end: true },
    })
    const expired = [...withEnd, ...withoutEnd]
    for (const e of expired) {
      const eventEnd = e.end ? new Date(e.end) : new Date(e.start)
      const existing = await pgDb.query.notifications.findFirst({
        where: and(
          eq(pgSchema.notifications.userId, e.userId),
          eq(pgSchema.notifications.type, 'calendar'),
          eq(pgSchema.notifications.sourceId, e.id)
        ),
      })
      if (!existing) {
        try {
          const message = `Событие "${e.title}" истекло (${eventEnd.toLocaleString('ru-RU')})`
          await pgDb.insert(pgSchema.notifications).values({
            userId: e.userId,
            title: 'Истекшее событие в календаре',
            message,
            type: 'calendar',
            sourceId: e.id,
          })
        } catch (err) {
          console.error('[calendar] Ошибка уведомления об истекшем событии:', err)
        }
      }
    }
  }

  const EXPIRED_CHECK_INTERVAL_MS = 60 * 1000
  setInterval(() => {
    checkExpiredEventsAndNotify().catch((err) =>
      console.error('[calendar] Проверка истекших событий:', err)
    )
  }, EXPIRED_CHECK_INTERVAL_MS)
  checkExpiredEventsAndNotify().catch((err) =>
    console.error('[calendar] Первый запуск проверки истекших событий:', err)
  )
}
