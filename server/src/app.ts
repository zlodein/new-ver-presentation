import Fastify from 'fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import fjwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import { db, useFileStore, useMysql } from './db/index.js'
import * as pgSchema from './db/schema.js'
import * as mysqlSchema from './db/schema-mysql.js'
import { eq } from 'drizzle-orm'
import { authRoutes } from './routes/auth.js'
import { sessionRoutes } from './routes/sessions.js'
import { adminRoutes } from './routes/admin.js'
import { presentationRoutes } from './routes/presentations.js'
import { editorApiRoutes } from './routes/editor-api.js'
import { uploadRoutes } from './routes/upload.js'
import { calendarRoutes } from './routes/calendar.js'
import { notificationRoutes } from './routes/notifications.js'
import { taskRoutes } from './routes/tasks.js'
import { supportRoutes } from './routes/support.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function buildApp() {
  const app = Fastify({ logger: true })

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters')
  }

  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  await app.register(cookie, {
    secret: secret,
    parseOptions: {},
  })

  await app.register(fjwt, { secret })
  
  try {
    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })
  } catch (err) {
    console.error('[app] Ошибка регистрации multipart:', err)
    throw err
  }

  // Статические файлы для аватаров (опционально, не блокируем запуск)
  try {
    const uploadsPath = path.join(__dirname, '../uploads')
    await app.register(staticFiles, {
      root: uploadsPath,
      prefix: '/uploads/',
    })
    console.log('[app] Статические файлы зарегистрированы:', uploadsPath)
  } catch (err) {
    console.warn('[app] Предупреждение: не удалось зарегистрировать статические файлы (папка будет создана при первой загрузке):', err instanceof Error ? err.message : err)
    // Не блокируем запуск сервера, если папка uploads не существует
  }

  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify()
      const payload = req.user as { sub: string; sid?: string } | undefined
      if (payload?.sid && !useFileStore && db) {
        if (useMysql) {
          const rows = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.userSessions.findMany({
            where: eq(mysqlSchema.userSessions.session_id, payload.sid),
            columns: { id: true },
            limit: 1,
          })
          if (rows.length === 0) return reply.status(401).send({ error: 'Сессия завершена. Войдите снова.' })
        } else {
          const rows = await (db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>).query.userSessions.findMany({
            where: eq(pgSchema.userSessions.sessionId, payload.sid),
            columns: { id: true },
            limit: 1,
          })
          if (rows.length === 0) return reply.status(401).send({ error: 'Сессия завершена. Войдите снова.' })
        }
      }
    } catch {
      return reply.status(401).send({ error: 'Недействительный или отсутствующий токен' })
    }
  })

  await app.register(authRoutes, { prefix: '/' })
  await app.register(sessionRoutes, { prefix: '/' })
  await app.register(adminRoutes, { prefix: '/' })
  await app.register(presentationRoutes, { prefix: '/' })
  await app.register(editorApiRoutes, { prefix: '/api' })
  await app.register(uploadRoutes, { prefix: '/' })
  await app.register(calendarRoutes, { prefix: '/' })
  await app.register(notificationRoutes, { prefix: '/' })
  await app.register(taskRoutes, { prefix: '/' })
  await app.register(supportRoutes, { prefix: '/' })

  return app
}
