import { desc } from 'drizzle-orm'
import { db, useMysql, usePg, useFileStore } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import * as pgSchema from '../db/schema.js'

export type PdfFigureDefinition = {
  id: string
  name: string
  kind: string
  geometry: unknown
}

function parseGeometryMysql(raw: unknown): unknown {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** Все фигуры из библиотеки — для сопоставления slide.data.figures[].figureId при PDF. */
export async function getAllFiguresForPdf(): Promise<PdfFigureDefinition[]> {
  try {
    if (useFileStore || !db) return []

    if (useMysql) {
      const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
      const rows = await mysqlDb.select().from(mysqlSchema.figures).orderBy(desc(mysqlSchema.figures.created_at))
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        kind: String(r.kind ?? ''),
        geometry: parseGeometryMysql(r.geometry),
      }))
    }

    if (usePg) {
      const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
      const rows = await pgDb.select().from(pgSchema.figures).orderBy(desc(pgSchema.figures.createdAt))
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        kind: String(r.kind ?? ''),
        geometry: r.geometry as unknown,
      }))
    }

    return []
  } catch {
    return []
  }
}
