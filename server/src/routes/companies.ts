import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { db, useMysql } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'

function getUserId(req: FastifyRequest): string | null {
  const user = req.user as { sub?: string } | undefined
  return user?.sub ?? null
}

/** Парсит id компании из params (число или "1:1" артефакт). */
function parseCompanyId(id: string): number | null {
  if (!id || typeof id !== 'string') return null
  const s = String(id).trim()
  const numPart = s.includes(':') ? s.split(':')[0]?.trim() ?? s : s
  const num = Math.floor(Number(numPart))
  return Number.isNaN(num) || num < 1 ? null : num
}

export async function companyRoutes(app: FastifyInstance) {
  if (!useMysql || !db) return

  const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>

  app.get('/api/companies', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(req)
    if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
    const userIdNum = Number(userId)
    if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })

    const list = await mysqlDb.query.companies.findMany({
      where: eq(mysqlSchema.companies.user_id, userIdNum),
      columns: { id: true, name: true, resources: true, created_at: true, updated_at: true },
      orderBy: (companies, { desc }) => [desc(companies.updated_at)],
    })
    return reply.send(
      list.map((row: { id: number; name: string; resources: string | null; created_at: Date; updated_at: Date }) => ({
        id: String(row.id),
        name: row.name ?? '',
        resources: parseResources(row.resources),
        createdAt: row.created_at.toISOString?.(),
        updatedAt: row.updated_at.toISOString?.(),
      }))
    )
  })

  app.post<{ Body: { name?: string } }>(
    '/api/companies',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Body: { name?: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const userIdNum = Number(userId)
      if (Number.isNaN(userIdNum)) return reply.status(401).send({ error: 'Не авторизован' })
      const name = String(req.body?.name ?? '').trim() || 'Моя компания'

      await mysqlDb.insert(mysqlSchema.companies).values({ user_id: userIdNum, name })
      const list = await mysqlDb.query.companies.findMany({
        where: and(eq(mysqlSchema.companies.user_id, userIdNum), eq(mysqlSchema.companies.name, name)),
        columns: { id: true },
        orderBy: (companies, { desc }) => [desc(companies.id)],
        limit: 1,
      })
      const id = (list[0] as { id: number } | undefined)?.id
      if (id == null) return reply.status(500).send({ error: 'Ошибка создания компании' })
      return reply.status(201).send({ id: String(id), name })
    }
  )

  app.get<{ Params: { id: string } }>(
    '/api/companies/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const userIdNum = Number(userId)
      const id = parseCompanyId(req.params.id ?? '')
      if (id === null) return reply.status(400).send({ error: 'Неверный id компании' })

      const row = await mysqlDb.query.companies.findFirst({
        where: and(eq(mysqlSchema.companies.id, id), eq(mysqlSchema.companies.user_id, userIdNum)),
        columns: { id: true, name: true, resources: true, created_at: true, updated_at: true },
      })
      if (!row) return reply.status(404).send({ error: 'Компания не найдена' })
      const r = row as { id: number; name: string; resources: string | null; created_at: Date; updated_at: Date }
      return reply.send({
        id: String(r.id),
        name: r.name ?? '',
        resources: parseResources(r.resources),
        createdAt: r.created_at?.toISOString?.(),
        updatedAt: r.updated_at?.toISOString?.(),
      })
    }
  )

  app.put<{
    Params: { id: string }
    Body: { name?: string; resources?: { logos?: string[]; fonts?: string[]; palette?: Record<string, string>; icons?: string[] } }
  }>(
    '/api/companies/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{
      Params: { id: string }
      Body: { name?: string; resources?: { logos?: string[]; fonts?: string[]; palette?: Record<string, string>; icons?: string[] } }
    }>, reply: FastifyReply) => {
      const userId = getUserId(req)
      if (!userId) return reply.status(401).send({ error: 'Не авторизован' })
      const userIdNum = Number(userId)
      const id = parseCompanyId(req.params.id ?? '')
      if (id === null) return reply.status(400).send({ error: 'Неверный id компании' })

      const existing = await mysqlDb.query.companies.findFirst({
        where: and(eq(mysqlSchema.companies.id, id), eq(mysqlSchema.companies.user_id, userIdNum)),
        columns: { id: true, name: true, resources: true },
      })
      if (!existing) return reply.status(404).send({ error: 'Компания не найдена' })

      const body = req.body ?? {}
      const updates: { name?: string; resources?: string } = {}
      if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
      if (body.resources !== undefined) updates.resources = JSON.stringify(body.resources)

      if (Object.keys(updates).length === 0) {
        const r = existing as { id: number; name: string; resources: string | null }
        return reply.send({
          id: String(r.id),
          name: r.name ?? '',
          resources: parseResources(r.resources),
        })
      }

      await mysqlDb
        .update(mysqlSchema.companies)
        .set(updates as { name?: string; resources?: string })
        .where(and(eq(mysqlSchema.companies.id, id), eq(mysqlSchema.companies.user_id, userIdNum)))

      const row = await mysqlDb.query.companies.findFirst({
        where: and(eq(mysqlSchema.companies.id, id), eq(mysqlSchema.companies.user_id, userIdNum)),
        columns: { id: true, name: true, resources: true },
      })
      const r = row as { id: number; name: string; resources: string | null }
      return reply.send({
        id: String(r.id),
        name: r.name ?? '',
        resources: parseResources(r.resources),
      })
    }
  )
}

function parseResources(raw: string | null): { logos: string[]; fonts: string[]; palette: Record<string, string>; icons: string[] } {
  if (!raw || typeof raw !== 'string') return { logos: [], fonts: [], palette: {}, icons: [] }
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    return {
      logos: Array.isArray(o.logos) ? (o.logos as string[]) : [],
      fonts: Array.isArray(o.fonts) ? (o.fonts as string[]) : [],
      palette: o.palette && typeof o.palette === 'object' && !Array.isArray(o.palette) ? (o.palette as Record<string, string>) : {},
      icons: Array.isArray(o.icons) ? (o.icons as string[]) : [],
    }
  } catch {
    return { logos: [], fonts: [], palette: {}, icons: [] }
  }
}
