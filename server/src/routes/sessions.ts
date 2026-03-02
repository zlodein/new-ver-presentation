import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import { eq, and, ne } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { getGeoByIp, parseBrowserFromUserAgent, parseOsFromUserAgent } from '../services/sessions.js'

export interface SessionItem {
  id: string
  sessionId: string
  browser: string
  os: string
  country?: string
  city?: string
  lat?: number
  lng?: number
  ip?: string
  createdAt: string
  isCurrent?: boolean
}

function getClientIp(req: FastifyRequest): string {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ''
  return ip || ''
}

function getClientUserAgent(req: FastifyRequest): string {
  return (req.headers['user-agent'] as string) || ''
}

export async function sessionRoutes(app: FastifyInstance) {
  /** GET /api/auth/sessions — список активных сессий пользователя */
  app.get('/api/auth/sessions', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string; sid?: string }
      const userId = payload.sub
      const currentSid = payload.sid

      if (useFileStore) {
        return reply.send({ sessions: [], message: 'Сессии не отслеживаются при файловом хранилище' })
      }

      if (useMysql) {
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const rows = await mysqlDb.query.userSessions.findMany({
          where: eq(mysqlSchema.userSessions.user_id, Number(userId)),
          columns: { id: true, session_id: true, user_agent: true, country: true, city: true, lat: true, lng: true, ip: true, created_at: true },
          orderBy: (s, { desc }) => [desc(s.created_at)],
        })

        const sessions: SessionItem[] = rows.map((r) => {
          const browser = parseBrowserFromUserAgent(r.user_agent ?? undefined)
          const os = parseOsFromUserAgent(r.user_agent ?? undefined)
          return {
            id: String(r.id),
            sessionId: r.session_id,
            browser,
            os,
            country: r.country ?? undefined,
            city: r.city ?? undefined,
            lat: r.lat ? Number(r.lat) : undefined,
            lng: r.lng ? Number(r.lng) : undefined,
            ip: r.ip ?? undefined,
            createdAt: (r.created_at as Date).toISOString(),
            isCurrent: currentSid ? r.session_id === currentSid : false,
          }
        })
        return reply.send({ sessions })
      }

      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const rows = await pgDb.query.userSessions.findMany({
        where: eq(pgSchema.userSessions.userId, userId),
        columns: { id: true, sessionId: true, userAgent: true, country: true, city: true, lat: true, lng: true, ip: true, createdAt: true },
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      })

      const sessions: SessionItem[] = rows.map((r) => {
        const browser = parseBrowserFromUserAgent(r.userAgent ?? undefined)
        const os = parseOsFromUserAgent(r.userAgent ?? undefined)
        return {
          id: r.id,
          sessionId: r.sessionId,
          browser,
          os,
          country: r.country ?? undefined,
          city: r.city ?? undefined,
          lat: r.lat ? Number(r.lat) : undefined,
          lng: r.lng ? Number(r.lng) : undefined,
          ip: r.ip ?? undefined,
          createdAt: (r.createdAt as Date).toISOString(),
          isCurrent: currentSid ? r.sessionId === currentSid : false,
        }
      })
      return reply.send({ sessions })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка при получении сессий' })
    }
  })

  /** POST /api/auth/sessions/logout-all — выход со всех устройств кроме текущего */
  app.post('/api/auth/sessions/logout-all', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string; sid?: string }
      const userId = payload.sub
      const currentSid = payload.sid

      if (useFileStore) {
        return reply.status(501).send({ error: 'Выход со всех устройств не поддерживается при файловом хранилище' })
      }

      if (useMysql) {
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        if (currentSid) {
          await mysqlDb.delete(mysqlSchema.userSessions).where(
            and(eq(mysqlSchema.userSessions.user_id, Number(userId)), ne(mysqlSchema.userSessions.session_id, currentSid))
          )
        } else {
          await mysqlDb.delete(mysqlSchema.userSessions).where(eq(mysqlSchema.userSessions.user_id, Number(userId)))
        }
      } else {
        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        if (currentSid) {
          await pgDb.delete(pgSchema.userSessions).where(
            and(eq(pgSchema.userSessions.userId, userId), ne(pgSchema.userSessions.sessionId, currentSid))
          )
        } else {
          await pgDb.delete(pgSchema.userSessions).where(eq(pgSchema.userSessions.userId, userId))
        }
      }

      return reply.send({ success: true, message: 'Вы вышли со всех других устройств' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка при выходе' })
    }
  })
}

/** Создать сессию и вернуть payload для JWT (sid) */
export async function createSession(
  req: FastifyRequest,
  userId: string,
  reply: FastifyReply
): Promise<{ sessionId: string }> {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const ip = getClientIp(req)
  const userAgent = getClientUserAgent(req)

  let geo: Awaited<ReturnType<typeof getGeoByIp>> = null
  try {
    geo = await getGeoByIp(ip)
  } catch {
    // ignore
  }

  if (useMysql && db) {
    const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
    try {
      await mysqlDb.insert(mysqlSchema.userSessions).values({
        user_id: Number(userId),
        session_id: sessionId,
        user_agent: userAgent || null,
        ip: ip || null,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        lat: geo?.lat != null ? String(geo.lat) : null,
        lng: geo?.lon != null ? String(geo.lon) : null,
      })
    } catch (err) {
      // Таблица может не существовать — не блокируем логин
      req.log.warn?.(err, 'Не удалось создать сессию (таблица user_sessions?)')
    }
  } else if (!useFileStore && db) {
    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    try {
      await pgDb.insert(pgSchema.userSessions).values({
        userId,
        sessionId,
        userAgent: userAgent || null,
        ip: ip || null,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        lat: geo?.lat != null ? String(geo.lat) : null,
        lng: geo?.lon != null ? String(geo.lon) : null,
      })
    } catch (err) {
      req.log.warn?.(err, 'Не удалось создать сессию (таблица user_sessions?)')
    }
  }

  return { sessionId }
}
