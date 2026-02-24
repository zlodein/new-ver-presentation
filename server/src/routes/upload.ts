import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { db, useMysql, mysqlSchema } from '../db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Путь к папке с аватарами (относительно корня проекта)
const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars')
// Путь к папке с логотипами компаний
const COMPANY_LOGO_DIR = path.join(__dirname, '../../uploads/company-logo')
// Папка для изображений презентаций (храним файлы, в БД только URL)
const PRESENTATIONS_IMAGES_DIR = path.join(__dirname, '../../uploads/presentations')
// Папка для вложений тикетов поддержки
const SUPPORT_UPLOADS_DIR = path.join(__dirname, '../../uploads/support')

/** Удаляет папку с загруженными изображениями презентации (по id презентации). */
export async function deletePresentationImagesFolder(presentationId: string): Promise<void> {
  if (!presentationId || typeof presentationId !== 'string') return
  const safeId = presentationId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  const dir = path.join(PRESENTATIONS_IMAGES_DIR, safeId)
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch {
    // Папка может отсутствовать — игнорируем
  }
}

/** Удаляет папку с вложениями тикета поддержки (при удалении тикета или при статусе "решён"). */
export async function deleteSupportTicketFolder(ticketId: string): Promise<void> {
  if (!ticketId || typeof ticketId !== 'string') return
  const safeId = String(ticketId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  const dir = path.join(SUPPORT_UPLOADS_DIR, safeId)
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch {
    // Папка может отсутствовать — игнорируем
  }
}

/** Удаляет файл по пути из БД (например /uploads/avatars/123.jpg или /uploads/company-logo/logo.png). */
export async function deleteUploadFileByDbPath(dbPath: string | null | undefined): Promise<void> {
  if (!dbPath || typeof dbPath !== 'string' || !dbPath.startsWith('/uploads/')) return
  const relative = dbPath.replace(/^\//, '').replace(/\.\./g, '')
  if (!relative) return
  const filepath = path.join(__dirname, '../../', relative)
  try {
    await fs.unlink(filepath)
  } catch {
    // Файл может отсутствовать — игнорируем
  }
}

// Создать папку для аватаров, если её нет
async function ensureAvatarsDir() {
  try {
    await fs.access(AVATARS_DIR)
  } catch {
    await fs.mkdir(AVATARS_DIR, { recursive: true })
  }
}

// Создать папку для логотипов компаний, если её нет
async function ensureCompanyLogoDir() {
  try {
    await fs.access(COMPANY_LOGO_DIR)
  } catch {
    await fs.mkdir(COMPANY_LOGO_DIR, { recursive: true })
  }
}

async function ensurePresentationsImagesDir() {
  try {
    await fs.access(PRESENTATIONS_IMAGES_DIR)
  } catch {
    await fs.mkdir(PRESENTATIONS_IMAGES_DIR, { recursive: true })
  }
}

// Инициализировать папки при загрузке модуля (не блокируем запуск сервера)
ensureAvatarsDir().catch((err) => {
  console.error('[upload] Ошибка создания папки для аватаров:', err)
})
ensureCompanyLogoDir().catch((err) => {
  console.error('[upload] Ошибка создания папки для логотипов компаний:', err)
})
ensurePresentationsImagesDir().catch((err) => {
  console.error('[upload] Ошибка создания папки для изображений презентаций:', err)
})

export async function uploadRoutes(app: FastifyInstance) {
  // Загрузка аватара
  app.post<{ Body: { file?: unknown } }>(
    '/api/upload/avatar',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = req.user as { sub: string }
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) {
          return reply.status(401).send({ error: 'Не авторизован' })
        }

        const data = await req.file()
        if (!data) {
          return reply.status(400).send({ error: 'Файл не загружен' })
        }

        // Проверка типа файла
        if (!data.mimetype.startsWith('image/')) {
          return reply.status(400).send({ error: 'Файл должен быть изображением' })
        }

        // Ограничение размера (5MB)
        const maxSize = 5 * 1024 * 1024
        const buffer = await data.toBuffer()
        if (buffer.length > maxSize) {
          return reply.status(400).send({ error: 'Размер файла не должен превышать 5MB' })
        }

        // Создать папку, если её нет
        await ensureAvatarsDir()

        // Генерировать уникальное имя файла
        const ext = path.extname(data.filename || '.jpg')
        const filename = `${userId}_${Date.now()}${ext}`
        const filepath = path.join(AVATARS_DIR, filename)

        // Обработать и сохранить изображение (обрезать до квадрата, изменить размер до 400x400)
        await sharp(buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 90 })
          .toFile(filepath)

        // Путь для сохранения в БД (относительный от корня проекта)
        const dbPath = `/uploads/avatars/${filename}`

        // Обновить путь к аватару в базе данных
        if (useMysql) {
          await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
            .update(mysqlSchema.users)
            .set({ user_img: dbPath, updated_at: new Date() })
            .where(eq(mysqlSchema.users.id, userId))
        }

        return reply.send({
          success: true,
          url: dbPath,
          message: 'Аватар успешно загружен',
        })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({
          error: err instanceof Error ? err.message : 'Ошибка загрузки файла',
        })
      }
    }
  )

  // Загрузка логотипа компании
  app.post<{ Body: { file?: unknown } }>(
    '/api/upload/company-logo',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = req.user as { sub: string }
        const userId = Number(payload.sub)
        if (Number.isNaN(userId)) {
          return reply.status(401).send({ error: 'Не авторизован' })
        }

        const data = await req.file()
        if (!data) {
          return reply.status(400).send({ error: 'Файл не загружен' })
        }

        if (!data.mimetype.startsWith('image/')) {
          return reply.status(400).send({ error: 'Файл должен быть изображением' })
        }

        const maxSize = 5 * 1024 * 1024
        const buffer = await data.toBuffer()
        if (buffer.length > maxSize) {
          return reply.status(400).send({ error: 'Размер файла не должен превышать 5MB' })
        }

        await ensureCompanyLogoDir()

        const ext = path.extname(data.filename || '.jpg')
        const filename = `${userId}_${Date.now()}${ext}`
        const filepath = path.join(COMPANY_LOGO_DIR, filename)

        await sharp(buffer)
          .resize(400, 400, {
            fit: 'contain',
            position: 'center',
          })
          .jpeg({ quality: 90 })
          .toFile(filepath)

        const dbPath = `/uploads/company-logo/${filename}`

        return reply.send({
          success: true,
          url: dbPath,
          message: 'Логотип компании успешно загружен',
        })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({
          error: err instanceof Error ? err.message : 'Ошибка загрузки файла',
        })
      }
    }
  )

  // Загрузка изображения для презентации (в слайды) — сохраняем файл, возвращаем URL; в БД храним только URL
  app.post(
    '/api/upload/presentation-image',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await req.file()
        if (!data) {
          return reply.status(400).send({ error: 'Файл не загружен' })
        }
        if (!data.mimetype.startsWith('image/')) {
          return reply.status(400).send({ error: 'Файл должен быть изображением' })
        }
        const maxSize = 8 * 1024 * 1024 // 8MB на изображение
        const buffer = await data.toBuffer()
        if (buffer.length > maxSize) {
          return reply.status(400).send({ error: 'Размер файла не должен превышать 8MB' })
        }

        await ensurePresentationsImagesDir()

        const presentationId = (req.query as { presentationId?: string })?.presentationId || 'temp'
        const safeId = presentationId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
        const dir = path.join(PRESENTATIONS_IMAGES_DIR, safeId)
        await fs.mkdir(dir, { recursive: true })

        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`
        const filepath = path.join(dir, filename)

        try {
          await sharp(buffer).jpeg({ quality: 88 }).toFile(filepath)
        } catch {
          await fs.writeFile(filepath, buffer)
        }

        const dbPath = `/uploads/presentations/${safeId}/${filename}`

        return reply.send({ success: true, url: dbPath })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({
          error: err instanceof Error ? err.message : 'Ошибка загрузки изображения',
        })
      }
    }
  )

  // Загрузка файла для тикета поддержки (ticketId опционален: при создании заявки передать "new" или не передавать)
  app.post(
    '/api/upload/support-file',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const ticketIdRaw = (req.query as { ticketId?: string })?.ticketId?.trim()
        const payload = req.user as { sub: string }
        const userId = payload?.sub ?? 'anon'
        const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
        const ticketId = ticketIdRaw && ticketIdRaw !== 'new' ? ticketIdRaw : `_new_${safeUserId}_${Date.now()}`
        const data = await req.file()
        if (!data) {
          return reply.status(400).send({ error: 'Файл не загружен' })
        }
        const maxSize = 5 * 1024 * 1024
        const buffer = await data.toBuffer()
        if (buffer.length > maxSize) {
          return reply.status(400).send({ error: 'Размер файла не должен превышать 5MB' })
        }
        const safeId = ticketId.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 96)
        const dir = path.join(SUPPORT_UPLOADS_DIR, safeId)
        await fs.mkdir(dir, { recursive: true })
        const ext = path.extname(data.filename || '') || '.bin'
        const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '')
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${safeExt || '.bin'}`
        const filepath = path.join(dir, filename)
        await fs.writeFile(filepath, buffer)
        const dbPath = `/uploads/support/${safeId}/${filename}`
        return reply.send({ success: true, url: dbPath })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({
          error: err instanceof Error ? err.message : 'Ошибка загрузки файла',
        })
      }
    }
  )

  // Удаление аватара
  app.delete('/api/upload/avatar', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = req.user as { sub: string }
      const userId = Number(payload.sub)
      if (Number.isNaN(userId)) {
        return reply.status(401).send({ error: 'Не авторизован' })
      }

      // Получить текущий путь к аватару
      if (useMysql) {
        const user = await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>).query.users.findFirst({
          where: eq(mysqlSchema.users.id, userId),
          columns: { user_img: true },
        })

        // Удалить файл, если он существует
        if (user?.user_img) {
          const filepath = path.join(__dirname, '../../', user.user_img)
          try {
            await fs.unlink(filepath)
          } catch {
            // Игнорировать ошибку, если файл не найден
          }
        }

        // Очистить путь в БД
        await (db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>)
          .update(mysqlSchema.users)
          .set({ user_img: null, updated_at: new Date() })
          .where(eq(mysqlSchema.users.id, userId))
      }

      return reply.send({ success: true, message: 'Аватар удален' })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Ошибка удаления файла',
      })
    }
  })
}
