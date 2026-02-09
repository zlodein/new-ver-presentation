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
    status: varchar('status', { length: 20 }).notNull().default('draft'),
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

// Календарные события
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  start: timestamp('start', { withTimezone: true }).notNull(),
  end: timestamp('end', { withTimezone: true }),
  allDay: text('all_day').notNull().default('false'), // 'true' или 'false' как строка для совместимости
  color: varchar('color', { length: 50 }).notNull().default('Primary'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('calendar_events_user_id_idx').on(table.userId),
  index('calendar_events_start_idx').on(table.start),
])

// Уведомления
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  message: text('message'),
  type: varchar('type', { length: 50 }).notNull().default('info'), // 'info', 'success', 'warning', 'error', 'calendar'
  read: text('read').notNull().default('false'), // 'true' или 'false' как строка
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_read_idx').on(table.read),
  index('notifications_created_at_idx').on(table.createdAt),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Presentation = typeof presentations.$inferSelect
export type NewPresentation = typeof presentations.$inferInsert
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert