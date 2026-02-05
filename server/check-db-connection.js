/**
 * Скрипт для проверки подключения к базе данных PostgreSQL
 * Использование: node check-db-connection.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'
import { Pool } from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = basename(__dirname) === 'dist' ? join(__dirname, '..') : __dirname
dotenv.config({ path: join(serverDir, '.env') })

const connectionString = process.env.DATABASE_URL?.trim()

if (!connectionString) {
  console.error('❌ DATABASE_URL не задан в server/.env')
  process.exit(1)
}

if (!connectionString.startsWith('postgres')) {
  console.error('❌ DATABASE_URL должен начинаться с postgresql://')
  console.error(`   Текущее значение: ${connectionString.substring(0, 20)}...`)
  process.exit(1)
}

if (connectionString.includes('YOUR_PASSWORD_HERE')) {
  console.error('❌ Замените YOUR_PASSWORD_HERE на реальный пароль в server/.env')
  process.exit(1)
}

console.log('🔍 Проверка подключения к базе данных...')
console.log(`   База: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`)

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
})

try {
  const client = await pool.connect()
  console.log('✅ Подключение к базе данных успешно!')
  
  // Проверка наличия таблиц
  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `
  
  const tablesResult = await client.query(tablesQuery)
  const tables = tablesResult.rows.map(row => row.table_name)
  
  console.log(`\n📋 Найденные таблицы (${tables.length}):`)
  tables.forEach(table => console.log(`   - ${table}`))
  
  // Проверка обязательных таблиц
  const requiredTables = ['users', 'presentations', 'password_reset_tokens']
  const missingTables = requiredTables.filter(table => !tables.includes(table))
  
  if (missingTables.length > 0) {
    console.log(`\n⚠️  Отсутствуют обязательные таблицы: ${missingTables.join(', ')}`)
    console.log('   Выполните миграции: npm run db:push')
  } else {
    console.log('\n✅ Все обязательные таблицы присутствуют!')
    
    // Проверка структуры таблицы users
    const usersColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `
    const columnsResult = await client.query(usersColumnsQuery)
    console.log('\n📊 Структура таблицы users:')
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })
  }
  
  client.release()
  await pool.end()
  console.log('\n✅ Проверка завершена успешно!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Ошибка подключения к базе данных:')
  console.error(`   ${error.message}`)
  
  if (error.message.includes('password authentication failed')) {
    console.error('\n💡 Возможные причины:')
    console.error('   1. Неверный пароль в DATABASE_URL')
    console.error('   2. Пользователь не существует')
  } else if (error.message.includes('does not exist')) {
    console.error('\n💡 Возможные причины:')
    console.error('   1. База данных не существует')
    console.error('   2. Неверное имя базы данных в DATABASE_URL')
  } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
    console.error('\n💡 Возможные причины:')
    console.error('   1. PostgreSQL не запущен')
    console.error('   2. Неверный хост или порт в DATABASE_URL')
  }
  
  await pool.end()
  process.exit(1)
}
