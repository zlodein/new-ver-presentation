/**
 * Схема MySQL для БД e_presentati (таблицы и поля по образцу cq88845_present).
 * Используется, когда DATABASE_URL начинается с mysql://
 */
import {
  mysqlTable,
  int,
  varchar,
  longtext,
  datetime,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull().default(''),
  last_name: varchar('last_name', { length: 100 }),
  middle_name: varchar('middle_name', { length: 255 }),
  user_img: varchar('user_img', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailUnique: uniqueIndex('email').on(table.email),
}))

export const presentations = mysqlTable('presentations', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 255 }).notNull().default('Новая презентация'),
  cover_image: varchar('cover_image', { length: 255 }),
  slides_data: longtext('slides_data'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index('presentations_user_id_idx').on(table.user_id),
  updatedIdx: index('presentations_updated_at_idx').on(table.updated_at),
}))

export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  token: varchar('token', { length: 64 }).notNull(),
  expires_at: datetime('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('password_reset_tokens_token_idx').on(table.token),
  expiresIdx: index('password_reset_tokens_expires_at_idx').on(table.expires_at),
}))

export type UserMySQL = typeof users.$inferSelect
export type NewUserMySQL = typeof users.$inferInsert
export type PresentationMySQL = typeof presentations.$inferSelect
export type NewPresentationMySQL = typeof presentations.$inferInsert
export type PasswordResetTokenMySQL = typeof passwordResetTokens.$inferSelect
