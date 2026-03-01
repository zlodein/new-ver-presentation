import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, ne, desc, inArray } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

function isUnknownColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /Unknown column|doesn't exist/i.test(msg)
}
import { db, useMysql, useFileStore } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { fileStore } from '../db/file-store.js'
import { deletePresentationImagesFolder, deleteSupportTicketFolder, deleteUploadFileByDbPath } from './upload.js'
import { sendTestMail } from '../services/mailer.js'

function toIsoDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString().slice(0, 19).replace('T', ' ')
  return String(d).slice(0, 19).replace('T', ' ')
}

/** Middleware: только для пользователей с role_id === 2 (admin) */
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
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

function toUserResponse(r: Record<string, unknown>, presentationsCount = 0) {
  const messengersData = r.messengers ? (typeof r.messengers === 'string' ? JSON.parse(r.messengers as string) : r.messengers) : null
  return {
    id: String(r.id),
    email: r.email,
    name: r.name ?? '',
    last_name: r.last_name ?? null,
    middle_name: r.middle_name ?? null,
    user_img: r.user_img ?? null,
    work_position: r.work_position ?? null,
    personal_phone: r.personal_phone ?? null,
    position: r.position ?? null,
    company_name: r.workplace ?? null,
    company_logo: r.company_logo ?? null,
    work_email: r.work_email ?? null,
    work_phone: r.work_phone ?? null,
    work_website: r.work_website ?? null,
    messengers: messengersData,
    created_at: r.created_at,
    last_login_at: r.last_login_at ?? null,
    is_active: r.is_active != null ? Number(r.is_active) : 1,
    role_id: r.role_id != null ? Number(r.role_id) : 1,
    presentations_count: presentationsCount,
  }
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  /** Тест отправки почты: GET /api/admin/mail-test (только админ). Ответ в JSON и в логах сервера. */
  app.get('/api/admin/mail-test', { preHandler: [requireAdmin] }, async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = await sendTestMail()
    return reply.send(result)
  })

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
          last_login_at: null,
          is_active: 1,
          presentations_count: 0,
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
            personal_phone: true,
            position: true,
            workplace: true,
            company_logo: true,
            work_email: true,
            work_phone: true,
            work_website: true,
            messengers: true,
            created_at: true,
            last_login_at: true,
            is_active: true,
            role_id: true,
            tariff: true,
            test_drive_used: true,
            expert_plan_quantity: true,
            expert_presentations_used: true,
            updated_at: true,
          },
        })
        const countRows = await mysqlDb
          .select({
            user_id: mysqlSchema.presentations.user_id,
            count: sql<number>`count(*)`.as('count'),
          })
          .from(mysqlSchema.presentations)
          .where(eq(mysqlSchema.presentations.status, 'published'))
          .groupBy(mysqlSchema.presentations.user_id)
        const countMap = new Map<number, number>()
        for (const row of countRows) {
          countMap.set(row.user_id, Number(row.count))
        }
        return reply.send(
          rows.map((r) => {
            const base = toUserResponse(r as Record<string, unknown>, countMap.get(r.id) ?? 0)
            const row = r as Record<string, unknown>
            return {
              ...base,
              tariff: row.tariff ?? null,
              test_drive_used: row.test_drive_used ?? null,
              expert_plan_quantity: row.expert_plan_quantity != null ? Number(row.expert_plan_quantity) : null,
              expert_presentations_used: row.expert_presentations_used != null ? Number(row.expert_presentations_used) : null,
              tariff_updated_at: row.updated_at ?? null,
            }
          })
        )
      }
      return reply.send([])
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки пользователей' })
    }
  })

  /** Список всех презентаций для админа: id, title, shortId, user (name, email), updated_at */
  app.get('/api/admin/presentations', { preHandler: [requireAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (useFileStore) {
        return reply.send([])
      }
      if (useMysql) {
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const rows = await mysqlDb.query.presentations.findMany({
          columns: { id: true, user_id: true, title: true, short_id: true, cover_image: true, updated_at: true, status: true },
          orderBy: [desc(mysqlSchema.presentations.updated_at)],
        })
        const userIds = [...new Set((rows as { user_id: number }[]).map((r) => r.user_id))]
        const users = userIds.length
          ? await mysqlDb.query.users.findMany({
              where: inArray(mysqlSchema.users.id, userIds),
              columns: { id: true, name: true, last_name: true, email: true },
            })
          : []
        const userMap = new Map<number, { name: string; email: string }>()
        for (const u of users as { id: number; name: string; last_name: string | null; email: string }[]) {
          const name = [u.name, u.last_name].filter(Boolean).join(' ').trim() || '—'
          userMap.set(u.id, { name, email: u.email })
        }
        return reply.send(
          (rows as { id: number; user_id: number; title: string; short_id: string | null; cover_image: string | null; updated_at: Date; status: string | null }[]).map((p) => {
            const user = userMap.get(p.user_id)
            return {
              id: String(p.id),
              title: p.title,
              shortId: p.short_id ?? undefined,
              coverImage: p.cover_image ?? undefined,
              userName: user?.name ?? '—',
              userEmail: user?.email ?? '—',
              updatedAt: toIsoDate(p.updated_at),
              status: p.status ?? 'draft',
            }
          })
        )
      }
      return reply.send([])
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки списка презентаций' })
    }
  })

  app.get<{ Params: { id: string } }>('/api/admin/users/:id', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const targetId = req.params.id
      if (useFileStore) {
        const user = fileStore.findUserById(targetId)
        if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
        return reply.send({
          id: user.id,
          email: user.email,
          name: user.firstName ?? '',
          last_name: user.lastName ?? null,
          middle_name: null,
          user_img: null,
          work_position: null,
          personal_phone: null,
          position: null,
          company_name: null,
          work_email: null,
          work_phone: null,
          work_website: null,
          messengers: null,
          created_at: user.createdAt,
          last_login_at: null,
          is_active: 1,
          presentations_count: 0,
        })
      }
      if (useMysql) {
        const uid = Number(targetId)
        if (Number.isNaN(uid)) return reply.status(404).send({ error: 'Пользователь не найден' })
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const user = await mysqlDb.query.users.findFirst({
          where: eq(mysqlSchema.users.id, uid),
          columns: {
            id: true,
            email: true,
            name: true,
            last_name: true,
            middle_name: true,
            user_img: true,
            work_position: true,
            personal_phone: true,
            position: true,
            workplace: true,
            company_logo: true,
            work_email: true,
            work_phone: true,
            work_website: true,
            messengers: true,
            created_at: true,
            last_login_at: true,
            is_active: true,
            role_id: true,
          },
        })
        if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
        const [countRow] = await mysqlDb
          .select({ count: sql<number>`count(*)` })
          .from(mysqlSchema.presentations)
          .where(and(eq(mysqlSchema.presentations.user_id, uid), eq(mysqlSchema.presentations.status, 'published')))
        const presentationsCount = countRow ? Number(countRow.count) : 0
        return reply.send(toUserResponse(user as Record<string, unknown>, presentationsCount))
      }
      return reply.status(404).send({ error: 'Пользователь не найден' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки пользователя' })
    }
  })

  app.put<{
    Params: { id: string }
    Body: { name?: string; last_name?: string; middle_name?: string; email?: string; personal_phone?: string; position?: string; work_position?: string; company_name?: string; work_email?: string; work_phone?: string; work_website?: string; messengers?: Record<string, string> }
  }>('/api/admin/users/:id', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply: FastifyReply) => {
    try {
      const targetId = req.params.id
      const body = req.body
      if (!useMysql) return reply.status(501).send({ error: 'Не поддерживается для файлового хранилища' })
      const uid = Number(targetId)
      if (Number.isNaN(uid)) return reply.status(404).send({ error: 'Пользователь не найден' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const updateData: Record<string, unknown> = { updated_at: new Date() }
      if (body.name !== undefined) updateData.name = String(body.name).trim()
      if (body.last_name !== undefined) updateData.last_name = (body.last_name as string)?.trim() || null
      if (body.middle_name !== undefined) updateData.middle_name = (body.middle_name as string)?.trim() || null
      if (body.personal_phone !== undefined) updateData.personal_phone = (body.personal_phone as string)?.trim() || null
      if (body.position !== undefined) updateData.position = (body.position as string)?.trim() || null
      if (body.work_position !== undefined) updateData.work_position = (body.work_position as string)?.trim() || null
      if (body.company_name !== undefined) updateData.workplace = (body.company_name as string)?.trim() || null
      if (body.work_email !== undefined) updateData.work_email = (body.work_email as string)?.trim() || null
      if (body.work_phone !== undefined) updateData.work_phone = (body.work_phone as string)?.trim() || null
      if (body.work_website !== undefined) updateData.work_website = (body.work_website as string)?.trim() || null
      if (body.messengers !== undefined) updateData.messengers = JSON.stringify(body.messengers)
      if (body.email !== undefined) {
        const normalizedEmail = (body.email as string).trim().toLowerCase()
        const existing = await mysqlDb.query.users.findFirst({
          where: and(eq(mysqlSchema.users.email, normalizedEmail), ne(mysqlSchema.users.id, uid)),
          columns: { id: true },
        })
        if (existing) return reply.status(409).send({ error: 'Email уже используется' })
        updateData.email = normalizedEmail
      }
      await mysqlDb.update(mysqlSchema.users).set(updateData).where(eq(mysqlSchema.users.id, uid))
      const user = await mysqlDb.query.users.findFirst({
        where: eq(mysqlSchema.users.id, uid),
        columns: {
          id: true,
          email: true,
          name: true,
          last_name: true,
          middle_name: true,
          user_img: true,
          work_position: true,
          personal_phone: true,
          position: true,
          workplace: true,
          work_email: true,
          work_phone: true,
          work_website: true,
          messengers: true,
          created_at: true,
          last_login_at: true,
          is_active: true,
        },
      })
      if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
      const [countRow] = await mysqlDb
        .select({ count: sql<number>`count(*)` })
        .from(mysqlSchema.presentations)
        .where(and(eq(mysqlSchema.presentations.user_id, uid), eq(mysqlSchema.presentations.status, 'published')))
      return reply.send(toUserResponse(user as Record<string, unknown>, countRow ? Number(countRow.count) : 0))
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка сохранения' })
    }
  })

  /** Внутренняя логика полного удаления пользователя (вызывается из DELETE и POST). */
  async function deleteUserById(uid: number, adminId: number, reply: FastifyReply, mysqlDb: import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>) {
    if (uid === adminId) return reply.status(403).send({ error: 'Нельзя удалить себя' })
    const user = await mysqlDb.query.users.findFirst({
      where: eq(mysqlSchema.users.id, uid),
      columns: { id: true, user_img: true, company_logo: true },
    })
    if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
    const presentations = await mysqlDb.query.presentations.findMany({
      where: eq(mysqlSchema.presentations.user_id, uid),
      columns: { id: true },
    })
    const presentationIds = (presentations as { id: number }[]).map((p) => p.id)
    const supportRequests = await mysqlDb.query.supportRequests.findMany({
      where: eq(mysqlSchema.supportRequests.user_id, uid),
      columns: { id: true },
    })
    const supportRequestIds = (supportRequests as { id: number }[]).map((r) => r.id)
    await deleteUploadFileByDbPath((user as { user_img?: string | null }).user_img)
    await deleteUploadFileByDbPath((user as { company_logo?: string | null }).company_logo)
    for (const pid of presentationIds) await deletePresentationImagesFolder(String(pid))
    for (const tid of supportRequestIds) await deleteSupportTicketFolder(String(tid))
    try {
      await mysqlDb.execute(sql`DELETE FROM presentation_audit_log WHERE user_id = ${uid}`)
    } catch {
      /* таблица может отсутствовать */
    }
    await mysqlDb.delete(mysqlSchema.supportRequests).where(eq(mysqlSchema.supportRequests.user_id, uid))
    await mysqlDb.delete(mysqlSchema.notifications).where(eq(mysqlSchema.notifications.user_id, uid))
    await mysqlDb.delete(mysqlSchema.calendarEvents).where(eq(mysqlSchema.calendarEvents.user_id, uid))
    await mysqlDb.delete(mysqlSchema.tasks).where(eq(mysqlSchema.tasks.user_id, uid))
    await mysqlDb.delete(mysqlSchema.users).where(eq(mysqlSchema.users.id, uid))
    return reply.send({ success: true })
  }

  /** Удаление пользователя: POST /api/admin/users/delete с телом { id } — как у презентаций (без id в URL, чтобы прокси не резал). */
  app.post<{ Body: { id?: string } }>('/api/admin/users/delete', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Body: { id?: string } }>, reply: FastifyReply) => {
    try {
      const targetId = req.body?.id != null ? String(req.body.id).trim() : ''
      if (!targetId) return reply.status(400).send({ error: 'Не указан id пользователя' })
      if (useFileStore) return reply.status(501).send({ error: 'Удаление пользователей поддерживается только при работе с MySQL' })
      const uid = Number(targetId)
      if (Number.isNaN(uid)) return reply.status(400).send({ error: 'Неверный формат id пользователя' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const adminId = Number((req.user as { sub: string }).sub)
      return deleteUserById(uid, adminId, reply, mysqlDb)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка удаления пользователя' })
    }
  })

  app.patch<{ Params: { id: string }; Body: { is_active?: number } }>('/api/admin/users/:id/active', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { id: string }; Body: { is_active?: number } }>, reply: FastifyReply) => {
    try {
      const targetId = req.params.id
      const { is_active } = req.body ?? {}
      if (!useMysql) return reply.status(501).send({ error: 'Не поддерживается для файлового хранилища' })
      const uid = Number(targetId)
      if (Number.isNaN(uid)) return reply.status(404).send({ error: 'Пользователь не найден' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const adminId = Number((req.user as { sub: string }).sub)
      if (uid === adminId) return reply.status(400).send({ error: 'Нельзя деактивировать себя' })
      const newActive = is_active !== undefined ? (is_active ? 1 : 0) : undefined
      if (newActive === undefined) return reply.status(400).send({ error: 'Укажите is_active' })
      await mysqlDb.update(mysqlSchema.users).set({ is_active: newActive, updated_at: new Date() }).where(eq(mysqlSchema.users.id, uid))
      return reply.send({ success: true, is_active: newActive })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка обновления статуса' })
    }
  })

  app.post<{ Params: { id: string } }>('/api/admin/users/:id/impersonate', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const targetId = req.params.id
      if (!useMysql) return reply.status(501).send({ error: 'Не поддерживается для файлового хранилища' })
      const uid = Number(targetId)
      if (Number.isNaN(uid)) return reply.status(404).send({ error: 'Пользователь не найден' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      let user: Record<string, unknown> | null = null
      try {
        user = await mysqlDb.query.users.findFirst({
          where: eq(mysqlSchema.users.id, uid),
          columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, messengers: true, is_active: true },
        }) as Record<string, unknown> | null
      } catch (err) {
        if (isUnknownColumnError(err)) {
          user = await mysqlDb.query.users.findFirst({
            where: eq(mysqlSchema.users.id, uid),
            columns: { id: true, email: true, name: true, last_name: true, middle_name: true, user_img: true, messengers: true },
          }) as Record<string, unknown> | null
          if (user) user.is_active = 1
        } else throw err
      }
      if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
      const isActiveVal = user.is_active
      if (isActiveVal !== undefined && isActiveVal !== null && Number(isActiveVal) === 0) {
        return reply.status(403).send({ error: 'Нельзя войти под деактивированным пользователем' })
      }
      const token = await reply.jwtSign({ sub: String(user.id), email: String(user.email) }, { expiresIn: '7d' })
      let messengersData: Record<string, string> | null = null
      try {
        const raw = (user as { messengers?: string }).messengers
        if (raw && typeof raw === 'string') messengersData = JSON.parse(raw)
      } catch {
        /* ignore invalid JSON */
      }
      return reply.send({
        token,
        user: {
          id: String(user.id),
          email: user.email,
          name: user.name,
          last_name: user.last_name,
          middle_name: user.middle_name,
          user_img: user.user_img,
          firstName: user.name,
          lastName: user.last_name,
          messengers: messengersData ?? undefined,
        },
      })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка входа под пользователем' })
    }
  })

  /** Добавить количество презентаций пользователю на тарифе «Эксперт» */
  app.patch<{ Params: { id: string }; Body: { addPresentations?: number } }>('/api/admin/users/:id/tariff', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { id: string }; Body: { addPresentations?: number } }>, reply: FastifyReply) => {
    try {
      const targetId = req.params.id
      const { addPresentations } = req.body ?? {}
      if (!useMysql) return reply.status(501).send({ error: 'Не поддерживается для файлового хранилища' })
      const uid = Number(targetId)
      if (Number.isNaN(uid)) return reply.status(400).send({ error: 'Неверный id пользователя' })
      const num = typeof addPresentations === 'number' && addPresentations > 0 ? addPresentations : 0
      if (num === 0) return reply.status(400).send({ error: 'Укажите addPresentations (положительное число)' })
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const user = await mysqlDb.query.users.findFirst({
        where: eq(mysqlSchema.users.id, uid),
        columns: { role_id: true, tariff: true, expert_plan_quantity: true },
      }) as { role_id?: number; tariff?: string | null; expert_plan_quantity?: number | null } | undefined
      if (!user) return reply.status(404).send({ error: 'Пользователь не найден' })
      if (user.role_id === 2) return reply.status(400).send({ error: 'Нельзя изменить тариф администратору' })
      if (user.tariff !== 'expert') return reply.status(400).send({ error: 'Добавление презентаций доступно только для тарифа «Эксперт»' })
      const current = Math.max(0, user.expert_plan_quantity ?? 0)
      const newQty = current + num
      await mysqlDb.update(mysqlSchema.users).set({ expert_plan_quantity: newQty, updated_at: new Date() }).where(eq(mysqlSchema.users.id, uid))
      return reply.send({ success: true, expert_plan_quantity: newQty })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка обновления тарифа' })
    }
  })
}
