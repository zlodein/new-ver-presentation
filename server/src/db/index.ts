import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as pgSchema from './schema.js'

const connectionString = process.env.DATABASE_URL?.trim()

let db: ReturnType<typeof drizzle<typeof pgSchema>> | null = null
let schema: typeof pgSchema | null = null
let isSqlite = false
let useFileStore = false

if (connectionString) {
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  db = drizzle(pool, { schema: pgSchema })
  schema = pgSchema
  isSqlite = false
  useFileStore = false
} else {
  db = null
  schema = null
  isSqlite = false
  useFileStore = true
}

export { db, schema, isSqlite, useFileStore }
