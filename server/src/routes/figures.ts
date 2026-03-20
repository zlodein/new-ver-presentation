import type { FastifyInstance } from 'fastify'
import { desc } from 'drizzle-orm'
import { db, useMysql, usePg, useFileStore } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import * as pgSchema from '../db/schema.js'

function parseGeometry(raw: unknown): unknown {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function figuresRoutes(app: FastifyInstance) {
  /** Библиотека фигур: геометрия/контур без стилей/координат. */
  app.get('/api/figures', async (_req, reply) => {
    try {
      if (useFileStore || !db) return reply.send({ figures: [] })

      if (useMysql) {
        const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
        const rows = await mysqlDb
          .select()
          .from(mysqlSchema.figures)
          .orderBy(desc(mysqlSchema.figures.created_at))

        return reply.send({
          figures: rows.map((r) => ({
            id: String(r.id),
            name: String(r.name ?? ''),
            kind: String(r.kind ?? ''),
            geometry: parseGeometry(r.geometry),
          })),
        })
      }

      if (usePg) {
        const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
        const rows = await pgDb
          .select()
          .from(pgSchema.figures)
          .orderBy(desc(pgSchema.figures.createdAt))

        return reply.send({
          figures: rows.map((r) => ({
            id: String(r.id),
            name: String(r.name ?? ''),
            kind: String(r.kind ?? ''),
            geometry: r.geometry as unknown,
          })),
        })
      }

      return reply.send({ figures: [] })
    } catch {
      return reply.send({ figures: [] })
    }
  })
}

