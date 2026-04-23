import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { and, eq, isNull } from 'drizzle-orm'
import { db, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { getPushPublicKey } from '../services/push.js'

export async function pushRoutes(app: FastifyInstance) {
  const getAuth = (req: FastifyRequest) => req.user as { sub: string; sid?: string }

  app.get('/api/push/public-key', { preHandler: [app.authenticate] }, async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ publicKey: getPushPublicKey() })
  })

  app.get('/api/push/subscriptions', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    if (useFileStore || !db) return reply.send({ subscriptions: [] })
    const { sub } = getAuth(req)
    if (useMysql) {
      const uid = Number(sub)
      if (Number.isNaN(uid)) return reply.send({ subscriptions: [] })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const rows = await mysqlDb.query.userPushSubscriptions.findMany({
        where: and(eq(mysqlSchema.userPushSubscriptions.user_id, uid), isNull(mysqlSchema.userPushSubscriptions.revoked_at)),
      })
      return reply.send({ subscriptions: rows })
    }
    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    const rows = await pgDb.query.userPushSubscriptions.findMany({
      where: and(eq(pgSchema.userPushSubscriptions.userId, sub), isNull(pgSchema.userPushSubscriptions.revokedAt)),
    })
    return reply.send({ subscriptions: rows })
  })

  app.post<{
    Body: { platform: 'web' | 'ios' | 'android'; endpoint?: string; token?: string; p256dh?: string; auth?: string; appVersion?: string }
  }>('/api/push/subscribe', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { platform: 'web' | 'ios' | 'android'; endpoint?: string; token?: string; p256dh?: string; auth?: string; appVersion?: string } }>, reply: FastifyReply) => {
    if (useFileStore || !db) return reply.status(501).send({ error: 'Push недоступен в file-store' })
    const authUser = getAuth(req)
    const body = req.body
    if (!authUser.sid) return reply.status(400).send({ error: 'Session id is required' })
    if (!body?.platform) return reply.status(400).send({ error: 'Platform is required' })
    if (body.platform === 'web' && (!body.endpoint || !body.p256dh || !body.auth)) {
      return reply.status(400).send({ error: 'Для web нужны endpoint, p256dh и auth' })
    }
    if ((body.platform === 'ios' || body.platform === 'android') && !body.token) {
      return reply.status(400).send({ error: 'Для mobile нужен token' })
    }
    if (useMysql) {
      const uid = Number(authUser.sub)
      if (Number.isNaN(uid)) return reply.status(401).send({ error: 'Не авторизован' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      await mysqlDb.insert(mysqlSchema.userPushSubscriptions).values({
        user_id: uid,
        session_id: authUser.sid,
        platform: body.platform,
        endpoint: body.endpoint ?? null,
        token: body.token ?? null,
        p256dh: body.p256dh ?? null,
        auth: body.auth ?? null,
        app_version: body.appVersion ?? null,
        user_agent: String(req.headers['user-agent'] || ''),
      })
      return reply.send({ ok: true })
    }
    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    await pgDb.insert(pgSchema.userPushSubscriptions).values({
      userId: authUser.sub,
      sessionId: authUser.sid,
      platform: body.platform,
      endpoint: body.endpoint ?? null,
      token: body.token ?? null,
      p256dh: body.p256dh ?? null,
      auth: body.auth ?? null,
      appVersion: body.appVersion ?? null,
      userAgent: String(req.headers['user-agent'] || ''),
    })
    return reply.send({ ok: true })
  })

  app.delete<{
    Body: { endpoint?: string; token?: string }
  }>('/api/push/unsubscribe', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { endpoint?: string; token?: string } }>, reply: FastifyReply) => {
    if (useFileStore || !db) return reply.send({ ok: true })
    const authUser = getAuth(req)
    if (useMysql) {
      const uid = Number(authUser.sub)
      if (Number.isNaN(uid)) return reply.send({ ok: true })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      if (req.body?.endpoint) {
        await mysqlDb.update(mysqlSchema.userPushSubscriptions).set({ revoked_at: new Date() }).where(and(eq(mysqlSchema.userPushSubscriptions.user_id, uid), eq(mysqlSchema.userPushSubscriptions.endpoint, req.body.endpoint)))
      } else if (req.body?.token) {
        await mysqlDb.update(mysqlSchema.userPushSubscriptions).set({ revoked_at: new Date() }).where(and(eq(mysqlSchema.userPushSubscriptions.user_id, uid), eq(mysqlSchema.userPushSubscriptions.token, req.body.token)))
      } else if (authUser.sid) {
        await mysqlDb.update(mysqlSchema.userPushSubscriptions).set({ revoked_at: new Date() }).where(and(eq(mysqlSchema.userPushSubscriptions.user_id, uid), eq(mysqlSchema.userPushSubscriptions.session_id, authUser.sid)))
      }
      return reply.send({ ok: true })
    }
    const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
    if (req.body?.endpoint) {
      await pgDb.update(pgSchema.userPushSubscriptions).set({ revokedAt: new Date() }).where(and(eq(pgSchema.userPushSubscriptions.userId, authUser.sub), eq(pgSchema.userPushSubscriptions.endpoint, req.body.endpoint)))
    } else if (req.body?.token) {
      await pgDb.update(pgSchema.userPushSubscriptions).set({ revokedAt: new Date() }).where(and(eq(pgSchema.userPushSubscriptions.userId, authUser.sub), eq(pgSchema.userPushSubscriptions.token, req.body.token)))
    } else if (authUser.sid) {
      await pgDb.update(pgSchema.userPushSubscriptions).set({ revokedAt: new Date() }).where(and(eq(pgSchema.userPushSubscriptions.userId, authUser.sub), eq(pgSchema.userPushSubscriptions.sessionId, authUser.sid)))
    }
    return reply.send({ ok: true })
  })
}
