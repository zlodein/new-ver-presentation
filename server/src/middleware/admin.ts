import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, useMysql, useFileStore } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'

/** Middleware: только для пользователей с role_id === 2 (admin) */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const payload = req.user as { sub: string }
  const userId = payload.sub
  if (useFileStore) {
    const user = fileStore.findUserById(userId)
    if (!user) return reply.status(403).send({ error: 'Доступ запрещён' })
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
