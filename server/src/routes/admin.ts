import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, useMysql, useFileStore } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

/** Middleware: только для пользователей с role_id === 2 (admin) */
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const payload = req.user as { sub: string }
  const userId = payload.sub
  if (useFileStore) {
    const user = fileStore.findUserById(userId)
    if (!user) return reply.status(403).send({ error: 'Доступ запрещён' })
    // В file store нет role_id — считаем админом первого пользователя или по email
    const allUsers = fileStore.load().users
    const isFirst = allUsers[0]?.id === userId
    if (!isFirst) return reply.status(403).send({ error: 'Требуются права администратора' })
  } else if (useMysql) {
    const uid = Number(userId)
    if (Number.isNaN(uid)) return reply.status(403).send({ error: 'Доступ запрещён' })
    const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
    const user = await mysqlDb.query.users.findFirst({
      where: eq(mysqlSchema.users.id, uid),
      columns: { role_id: true },
    })
    if (!user || (user as { role_id?: number }).role_id !== 2) {
      return reply.status(403).send({ error: 'Требуются права администратора' })
    }
  } else {
    return reply.status(403).send({ error: 'Требуются права администратора' })
  }
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/api/admin/users', { preHandler: [requireAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (useFileStore) {
        const users = fileStore.load().users.map((u) => ({
          id: String(u.id),
          email: u.email,
          name: u.firstName ?? '',
          last_name: u.lastName ?? null,
          middle_name: null,
          user_img: null,
          work_position: null,
          created_at: u.createdAt,
        }))
        return reply.send(users)
      }
      if (useMysql) {
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const rows = await mysqlDb.query.users.findMany({
          columns: {
            id: true,
            email: true,
            name: true,
            last_name: true,
            middle_name: true,
            user_img: true,
            work_position: true,
            created_at: true,
          },
        })
        return reply.send(
          rows.map((r) => ({
            id: String(r.id),
            email: r.email,
            name: r.name ?? '',
            last_name: r.last_name ?? null,
            middle_name: r.middle_name ?? null,
            user_img: r.user_img ?? null,
            work_position: r.work_position ?? null,
            created_at: r.created_at,
          }))
        )
      }
      return reply.send([])
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки пользователей' })
    }
  })
}
