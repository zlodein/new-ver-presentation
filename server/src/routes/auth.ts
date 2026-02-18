import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { eq, and, gt, ne } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const __filenameAuth = fileURLToPath(import.meta.url)
const __dirnameAuth = path.dirname(__filenameAuth)
import { db, schema, isSqlite, useFileStore, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

const SALT_ROUNDS = 10
const SERVER_ERR = 'Ошибка сервера. При использовании файлового хранилища проверьте папку server/data.'
function getDbErr(): string {
  const url = process.env.DATABASE_URL ?? ''
  if (url.startsWith('mysql')) {
    return 'Ошибка сервера. Проверьте: MySQL запущен, в server/.env задан DATABASE_URL=mysql://..., база и таблицы созданы (server/sql/e_presentati_schema.sql). Точная причина — в логах бэкенда.'
  }
  if (url.startsWith('postgres')) {
    return 'Ошибка сервера. Проверьте подключение к PostgreSQL и наличие таблиц (см. server/README.md). Точная причина — в логах бэкенда.'
  }
  return 'Ошибка сервера. В server/.env задайте DATABASE_URL: для MySQL — mysql://user:pass@host:3306/e_presentati (таблицы — server/sql/). Точная причина — в логах бэкенда.'
}

/** Признак ошибки "колонка не существует" в MySQL */
function isUnknownColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /Unknown column|doesn't exist/i.test(msg)
}

/** Базовый URL бэкенда (для redirect_uri OAuth). Например https://api.example.com или http://localhost:3001 */
const SITE_URL = (process.env.SITE_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '')
/** URL фронтенда (редирект после успешного OAuth). Например https://example.com или http://localhost:5173 */
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

const oauthConfig = {
  yandex: {
    clientId: process.env.OAUTH_YANDEX_CLIENT_ID,
    clientSecret: process.env.OAUTH_YANDEX_CLIENT_SECRET,
    authUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.ru/token',
    userInfoUrl: 'https://login.yandex.ru/info',
    scope: 'login:email login:info login:avatar',
  },
  vk: {
    clientId: process.env.OAUTH_VK_CLIENT_ID,
    clientSecret: process.env.OAUTH_VK_CLIENT_SECRET,
    authUrl: 'https://id.vk.ru/authorize',
    tokenUrl: 'https://id.vk.ru/oauth2/token',
    userInfoUrl: 'https://id.vk.ru/oauth2/user_info',
    scope: 'vkid.personal_info email',
  },
} as const

type OAuthProvider = keyof typeof oauthConfig

export async function authRoutes(app: FastifyInstance) {
  // ——— OAuth: редирект на провайдера ———
  app.get<{ Params: { provider: string } }>('/api/auth/oauth/:provider', async (req: FastifyRequest<{ Params: { provider: string } }>, reply: FastifyReply) => {
    const provider = req.params.provider as OAuthProvider
    if (provider !== 'yandex' && provider !== 'vk') {
      return reply.status(400).send({ error: 'Неизвестный OAuth провайдер' })
    }
    const cfg = oauthConfig[provider]
    if (!cfg.clientId) {
      req.log.warn({ provider }, 'OAuth: не заданы client_id')
      return reply.status(502).redirect(`${FRONTEND_URL}/signin?error=oauth_not_configured`)
    }
    const redirectUri = `${SITE_URL}/api/auth/oauth/callback?provider=${provider}`
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: redirectUri,
      scope: cfg.scope,
    })
    const authUrl = `${cfg.authUrl}?${params.toString()}`
    return reply.redirect(authUrl, 302)
  })

  // ——— OAuth: callback от провайдера, обмен code на токен, создание/поиск пользователя, редирект на фронт с JWT ———
  app.get<{ Querystring: { provider?: string; code?: string; error?: string } }>('/api/auth/oauth/callback', async (req: FastifyRequest<{ Querystring: { provider?: string; code?: string; error?: string } }>, reply: FastifyReply) => {
    const { provider: rawProvider, code, error: oauthError } = req.query
    if (oauthError) {
      return reply.redirect(`${FRONTEND_URL}/signin?error=oauth_cancelled`, 302)
    }
    const provider = rawProvider as OAuthProvider
    if (provider !== 'yandex' && provider !== 'vk') {
      return reply.redirect(`${FRONTEND_URL}/signin?error=unknown_provider`, 302)
    }
    if (!code) {
      return reply.redirect(`${FRONTEND_URL}/signin?error=missing_code`, 302)
    }
    const cfg = oauthConfig[provider]
    if (!cfg.clientId || !cfg.clientSecret) {
      return reply.redirect(`${FRONTEND_URL}/signin?error=oauth_not_configured`, 302)
    }
    const redirectUri = `${SITE_URL}/api/auth/oauth/callback?provider=${provider}`

    let accessToken: string
    let email: string
    let name: string | null = null
    let lastName: string | null = null

    try {
      const tokenRes = await fetch(cfg.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: cfg.clientId,
          client_secret: cfg.clientSecret,
          redirect_uri: redirectUri,
        }).toString(),
      })
      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        req.log.warn({ provider, status: tokenRes.status, body: errText }, 'OAuth token exchange failed')
        return reply.redirect(`${FRONTEND_URL}/signin?error=token_exchange_failed`, 302)
      }
      const tokenData = (await tokenRes.json()) as { access_token?: string }
      const rawToken = tokenData.access_token
      if (!rawToken) {
        return reply.redirect(`${FRONTEND_URL}/signin?error=no_access_token`, 302)
      }
      accessToken = rawToken

      const userRes = await fetch(cfg.userInfoUrl, {
        headers: { Authorization: provider === 'yandex' ? `Oauth ${accessToken}` : `Bearer ${accessToken}` },
      })
      if (!userRes.ok) {
        req.log.warn({ provider, status: userRes.status }, 'OAuth user info failed')
        return reply.redirect(`${FRONTEND_URL}/signin?error=user_info_failed`, 302)
      }
      const userData = (await userRes.json()) as Record<string, unknown>

      if (provider === 'yandex') {
        const emails = userData.emails as string[] | undefined
        email = (userData.default_email as string) || (emails?.[0]) || ''
        const firstName = userData.real_name as string | undefined
        if (firstName) {
          const parts = firstName.trim().split(/\s+/)
          name = parts[0] ?? null
          lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
        }
      } else {
        email = (userData.email as string) || (userData.phone as string) || ''
        if (!email && (userData.user_id as string)) {
          email = `vk_${userData.user_id}@vk.placeholder`
        }
        const firstName = userData.first_name as string | undefined
        const ln = userData.last_name as string | undefined
        name = firstName ?? null
        lastName = ln ?? null
      }

      if (!email) {
        return reply.redirect(`${FRONTEND_URL}/signin?error=email_required`, 302)
      }
    } catch (err) {
      req.log.error(err)
      return reply.redirect(`${FRONTEND_URL}/signin?error=oauth_failed`, 302)
    }

    const normalizedEmail = email.trim().toLowerCase()
    let userId: string

    if (useFileStore) {
      let user = fileStore.findUserByEmail(normalizedEmail)
      if (!user) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS)
        user = fileStore.createUser({
          email: normalizedEmail,
          passwordHash,
          firstName: name || undefined,
          lastName: lastName || undefined,
        })
      }
      userId = user.id
    } else if (useMysql && db) {
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      let user = await mysqlDb.query.users.findFirst({
        where: eq(mysqlSchema.users.email, normalizedEmail),
        columns: { id: true },
      })
      if (!user) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS)
        const inserted = await mysqlDb.insert(mysqlSchema.users).values({
          email: normalizedEmail,
          password: passwordHash,
          name: name || '',
          last_name: lastName,
        }).$returningId()
        const insertedArr = inserted as { id: number }[] | { id: number }
        const newId = Array.isArray(insertedArr) ? insertedArr[0]?.id : insertedArr?.id
        if (newId == null) {
          return reply.redirect(`${FRONTEND_URL}/signin?error=create_user_failed`, 302)
        }
        userId = String(newId)
      } else {
        userId = String(user.id)
      }
    } else if (db) {
      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      let user = await pgDb.query.users.findFirst({
        where: eq(pgSchema.users.email, normalizedEmail),
        columns: { id: true },
      })
      if (!user) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS)
        const [inserted] = await pgDb.insert(pgSchema.users).values({
          email: normalizedEmail,
          passwordHash,
          firstName: name,
          lastName: lastName,
        }).returning({ id: pgSchema.users.id })
        if (!inserted) {
          return reply.redirect(`${FRONTEND_URL}/signin?error=create_user_failed`, 302)
        }
        userId = inserted.id
      } else {
        userId = user.id
      }
    } else {
      return reply.redirect(`${FRONTEND_URL}/signin?error=no_database`, 302)
    }

    const token = await reply.jwtSign({ sub: userId, email: normalizedEmail }, { expiresIn: '7d' })
    return reply.redirect(`${FRONTEND_URL}/signin?token=${encodeURIComponent(token)}`, 302)
  })

  app.post<{
    Body: { email: string; password: string; name?: string; last_name?: string; middle_name?: string; user_img?: string }
  }>('/api/auth/register', async (req: FastifyRequest<{ Body: { email: string; password: string; name?: string; last_name?: string; middle_name?: string; user_img?: string } }>, reply: FastifyReply) => {
    try {
      const { email, password, name, last_name, middle_name, user_img } = req.body
      // Для обратной совместимости
      const firstName = name || (req.body as any).firstName
      const lastName = last_name || (req.body as any).lastName
      if (!email?.trim() || !password) {
        return reply.status(400).send({ error: 'Email и пароль обязательны' })
      }
      const normalizedEmail = email.trim().toLowerCase()
      if (useFileStore) {
        const existing = fileStore.findUserByEmail(normalizedEmail)
        if (existing) {
          return reply.status(409).send({ error: 'Пользователь с таким email уже зарегистрирован' })
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
        const user = fileStore.createUser({
          email: normalizedEmail,
          passwordHash,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
        })
        const token = await reply.jwtSign({ sub: user.id, email: user.email }, { expiresIn: '7d' })
        return reply.send({
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
          token,
        })
      }
      let existing: { id: unknown } | undefined
      if (useMysql) {
        existing = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
          where: eq(mysqlSchema.users.email, normalizedEmail),
          columns: { id: true },
        })
      } else {
        existing = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
          where: eq(pgSchema.users.email, normalizedEmail),
          columns: { id: true },
        })
      }
      if (existing) {
        return reply.status(409).send({ error: 'Пользователь с таким email уже зарегистрирован' })
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
      if (useMysql) {
        const inserted = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).insert(mysqlSchema.users).values({
          email: normalizedEmail,
          password: passwordHash,
          name: name?.trim() || firstName?.trim() || '',
          last_name: last_name?.trim() || lastName?.trim() || null,
          middle_name: middle_name?.trim() || null,
          user_img: user_img?.trim() || null,
        }).$returningId()
        const newId = Array.isArray(inserted) ? (inserted as { id: number }[])[0]?.id : (inserted as { id: number })?.id
        if (newId == null) return reply.status(500).send({ error: 'Ошибка при создании пользователя' })
        const token = await reply.jwtSign({ sub: String(newId), email: normalizedEmail }, { expiresIn: '7d' })
        return reply.send({
          user: { 
            id: String(newId), 
            email: normalizedEmail, 
            name: name?.trim() || firstName?.trim() || null,
            last_name: last_name?.trim() || lastName?.trim() || null,
            middle_name: middle_name?.trim() || null,
            user_img: user_img?.trim() || null,
            // Для обратной совместимости
            firstName: name?.trim() || firstName?.trim() || null,
            lastName: last_name?.trim() || lastName?.trim() || null,
          },
          token,
        })
      }
      const [user] = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>)
        .insert(pgSchema.users)
        .values({
          email: normalizedEmail,
          passwordHash,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
        })
        .returning({ id: pgSchema.users.id, email: pgSchema.users.email, firstName: pgSchema.users.firstName, lastName: pgSchema.users.lastName })
      if (!user) {
        return reply.status(500).send({ error: 'Ошибка при создании пользователя' })
      }
      const token = await reply.jwtSign({ sub: user.id, email: user.email }, { expiresIn: '7d' })
      return reply.send({
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token,
      })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
      })
    }
  })

  app.post<{ Body: { email: string; password: string } }>('/api/auth/login', async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body
      if (!email?.trim() || !password) {
        return reply.status(400).send({ error: 'Email и пароль обязательны' })
      }
      const normalizedEmail = email.trim().toLowerCase()
      if (useFileStore) {
        const user = fileStore.findUserByEmail(normalizedEmail)
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return reply.status(401).send({ error: 'Неверный email или пароль' })
        }
        const token = await reply.jwtSign({ sub: user.id, email: user.email }, { expiresIn: '7d' })
        return reply.send({
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
          token,
        })
      }
      if (useMysql) {
        const user = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
          where: eq(mysqlSchema.users.email, normalizedEmail),
          columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, password: true, is_active: true },
        })
        if (!user || (user as { is_active?: number }).is_active === 0) {
          return reply.status(401).send({ error: 'Неверный email или пароль' })
        }
        if (!(await bcrypt.compare(password, user.password))) {
          return reply.status(401).send({ error: 'Неверный email или пароль' })
        }
        try {
          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .update(mysqlSchema.users)
            .set({ last_login_at: new Date(), updated_at: new Date() })
            .where(eq(mysqlSchema.users.id, user.id))
        } catch (err) {
          if (!isUnknownColumnError(err)) req.log.warn(err, 'Не удалось обновить last_login_at')
        }
        const token = await reply.jwtSign({ sub: String(user.id), email: user.email }, { expiresIn: '7d' })
        const messengersData = user.messengers ? (typeof user.messengers === 'string' ? JSON.parse(user.messengers) : user.messengers) : null
        
        return reply.send({
          user: { 
            id: String(user.id), 
            email: user.email, 
            name: user.name,
            last_name: user.last_name,
            middle_name: user.middle_name,
            user_img: user.user_img,
            personal_phone: user.personal_phone,
            position: user.position,
            messengers: messengersData,
            // Для обратной совместимости
            firstName: user.name, 
            lastName: user.last_name 
          },
          token,
        })
      }
      const user = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
        where: eq(pgSchema.users.email, normalizedEmail),
        columns: { id: true, email: true, firstName: true, lastName: true, passwordHash: true },
      })
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.status(401).send({ error: 'Неверный email или пароль' })
      }
      const token = await reply.jwtSign({ sub: user.id, email: user.email }, { expiresIn: '7d' })
      const { passwordHash: _, ...safe } = user
      return reply.send({ user: safe, token })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
      })
    }
  })

  app.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string; email: string }
      if (useFileStore) {
        const user = fileStore.findUserById(payload.sub)
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        return reply.send({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, createdAt: user.createdAt })
      }
      if (useMysql) {
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) return reply.status(401).send({ error: 'Пользователь не найден' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const baseColumns = { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, presentation_display_preferences: true, role_id: true, created_at: true, tariff: true, test_drive_used: true }
        const expertColumns = { expert_plan_quantity: true, expert_presentations_used: true }
        const workColumns = { workplace: true, work_position: true, company_logo: true, work_email: true, work_phone: true, work_website: true }
        let user: Record<string, unknown> | null = null
        try {
          user = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, userId),
            columns: { ...baseColumns, ...expertColumns, ...workColumns },
          }) as Record<string, unknown> | null
        } catch (err) {
          if (isUnknownColumnError(err)) {
            try {
              user = await mysqlDb.query.users.findFirst({
                where: eq(mysqlSchema.users.id, userId),
                columns: { ...baseColumns, ...workColumns },
              }) as Record<string, unknown> | null
            } catch (err2) {
              if (isUnknownColumnError(err2)) {
                const baseColumnsNoRole = { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, created_at: true }
                user = await mysqlDb.query.users.findFirst({
                  where: eq(mysqlSchema.users.id, userId),
                  columns: { ...baseColumnsNoRole, ...workColumns },
                }) as Record<string, unknown> | null
              } else throw err2
            }
          } else throw err
        }
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        
        const messengersData = user.messengers ? (typeof user.messengers === 'string' ? JSON.parse(user.messengers as string) : user.messengers) : null
        const prefsData = user.presentation_display_preferences != null && user.presentation_display_preferences !== ''
          ? (typeof user.presentation_display_preferences === 'string' ? JSON.parse(user.presentation_display_preferences as string) : user.presentation_display_preferences)
          : null
        const testDriveUsed = (user.test_drive_used === 'true' || user.test_drive_used === true) ?? false

        return reply.send({
          id: String(user.id),
          email: user.email,
          name: user.name,
          last_name: user.last_name,
          middle_name: user.middle_name,
          user_img: user.user_img,
          personal_phone: user.personal_phone,
          position: user.position,
          messengers: messengersData,
          presentation_display_preferences: prefsData ?? undefined,
          company_name: user.workplace ?? undefined,
          work_position: user.work_position ?? undefined,
          company_logo: user.company_logo ?? undefined,
          work_email: user.work_email ?? undefined,
          work_phone: user.work_phone ?? undefined,
          work_website: user.work_website ?? undefined,
          role_id: user.role_id != null ? Number(user.role_id) : undefined,
          tariff: user.tariff != null && user.tariff !== '' ? user.tariff : undefined,
          testDriveUsed,
          expertPlanQuantity: user.expert_plan_quantity != null ? Number(user.expert_plan_quantity) : 1,
          expertPresentationsUsed: user.expert_presentations_used != null ? Number(user.expert_presentations_used) : 0,
          createdAt: user.created_at,
          firstName: user.name,
          lastName: user.last_name,
        })
      }
      const user = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
        where: eq(pgSchema.users.id, payload.sub),
        columns: { id: true, email: true, firstName: true, lastName: true, createdAt: true, tariff: true, testDriveUsed: true, expertPlanQuantity: true, expertPresentationsUsed: true },
      })
      if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
      const { testDriveUsed: tdu, expertPlanQuantity: eqty, expertPresentationsUsed: eused, ...rest } = user
      const planQty = eqty != null && eqty !== '' ? Math.max(1, Math.min(100, Number(eqty) || 1)) : 1
      const usedCount = eused != null && eused !== '' ? Math.max(0, Number(eused) || 0) : 0
      return reply.send({
        ...rest,
        tariff: user.tariff ?? undefined,
        testDriveUsed: tdu === 'true',
        expertPlanQuantity: planQty,
        expertPresentationsUsed: usedCount,
      })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
      })
    }
  })

  app.patch<{ Body: { tariff: string; quantity?: number } }>('/api/auth/tariff', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { tariff: string; quantity?: number } }>, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string }
      const tariff = req.body?.tariff
      const quantity = req.body?.quantity != null ? Math.max(1, Math.min(100, Math.floor(Number(req.body.quantity)) || 1)) : undefined
      if (tariff !== 'test_drive' && tariff !== 'expert') {
        return reply.status(400).send({ error: 'Укажите тариф: test_drive или expert' })
      }
      if (useFileStore) {
        return reply.status(501).send({ error: 'Выбор тарифа при файловом хранилище не реализован' })
      }
      if (useMysql) {
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) return reply.status(401).send({ error: 'Пользователь не найден' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        let user: { id: number; tariff: string | null; test_drive_used: string; expert_plan_quantity?: number | null } | null = null
        try {
          user = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, userId),
            columns: { id: true, tariff: true, test_drive_used: true, expert_plan_quantity: true },
          }) as { id: number; tariff: string | null; test_drive_used: string; expert_plan_quantity?: number | null } | null
        } catch (err) {
          if (isUnknownColumnError(err)) {
            return reply.status(501).send({ error: 'Таблица users не содержит колонок tariff/test_drive_used. Выполните миграцию server/sql/migrate_user_tariff.sql' })
          }
          throw err
        }
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        if (tariff === 'test_drive' && user.test_drive_used === 'true') {
          return reply.status(400).send({ error: 'Тест драйв доступен только один раз' })
        }
        const updates: { tariff: string; test_drive_used?: string; expert_plan_quantity?: number } = { tariff }
        if (tariff === 'expert' && user.tariff === 'test_drive') {
          updates.test_drive_used = 'true'
        }
        if (tariff === 'expert' && quantity != null) {
          const current = Math.max(0, user.expert_plan_quantity ?? 0)
          updates.expert_plan_quantity = Math.min(100, current + quantity)
        }
        await mysqlDb.update(mysqlSchema.users).set(updates).where(eq(mysqlSchema.users.id, userId))
        const nextTestDriveUsed = updates.test_drive_used === 'true' || user.test_drive_used === 'true'
        const res: { tariff: string; testDriveUsed: boolean; expertPlanQuantity?: number } = { tariff, testDriveUsed: nextTestDriveUsed }
        if (updates.expert_plan_quantity != null) res.expertPlanQuantity = updates.expert_plan_quantity
        return reply.send(res)
      }
      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const user = await pgDb.query.users.findFirst({
        where: eq(pgSchema.users.id, payload.sub),
        columns: { id: true, tariff: true, testDriveUsed: true, expertPlanQuantity: true, expertPresentationsUsed: true },
      })
      if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
      if (tariff === 'test_drive' && user.testDriveUsed === 'true') {
        return reply.status(400).send({ error: 'Тест драйв доступен только один раз' })
      }
      const updates: { tariff: string; testDriveUsed?: string; expertPlanQuantity?: string } = { tariff }
      if (tariff === 'expert' && user.tariff === 'test_drive') {
        updates.testDriveUsed = 'true'
      }
      if (tariff === 'expert' && quantity != null) {
        const current = Math.max(0, Number(user.expertPlanQuantity) || 0)
        updates.expertPlanQuantity = String(Math.min(100, current + quantity))
      }
      await pgDb.update(pgSchema.users).set(updates).where(eq(pgSchema.users.id, payload.sub))
      const nextTestDriveUsed = updates.testDriveUsed === 'true' || user.testDriveUsed === 'true'
      const res: { tariff: string; testDriveUsed: boolean; expertPlanQuantity?: number } = { tariff, testDriveUsed: nextTestDriveUsed }
      if (updates.expertPlanQuantity != null) res.expertPlanQuantity = Number(updates.expertPlanQuantity)
      return reply.send(res)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера',
      })
    }
  })

  app.post<{ Body: { email: string } }>('/api/auth/forgot-password', async (req: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    try {
      const { email } = req.body
      if (!email?.trim()) {
        return reply.status(400).send({ error: 'Укажите email' })
      }
      const normalizedEmail = email.trim().toLowerCase()
      if (useFileStore) {
        const user = fileStore.findUserByEmail(normalizedEmail)
        if (!user) {
          return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
        }
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
        fileStore.createPasswordResetToken(user.id, token, expiresAt)
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
        if (process.env.NODE_ENV === 'development') {
          return reply.send({ message: 'Токен для сброса (только dev)', resetLink, token })
        }
        return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
      }
      const user = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
        where: eq(pgSchema.users.email, normalizedEmail),
        columns: { id: true },
      })
      if (!user) {
        return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
      }
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      if (useMysql) {
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).insert(mysqlSchema.passwordResetTokens).values({
          user_id: Number(user.id),
          token,
          expires_at: expiresAt,
        })
      } else {
        await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).insert(pgSchema.passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
        })
      }
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
      if (process.env.NODE_ENV === 'development') {
        return reply.send({ message: 'Токен для сброса (только dev)', resetLink, token })
      }
      return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
      })
    }
  })

  app.post<{ Body: { token: string; newPassword: string } }>('/api/auth/reset-password', async (req: FastifyRequest<{ Body: { token: string; newPassword: string } }>, reply: FastifyReply) => {
    try {
      const { token, newPassword } = req.body
      if (!token?.trim() || !newPassword || newPassword.length < 6) {
        return reply.status(400).send({ error: 'Токен и новый пароль (не менее 6 символов) обязательны' })
      }
      if (useFileStore) {
        const resetRow = fileStore.findValidResetToken(token.trim())
        if (!resetRow) {
          return reply.status(400).send({ error: 'Токен недействителен или истёк. Запросите сброс пароля снова.' })
        }
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
        fileStore.updateUser(resetRow.userId, { passwordHash, updatedAt: new Date().toISOString() })
        fileStore.deleteResetToken(resetRow.id)
        return reply.send({ message: 'Пароль успешно изменён. Войдите с новым паролем.' })
      }
      const now = new Date()
      if (useMysql) {
        const rows = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.passwordResetTokens.findMany({
          where: and(
            eq(mysqlSchema.passwordResetTokens.token, token.trim()),
            gt(mysqlSchema.passwordResetTokens.expires_at, now)
          ),
          columns: { id: true, user_id: true },
        })
        const resetRow = rows[0]
        if (!resetRow) {
          return reply.status(400).send({ error: 'Токен недействителен или истёк. Запросите сброс пароля снова.' })
        }
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).update(mysqlSchema.users).set({ password: passwordHash, updated_at: now }).where(eq(mysqlSchema.users.id, resetRow.user_id))
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).delete(mysqlSchema.passwordResetTokens).where(eq(mysqlSchema.passwordResetTokens.id, resetRow.id))
      } else {
        const rows = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.passwordResetTokens.findMany({
          where: and(
            eq(pgSchema.passwordResetTokens.token, token.trim()),
            gt(pgSchema.passwordResetTokens.expiresAt, now)
          ),
          columns: { id: true, userId: true },
        })
        const resetRow = rows[0]
        if (!resetRow) {
          return reply.status(400).send({ error: 'Токен недействителен или истёк. Запросите сброс пароля снова.' })
        }
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
        await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).update(pgSchema.users).set({ passwordHash, updatedAt: now }).where(eq(pgSchema.users.id, resetRow.userId))
        await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).delete(pgSchema.passwordResetTokens).where(eq(pgSchema.passwordResetTokens.id, resetRow.id))
      }
      return reply.send({ message: 'Пароль успешно изменён. Войдите с новым паролем.' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
      })
    }
  })

  // Обновление профиля пользователя
  app.put<{
    Body: { name?: string; last_name?: string; email?: string; personal_phone?: string; position?: string; messengers?: Record<string, string>; company_name?: string; work_position?: string; company_logo?: string; work_email?: string; work_phone?: string; work_website?: string; presentation_display_preferences?: Record<string, unknown> }
  }>('/api/auth/profile', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { name?: string; last_name?: string; email?: string; personal_phone?: string; position?: string; messengers?: Record<string, string>; company_name?: string; work_position?: string; company_logo?: string; work_email?: string; work_phone?: string; work_website?: string; presentation_display_preferences?: Record<string, unknown> } }>, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string; email: string }
      const { name, last_name, email, personal_phone, position, messengers, company_name, work_position, company_logo, work_email, work_phone, work_website, presentation_display_preferences } = req.body

      if (useFileStore) {
        const user = fileStore.findUserById(payload.sub)
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        // Обновление через fileStore (если нужно)
        return reply.status(501).send({ error: 'Обновление профиля через файловое хранилище не реализовано' })
      }

      if (useMysql) {
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) return reply.status(401).send({ error: 'Пользователь не найден' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name.trim()
        if (last_name !== undefined) updateData.last_name = last_name.trim() || null
        if (email !== undefined) {
          const normalizedEmail = email.trim().toLowerCase()
          const existing = await mysqlDb.query.users.findFirst({
            where: and(eq(mysqlSchema.users.email, normalizedEmail), ne(mysqlSchema.users.id, userId)),
            columns: { id: true },
          })
          if (existing) return reply.status(409).send({ error: 'Email уже используется другим пользователем' })
          updateData.email = normalizedEmail
        }
        if (personal_phone !== undefined) updateData.personal_phone = personal_phone.trim() || null
        if (position !== undefined) updateData.position = position.trim() || null
        if (messengers !== undefined) updateData.messengers = JSON.stringify(messengers)
        if (company_name !== undefined) updateData.workplace = (typeof company_name === 'string' ? company_name.trim() : company_name) || null
        if (work_position !== undefined) updateData.work_position = (typeof work_position === 'string' ? work_position.trim() : work_position) || null
        if (company_logo !== undefined) updateData.company_logo = (typeof company_logo === 'string' ? company_logo.trim() : company_logo) || null
        if (work_email !== undefined) updateData.work_email = (typeof work_email === 'string' ? work_email.trim() : work_email) || null
        if (work_phone !== undefined) updateData.work_phone = (typeof work_phone === 'string' ? work_phone.trim() : work_phone) || null
        if (work_website !== undefined) updateData.work_website = (typeof work_website === 'string' ? work_website.trim() : work_website) || null
        if (presentation_display_preferences !== undefined) updateData.presentation_display_preferences = JSON.stringify(presentation_display_preferences)
        updateData.updated_at = new Date()

        // При удалении логотипа/аватара — удалить файл на сервере
        const shouldDeleteCompanyLogo = company_logo !== undefined && !(typeof company_logo === 'string' && company_logo.trim())
        if (shouldDeleteCompanyLogo) {
          const current = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, userId),
            columns: { company_logo: true },
          })
          const logoPath = current?.company_logo
          if (logoPath && typeof logoPath === 'string' && logoPath.includes('/uploads/company-logo/')) {
            const filepath = path.join(__dirnameAuth, '../../', logoPath.replace(/^\//, ''))
            try {
              await fs.unlink(filepath)
            } catch {
              // Файл может отсутствовать — игнорируем
            }
          }
        }

        try {
          await mysqlDb.update(mysqlSchema.users).set(updateData).where(eq(mysqlSchema.users.id, userId))
        } catch (err) {
          if (isUnknownColumnError(err)) {
            const updateDataBase: Record<string, unknown> = {}
            if (name !== undefined) updateDataBase.name = name.trim()
            if (last_name !== undefined) updateDataBase.last_name = last_name.trim() || null
            if (email !== undefined) updateDataBase.email = (email as string).trim().toLowerCase()
            if (personal_phone !== undefined) updateDataBase.personal_phone = personal_phone.trim() || null
            if (position !== undefined) updateDataBase.position = position.trim() || null
            if (messengers !== undefined) updateDataBase.messengers = JSON.stringify(messengers)
            updateDataBase.updated_at = new Date()
            await mysqlDb.update(mysqlSchema.users).set(updateDataBase).where(eq(mysqlSchema.users.id, userId))
          } else throw err
        }

        const baseColumns = { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, presentation_display_preferences: true, role_id: true, created_at: true }
        const workColumns = { workplace: true, work_position: true, company_logo: true, work_email: true, work_phone: true, work_website: true }
        let updatedUser: Record<string, unknown> | null = null
        try {
          updatedUser = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, userId),
            columns: { ...baseColumns, ...workColumns },
          }) as Record<string, unknown> | null
        } catch (err) {
          if (isUnknownColumnError(err)) {
            updatedUser = await mysqlDb.query.users.findFirst({
              where: eq(mysqlSchema.users.id, userId),
              columns: { ...baseColumns, ...workColumns },
            }) as Record<string, unknown> | null
          } else throw err
        }
        if (!updatedUser) return reply.status(401).send({ error: 'Пользователь не найден' })

        const messengersData = updatedUser.messengers ? (typeof updatedUser.messengers === 'string' ? JSON.parse(updatedUser.messengers as string) : updatedUser.messengers) : null
        const prefsData = updatedUser.presentation_display_preferences != null && updatedUser.presentation_display_preferences !== ''
          ? (typeof updatedUser.presentation_display_preferences === 'string' ? JSON.parse(updatedUser.presentation_display_preferences as string) : updatedUser.presentation_display_preferences)
          : null

        return reply.send({
          id: String(updatedUser.id),
          email: updatedUser.email,
          name: updatedUser.name,
          last_name: updatedUser.last_name,
          middle_name: updatedUser.middle_name,
          user_img: updatedUser.user_img,
          personal_phone: updatedUser.personal_phone,
          position: updatedUser.position,
          messengers: messengersData,
          presentation_display_preferences: prefsData ?? undefined,
          company_name: updatedUser.workplace ?? undefined,
          work_position: updatedUser.work_position ?? undefined,
          company_logo: updatedUser.company_logo ?? undefined,
          work_email: updatedUser.work_email ?? undefined,
          work_phone: updatedUser.work_phone ?? undefined,
          work_website: updatedUser.work_website ?? undefined,
          createdAt: updatedUser.created_at,
          firstName: updatedUser.name,
          lastName: updatedUser.last_name,
        })
      }

      // PostgreSQL (если используется)
      return reply.status(501).send({ error: 'Обновление профиля для PostgreSQL не реализовано' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr(),
      })
    }
  })
}
