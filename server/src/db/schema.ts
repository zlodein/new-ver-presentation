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
    tariff: varchar('tariff', { length: 20 }), // null | 'test_drive' | 'expert'
    testDriveUsed: varchar('test_drive_used', { length: 10 }).notNull().default('false'), // 'true' | 'false' для совместимости
    emailVerified: varchar('email_verified', { length: 10 }).notNull().default('false'), // подтверждение email при регистрации
    expertPlanQuantity: varchar('expert_plan_quantity', { length: 5 }).default('1'), // лимит презентаций на тарифе Эксперт (1–100), varchar для совместимости
    expertPresentationsUsed: varchar('expert_presentations_used', { length: 10 }).notNull().default('0'), // сколько уже создано
    twoFactorEnabled: varchar('two_factor_enabled', { length: 10 }).notNull().default('false'),
    twoFactorSecretEnc: text('two_factor_secret_enc'),
    twoFactorBackupCodesHash: text('two_factor_backup_codes_hash'),
    twoFactorEnabledAt: timestamp('two_factor_enabled_at', { withTimezone: true }),
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
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('presentations_deleted_at_idx').on(table.deletedAt),
    index('presentations_user_id_idx').on(table.userId),
    index('presentations_updated_at_idx').on(table.updatedAt),
  ]
)

// Сессии пользователей (для отслеживания устройств и выхода со всех)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  userAgent: text('user_agent'),
  ip: varchar('ip', { length: 45 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 120 }),
  lat: varchar('lat', { length: 20 }),
  lng: varchar('lng', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('user_sessions_user_id_idx').on(table.userId),
  index('user_sessions_session_id_idx').on(table.sessionId),
])

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

// Коды подтверждения (6 цифр) для регистрации и восстановления пароля
export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: varchar('type', { length: 32 }).notNull().default('email_verification'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('verification_codes_email_idx').on(table.email),
  index('verification_codes_expires_idx').on(table.expiresAt),
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

// Задачи
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('todo'), // todo | in_progress | completed
  tag: varchar('tag', { length: 100 }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('tasks_user_id_idx').on(table.userId),
  index('tasks_status_idx').on(table.status),
])

// Уведомления
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  message: text('message'),
  type: varchar('type', { length: 50 }).notNull().default('info'), // 'info', 'success', 'warning', 'error', 'calendar'
  read: text('read').notNull().default('false'), // 'true' или 'false' как строка
  sourceId: varchar('source_id', { length: 64 }), // для type=calendar — id события календаря
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_read_idx').on(table.read),
  index('notifications_created_at_idx').on(table.createdAt),
])

// Запросы в поддержку (тикеты)
export const supportRequests = pgTable('support_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: text('message'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | solved
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('support_requests_user_id_idx').on(table.userId),
  index('support_requests_created_at_idx').on(table.createdAt),
])

// Ответы в тикетах поддержки
export const supportReplies = pgTable('support_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  supportRequestId: uuid('support_request_id').notNull().references(() => supportRequests.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('support_replies_request_id_idx').on(table.supportRequestId),
])

export const userPushSubscriptions = pgTable('user_push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  platform: varchar('platform', { length: 20 }).notNull(), // web | ios | android
  endpoint: text('endpoint'),
  token: text('token'),
  p256dh: text('p256dh'),
  auth: text('auth'),
  appVersion: varchar('app_version', { length: 50 }),
  userAgent: text('user_agent'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('push_subscriptions_user_id_idx').on(table.userId),
  index('push_subscriptions_session_id_idx').on(table.sessionId),
  index('push_subscriptions_platform_idx').on(table.platform),
])

/** Именованные шаблоны групп слайдов (админка) */
export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    content: jsonb('content')
      .$type<{ slides: unknown[]; settings: Record<string, string> }>()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('templates_created_at_idx').on(table.createdAt)],
)

/** Библиотека фигур (геометрия/контур), без стилей/координат.
 * Стиль (заливка/тень) и позиция хранятся в templates/presentation.content (slide.data.figures). */
export const figures = pgTable(
  'figures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    kind: varchar('kind', { length: 50 }).notNull(), // rect | ellipse | polygon
    geometry: jsonb('geometry')
      .$type<
        | { kind: 'rect'; rx?: number }
        | { kind: 'ellipse'; cx?: number; cy?: number; rx?: number; ry?: number }
        | { kind: 'polygon'; points: Array<[number, number]> }
      >()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('figures_created_at_idx').on(table.createdAt)],
)

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Presentation = typeof presentations.$inferSelect
export type NewPresentation = typeof presentations.$inferInsert
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type SupportRequest = typeof supportRequests.$inferSelect
export type NewSupportRequest = typeof supportRequests.$inferInsert
export type SupportReply = typeof supportReplies.$inferSelect
export type NewSupportReply = typeof supportReplies.$inferInsert
export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert
export type UserPushSubscription = typeof userPushSubscriptions.$inferSelect
export type NewUserPushSubscription = typeof userPushSubscriptions.$inferInsert
export type TemplatePg = typeof templates.$inferSelect
export type NewTemplatePg = typeof templates.$inferInsert
export type FigurePg = typeof figures.$inferSelect
export type NewFigurePg = typeof figures.$inferInsert