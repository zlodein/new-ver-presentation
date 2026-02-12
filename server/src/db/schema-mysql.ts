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
  personal_phone: varchar('personal_phone', { length: 20 }),
  position: varchar('position', { length: 255 }),
  messengers: longtext('messengers'), // JSON строка
  workplace: varchar('workplace', { length: 255 }), // в БД: workplace; в API отдаём как company_name
  work_position: varchar('work_position', { length: 255 }),
  company_logo: varchar('company_logo', { length: 255 }),
  work_email: varchar('work_email', { length: 255 }),
  work_phone: varchar('work_phone', { length: 20 }),
  work_website: varchar('work_website', { length: 512 }),
  presentation_display_preferences: longtext('presentation_display_preferences'), // JSON: настройки подстановки в блок контактов
  role_id: int('role_id').default(1),
  last_login_at: timestamp('last_login_at'),
  is_active: int('is_active', { unsigned: true }).default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailUnique: uniqueIndex('email').on(table.email),
}))

export const presentations = mysqlTable('presentations', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 255 }).notNull().default('Новая презентация'),
  cover_image: longtext('cover_image'), // base64 или URL; varchar(255) обрезает base64
  slides_data: longtext('slides_data'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | published
  public_hash: varchar('public_hash', { length: 32 }),
  is_public: int('is_public', { unsigned: true }).notNull().default(0),
  public_url: varchar('public_url', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index('presentations_user_id_idx').on(table.user_id),
  updatedIdx: index('presentations_updated_at_idx').on(table.updated_at),
  publicHashIdx: uniqueIndex('idx_public_hash').on(table.public_hash),
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

export const presentationViews = mysqlTable('presentation_views', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  presentation_id: int('presentation_id', { unsigned: true }).notNull(),
  viewed_at: timestamp('viewed_at').defaultNow().notNull(),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: varchar('user_agent', { length: 512 }),
}, (table) => ({
  presentationIdx: index('presentation_views_presentation_id_idx').on(table.presentation_id),
  viewedAtIdx: index('presentation_views_viewed_at_idx').on(table.viewed_at),
}))

export const calendarEvents = mysqlTable('calendar_events', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  start: datetime('start').notNull(),
  end: datetime('end'),
  all_day: varchar('all_day', { length: 10 }).notNull().default('false'), // 'true' или 'false'
  color: varchar('color', { length: 50 }).notNull().default('Primary'),
  notes: longtext('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index('calendar_events_user_id_idx').on(table.user_id),
  startIdx: index('calendar_events_start_idx').on(table.start),
}))

export const tasks = mysqlTable('tasks', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: longtext('description'),
  status: varchar('status', { length: 20 }).notNull().default('todo'), // todo | in_progress | completed
  tag: varchar('tag', { length: 100 }),
  due_date: datetime('due_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index('tasks_user_id_idx').on(table.user_id),
  statusIdx: index('tasks_status_idx').on(table.status),
}))

export const notifications = mysqlTable('notifications', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  message: longtext('message'),
  type: varchar('type', { length: 50 }).notNull().default('info'), // 'info', 'success', 'warning', 'error', 'calendar'
  read: varchar('read', { length: 10 }).notNull().default('false'), // 'true' или 'false'
  source_id: varchar('source_id', { length: 64 }), // для type=calendar — id события календаря
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.user_id),
  readIdx: index('notifications_read_idx').on(table.read),
  createdAtIdx: index('notifications_created_at_idx').on(table.created_at),
}))

export type UserMySQL = typeof users.$inferSelect
export type NewUserMySQL = typeof users.$inferInsert
export type PresentationMySQL = typeof presentations.$inferSelect
export type NewPresentationMySQL = typeof presentations.$inferInsert
export type PasswordResetTokenMySQL = typeof passwordResetTokens.$inferSelect
export type PresentationViewMySQL = typeof presentationViews.$inferSelect
export type NewPresentationViewMySQL = typeof presentationViews.$inferInsert
export type CalendarEventMySQL = typeof calendarEvents.$inferSelect
export type NewCalendarEventMySQL = typeof calendarEvents.$inferInsert
export type TaskMySQL = typeof tasks.$inferSelect
export type NewTaskMySQL = typeof tasks.$inferInsert
export type NotificationMySQL = typeof notifications.$inferSelect
export type NewNotificationMySQL = typeof notifications.$inferInsert