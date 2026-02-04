import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { db, schema, isSqlite, useFileStore } from '../db/index.js'
import { fileStore } from '../db/file-store.js'

const SALT_ROUNDS = 10
const SERVER_ERR = 'Ошибка сервера. При использовании файлового хранилища проверьте папку server/data.'

export async function authRoutes(app: FastifyInstance) {
  app.post<{
    Body: { email: string; password: string; firstName?: string; lastName?: string }
  }>('/api/auth/register', async (req: FastifyRequest<{ Body: { email: string; password: string; firstName?: string; lastName?: string } }>, reply: FastifyReply) => {
    try {
      const { email, password, firstName, lastName } = req.body
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
      const existing = await db!.query.users.findFirst({
        where: eq(schema!.users.email, normalizedEmail),
      })
      if (existing) {
        return reply.status(409).send({ error: 'Пользователь с таким email уже зарегистрирован' })
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
      const [user] = await db!
        .insert(schema!.users)
        .values({
          email: normalizedEmail,
          passwordHash,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
        })
        .returning({ id: schema!.users.id, email: schema!.users.email, firstName: schema!.users.firstName, lastName: schema!.users.lastName })
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
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера. Проверьте, что PostgreSQL запущен и таблицы созданы (см. server/README.md).'),
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
      const user = await db!.query.users.findFirst({
        where: eq(schema!.users.email, normalizedEmail),
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
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера. Проверьте, что PostgreSQL запущен и таблицы созданы (см. server/README.md).'),
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
      const user = await db!.query.users.findFirst({
        where: eq(schema!.users.id, payload.sub),
        columns: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      })
      if (!user) return reply.status(401).send({ error: 'Пользователь не найден' })
      return reply.send(user)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера.'),
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
      const user = await db!.query.users.findFirst({
        where: eq(schema!.users.email, normalizedEmail),
        columns: { id: true },
      })
      if (!user) {
        return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
      }
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
      await db!.insert(schema!.passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      })
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
      if (process.env.NODE_ENV === 'development') {
        return reply.send({ message: 'Токен для сброса (только dev)', resetLink, token })
      }
      return reply.send({ message: 'Если такой email зарегистрирован, на него придёт ссылка для сброса пароля.' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера.'),
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
      const rows = await db!.query.passwordResetTokens.findMany({
        where: and(
          eq(schema!.passwordResetTokens.token, token.trim()),
          gt(schema!.passwordResetTokens.expiresAt, now)
        ),
        columns: { id: true, userId: true },
      })
      const resetRow = rows[0]
      if (!resetRow) {
        return reply.status(400).send({ error: 'Токен недействителен или истёк. Запросите сброс пароля снова.' })
      }
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
      await db!.update(schema!.users).set({ passwordHash, updatedAt: now }).where(eq(schema!.users.id, resetRow.userId))
      await db!.delete(schema!.passwordResetTokens).where(eq(schema!.passwordResetTokens.id, resetRow.id))
      return reply.send({ message: 'Пароль успешно изменён. Войдите с новым паролем.' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: useFileStore ? (err instanceof Error ? err.message : SERVER_ERR) : (process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Ошибка сервера.'),
      })
    }
  })
}
