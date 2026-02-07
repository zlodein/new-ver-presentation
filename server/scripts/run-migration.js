/**
 * Скрипт для выполнения SQL миграций в MySQL
 * Использование: node scripts/run-migration.js drizzle/0002_presentation_views.sql
 */

import { readFileSync } from 'node:fs'
import { createConnection } from 'mysql2/promise'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем переменные окружения
config({ path: resolve(__dirname, '../.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL || !DATABASE_URL.startsWith('mysql://')) {
  console.error('❌ DATABASE_URL не настроен или не является MySQL URL')
  console.error('Убедитесь, что в server/.env задан DATABASE_URL=mysql://user:password@host:port/database')
  process.exit(1)
}

// Парсим DATABASE_URL
// Формат: mysql://user:password@host:port/database
const urlMatch = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/(.+)/)
if (!urlMatch) {
  console.error('❌ Неверный формат DATABASE_URL. Ожидается: mysql://user:password@host:port/database')
  process.exit(1)
}

const [, user, password, host, port, database] = urlMatch
const dbConfig = {
  host: host,
  port: parseInt(port) || 3306,
  user: user,
  password: password,
  database: database,
  multipleStatements: true,
}

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Укажите путь к файлу миграции')
  console.error('Использование: node scripts/run-migration.js drizzle/0002_presentation_views.sql')
  process.exit(1)
}

const migrationPath = resolve(__dirname, '..', migrationFile)

try {
  const sql = readFileSync(migrationPath, 'utf-8')
  
  console.log(`📄 Чтение миграции: ${migrationPath}`)
  console.log(`🔌 Подключение к MySQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
  
  const connection = await createConnection(dbConfig)
  
  console.log('✅ Подключение установлено')
  console.log('🚀 Выполнение миграции...')
  
  await connection.query(sql)
  
  console.log('✅ Миграция выполнена успешно!')
  
  await connection.end()
  process.exit(0)
} catch (error) {
  console.error('❌ Ошибка при выполнении миграции:', error.message)
  if (error.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('ℹ️  Таблица уже существует. Это нормально, если миграция уже была выполнена.')
  }
  process.exit(1)
}
