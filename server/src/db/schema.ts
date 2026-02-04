import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 120 }),
    lastName: varchar('last_name', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
  ]
)

export const presentations = pgTable(
  'presentations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull().default('Без названия'),
    coverImage: text('cover_image'),
    content: jsonb('content').$type<{ slides: unknown[] }>().notNull().default({ slides: [] }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('presentations_user_id_idx').on(table.userId),
    index('presentations_updated_at_idx').on(table.updatedAt),
  ]
)

// Токены для восстановления пароля (действуют 1 час)
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('password_reset_tokens_token_idx').on(table.token),
  index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Presentation = typeof presentations.$inferSelect
export type NewPresentation = typeof presentations.$inferInsert
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
