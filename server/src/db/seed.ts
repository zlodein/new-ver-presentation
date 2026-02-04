/**
 * Создаёт пользователя из переменных окружения (ваши данные для входа).
 * Запуск: из папки server: npx tsx src/db/seed.ts
 *
 * В server/.env задайте:
 *   SEED_USER_EMAIL=ваш@email.com
 *   SEED_USER_PASSWORD=ваш_пароль
 *   SEED_USER_FIRST_NAME=Имя (опционально)
 *   SEED_USER_LAST_NAME=Фамилия (опционально)
 */
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db, schema, isSqlite, useFileStore } from './index.js'
import { fileStore } from './file-store.js'

const SALT_ROUNDS = 10

async function seed() {
  const email = process.env.SEED_USER_EMAIL?.trim()
  const password = process.env.SEED_USER_PASSWORD
  const firstName = process.env.SEED_USER_FIRST_NAME?.trim() || null
  const lastName = process.env.SEED_USER_LAST_NAME?.trim() || null

  if (!email) {
    console.error('Укажите SEED_USER_EMAIL в server/.env')
    process.exit(1)
  }
  if (!password || password.length < 6) {
    console.error('Укажите SEED_USER_PASSWORD в server/.env (не менее 6 символов)')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase()
  if (useFileStore) {
    const existing = fileStore.findUserByEmail(normalizedEmail)
    if (existing) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
      fileStore.updateUser(existing.id, { passwordHash, firstName, lastName, updatedAt: new Date().toISOString() })
      console.log('Пользователь обновлён:', existing.email)
    } else {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
      const user = fileStore.createUser({ email: normalizedEmail, passwordHash, firstName, lastName })
      console.log('Пользователь создан:', user.email)
    }
    process.exit(0)
    return
  }
  const existing = await db!.query.users.findFirst({
    where: eq(schema!.users.email, normalizedEmail),
    columns: { id: true, email: true },
  })
  if (existing) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const updatedAt = isSqlite ? new Date().toISOString() : new Date()
    await db!
      .update(schema!.users)
      .set({ passwordHash, firstName, lastName, updatedAt } as Record<string, unknown>)
      .where(eq(schema!.users.id, existing.id))
    console.log('Пользователь обновлён:', existing.email)
  } else {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const [user] = await db!
      .insert(schema!.users)
      .values({
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
      })
      .returning({ id: schema!.users.id, email: schema!.users.email })
    console.log('Пользователь создан:', user?.email)
  }
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
