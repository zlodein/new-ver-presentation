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
  user_img: varchar('user_img', { length: 512 }),
  personal_phone: varchar('personal_phone', { length: 30 }),
  birthday: varchar('birthday', { length: 20 }), // YYYY-MM-DD
  gender: varchar('gender', { length: 20 }), // male | female
  position: varchar('position', { length: 255 }),
  messengers: longtext('messengers'), // JSON строка
  workplace: varchar('workplace', { length: 255 }), // в БД: workplace; в API отдаём как company_name
  work_position: varchar('work_position', { length: 255 }),
  company_logo: varchar('company_logo', { length: 255 }),
  work_email: varchar('work_email', { length: 255 }),
  work_phone: varchar('work_phone', { length: 20 }),
  work_website: varchar('work_website', { length: 512 }),
  presentation_display_preferences: longtext('presentation_display_preferences'), // JSON: настройки подстановки в блок контактов
  auth_provider: varchar('auth_provider', { length: 50 }), // yandex | vk | google | ... — при входе через соцсети
  email_verified: varchar('email_verified', { length: 10 }).notNull().default('false'), // 'true' | 'false' для регистрации через почту
  role_id: int('role_id').default(1),
  last_login_at: timestamp('last_login_at'),
  is_active: int('is_active', { unsigned: true }).default(1),
  tariff: varchar('tariff', { length: 20 }), // null | test_drive | expert
  test_drive_used: varchar('test_drive_used', { length: 10 }).notNull().default('false'), // 'true' | 'false'
  expert_plan_quantity: int('expert_plan_quantity', { unsigned: true }).default(1), // лимит презентаций на тарифе Эксперт (1–100)
  expert_presentations_used: int('expert_presentations_used', { unsigned: true }).notNull().default(0), // сколько уже создано (удалённые тоже считаются)
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
  short_id: varchar('short_id', { length: 6 }), // 6 символов A-Z0-9 для тех. поддержки
  theme_color: varchar('theme_color', { length: 7 }), // цвет темы, напр. #2c7f8d
  template_id: varchar('template_id', { length: 50 }), // id шаблона из smart-templates (elite, apartment, commercial, general)
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  deleted_at: timestamp('deleted_at'), // мягкое удаление; храним месяц, затем можно удалять
}, (table) => ({
  deletedAtIdx: index('presentations_deleted_at_idx').on(table.deleted_at),
  userIdx: index('presentations_user_id_idx').on(table.user_id),
  updatedIdx: index('presentations_updated_at_idx').on(table.updated_at),
  publicHashIdx: uniqueIndex('idx_public_hash').on(table.public_hash),
  shortIdIdx: uniqueIndex('idx_presentations_short_id').on(table.short_id),
}))

export const userSessions = mysqlTable('user_sessions', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  session_id: varchar('session_id', { length: 64 }).notNull(),
  user_agent: varchar('user_agent', { length: 512 }),
  ip: varchar('ip', { length: 45 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 120 }),
  lat: varchar('lat', { length: 20 }),
  lng: varchar('lng', { length: 20 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_sessions_user_id_idx').on(table.user_id),
  sessionIdIdx: index('user_sessions_session_id_idx').on(table.session_id),
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

export const verificationCodes = mysqlTable('verification_codes', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: varchar('type', { length: 32 }).notNull().default('email_verification'),
  user_id: int('user_id', { unsigned: true }),
  expires_at: datetime('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('verification_codes_email_idx').on(table.email),
  expiresIdx: index('verification_codes_expires_idx').on(table.expires_at),
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

export const supportRequests = mysqlTable('support_requests', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: longtext('message'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | solved
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index('support_requests_user_id_idx').on(table.user_id),
  createdAtIdx: index('support_requests_created_at_idx').on(table.created_at),
}))

export const supportReplies = mysqlTable('support_replies', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  support_request_id: int('support_request_id', { unsigned: true }).notNull().references(() => supportRequests.id, { onDelete: 'cascade' }),
  user_id: int('user_id', { unsigned: true }).notNull(),
  message: longtext('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  requestIdIdx: index('support_replies_request_id_idx').on(table.support_request_id),
}))

/** Компании/агентства: владелец и единая библиотека ресурсов (логотипы, шрифты, палитра, иконки). */
export const companies = mysqlTable('companies', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  user_id: int('user_id', { unsigned: true }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull().default(''),
  resources: longtext('resources'), // JSON: { logos: string[], fonts: string[], palette: Record<string, string>, icons: string[] }
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index('companies_user_id_idx').on(table.user_id),
}))

/** Именованные шаблоны групп слайдов (админка «Слайды»): JSON { slides, settings } */
export const templates = mysqlTable('templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  content: longtext('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdIdx: index('templates_created_at_idx').on(table.created_at),
}))

/** Библиотека фигур (геометрия/контур), без стилей/координат. */
export const figures = mysqlTable('figures', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  kind: varchar('kind', { length: 50 }).notNull(), // rect | ellipse | polygon
  geometry: longtext('geometry').notNull(), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdIdx: index('figures_created_at_idx').on(table.created_at),
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
export type SupportRequestMySQL = typeof supportRequests.$inferSelect
export type NewSupportRequestMySQL = typeof supportRequests.$inferInsert
export type SupportReplyMySQL = typeof supportReplies.$inferSelect
export type NewSupportReplyMySQL = typeof supportReplies.$inferInsert
export type CompanyMySQL = typeof companies.$inferSelect
export type NewCompanyMySQL = typeof companies.$inferInsert
export type TemplateMySQL = typeof templates.$inferSelect
export type NewTemplateMySQL = typeof templates.$inferInsert
export type FigureMySQL = typeof figures.$inferSelect
export type NewFigureMySQL = typeof figures.$inferInsert
export type UserSessionMySQL = typeof userSessions.$inferSelect
export type NewUserSessionMySQL = typeof userSessions.$inferInsert