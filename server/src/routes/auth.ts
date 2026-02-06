import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, gt, ne } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
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

export async function authRoutes(app: FastifyInstance) {
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
          columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, password: true },
        })
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return reply.status(401).send({ error: 'Неверный email или пароль' })
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
        const user = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
          where: eq(mysqlSchema.users.id, userId),
          columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, company_name: true, work_position: true, company_logo: true, work_email: true, work_phone: true, work_website: true, created_at: true },
        })
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        
        const messengersData = user.messengers ? (typeof user.messengers === 'string' ? JSON.parse(user.messengers) : user.messengers) : null

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
          company_name: user.company_name ?? undefined,
          work_position: user.work_position ?? undefined,
          company_logo: user.company_logo ?? undefined,
          work_email: user.work_email ?? undefined,
          work_phone: user.work_phone ?? undefined,
          work_website: user.work_website ?? undefined,
          createdAt: user.created_at,
          // Для обратной совместимости
          firstName: user.name,
          lastName: user.last_name,
        })
      }
      const user = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.users.findFirst({
        where: eq(pgSchema.users.id, payload.sub),
        columns: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      })
      if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
      return reply.send(user)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : getDbErr()),
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
    Body: { name?: string; last_name?: string; email?: string; personal_phone?: string; position?: string; messengers?: Record<string, string>; company_name?: string; work_position?: string; company_logo?: string; work_email?: string; work_phone?: string; work_website?: string }
  }>('/api/auth/profile', { preHandler: [app.authenticate] }, async (req: FastifyRequest<{ Body: { name?: string; last_name?: string; email?: string; personal_phone?: string; position?: string; messengers?: Record<string, string>; company_name?: string; work_position?: string; company_logo?: string; work_email?: string; work_phone?: string; work_website?: string } }>, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string; email: string }
      const { name, last_name, email, personal_phone, position, messengers, company_name, work_position, company_logo, work_email, work_phone, work_website } = req.body

      if (useFileStore) {
        const user = fileStore.findUserById(payload.sub)
        if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
        // Обновление через fileStore (если нужно)
        return reply.status(501).send({ error: 'Обновление профиля через файловое хранилище не реализовано' })
      }

      if (useMysql) {
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) return reply.status(401).send({ error: 'Пользователь не найден' })
        
        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name.trim()
        if (last_name !== undefined) updateData.last_name = last_name.trim() || null
        if (email !== undefined) {
          const normalizedEmail = email.trim().toLowerCase()
          // Проверка, что email не занят другим пользователем
          const existing = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
            where: and(eq(mysqlSchema.users.email, normalizedEmail), ne(mysqlSchema.users.id, userId)),
            columns: { id: true },
          })
          if (existing) return reply.status(409).send({ error: 'Email уже используется другим пользователем' })
          updateData.email = normalizedEmail
        }
        if (personal_phone !== undefined) updateData.personal_phone = personal_phone.trim() || null
        if (position !== undefined) updateData.position = position.trim() || null
        if (messengers !== undefined) updateData.messengers = JSON.stringify(messengers)
        if (company_name !== undefined) updateData.company_name = company_name.trim() || null
        if (work_position !== undefined) updateData.work_position = work_position.trim() || null
        if (company_logo !== undefined) updateData.company_logo = company_logo.trim() || null
        if (work_email !== undefined) updateData.work_email = work_email.trim() || null
        if (work_phone !== undefined) updateData.work_phone = work_phone.trim() || null
        if (work_website !== undefined) updateData.work_website = work_website.trim() || null
        updateData.updated_at = new Date()

        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.users)
          .set(updateData)
          .where(eq(mysqlSchema.users.id, userId))

        // Получить обновленные данные
        const updatedUser = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
          where: eq(mysqlSchema.users.id, userId),
          columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, personal_phone: true, position: true, messengers: true, company_name: true, work_position: true, company_logo: true, work_email: true, work_phone: true, work_website: true, created_at: true },
        })
        if (!updatedUser) return reply.status(401).send({ error: 'Пользователь не найден' })

        const messengersData = updatedUser.messengers ? (typeof updatedUser.messengers === 'string' ? JSON.parse(updatedUser.messengers) : updatedUser.messengers) : null

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
          company_name: updatedUser.company_name ?? undefined,
          work_position: updatedUser.work_position ?? undefined,
          company_logo: updatedUser.company_logo ?? undefined,
          work_email: updatedUser.work_email ?? undefined,
          work_phone: updatedUser.work_phone ?? undefined,
          work_website: updatedUser.work_website ?? undefined,
          createdAt: updatedUser.created_at,
          // Для обратной совместимости
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
