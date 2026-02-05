import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2'
import { Pool as PgPool } from 'pg'
import mysql from 'mysql2/promise'
import * as pgSchema from './schema.js'
import * as mysqlSchema from './schema-mysql.js'

const connectionString = process.env.DATABASE_URL?.trim()
const useMysql = !!connectionString?.startsWith('mysql')
const usePg = !!connectionString?.startsWith('postgres')
const hasDb = !!connectionString && (useMysql || usePg)

let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleMysql> | null = null
let schema: typeof pgSchema | typeof mysqlSchema | null = null
let isSqlite = false
let useFileStore = !hasDb

if (useMysql && connectionString) {
  const pool = mysql.createPool(connectionString)
  db = drizzleMysql(pool, { schema: mysqlSchema, mode: 'default' })
  schema = mysqlSchema
  isSqlite = false
  useFileStore = false
} else if (usePg && connectionString) {
  const pool = new PgPool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  db = drizzlePg(pool, { schema: pgSchema })
  schema = pgSchema
  isSqlite = false
  useFileStore = false
} else if (!connectionString) {
  db = null
  schema = null
  isSqlite = false
  useFileStore = true
} else {
  db = null
  schema = null
  isSqlite = false
  useFileStore = true
}

if (connectionString) {
  const kind = useMysql ? 'MySQL' : usePg ? 'PostgreSQL' : 'unknown'
  const safeUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log(`[db] DATABASE_URL: ${kind} (${safeUrl})`)
} else {
  console.log('[db] DATABASE_URL не задан — используется файловое хранилище (server/data/store.json)')
}

export { db, schema, isSqlite, useFileStore, useMysql, mysqlSchema, pgSchema }
