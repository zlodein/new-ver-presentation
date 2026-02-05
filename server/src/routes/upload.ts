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

// Создать папку для аватаров, если её нет
async function ensureAvatarsDir() {
  try {
    await fs.access(AVATARS_DIR)
  } catch {
    await fs.mkdir(AVATARS_DIR, { recursive: true })
  }
}

// Инициализировать папку при загрузке модуля (не блокируем запуск сервера)
ensureAvatarsDir().catch((err) => {
  console.error('[upload] Ошибка создания папки для аватаров:', err)
})

export async function uploadRoutes(app: FastifyInstance) {
  // Загрузка аватара
  app.post<{ Body: { file: any } }>(
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
