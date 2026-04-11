import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PAGE_SETTINGS_PATH = path.join(__dirname, '../../data/page-settings.json')

export interface HomeSliderSlide {
  title: string
  description: string
  bgImageDesktop?: string | null
  bgImageMobile?: string | null
  buttons: { text: string; href: string }[]
}

export interface HomePageSettings {
  slider?: {
    slides: HomeSliderSlide[]
  }
}

/** Произвольный JSON на страницу (home, presentations, contacts и т.д.) */
type StoredPageBlob = Record<string, unknown>

async function loadPageSettings(): Promise<Record<string, StoredPageBlob>> {
  try {
    const raw = await fs.readFile(PAGE_SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw) as Record<string, StoredPageBlob>
  } catch {
    return {}
  }
}

async function savePageSettings(data: Record<string, StoredPageBlob>): Promise<void> {
  const dir = path.dirname(PAGE_SETTINGS_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(PAGE_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getPageSettings(pageId: string): Promise<StoredPageBlob | null> {
  const all = await loadPageSettings()
  const v = all[pageId]
  return v && typeof v === 'object' ? v : null
}

export async function setPageSettings(pageId: string, settings: StoredPageBlob): Promise<void> {
  const all = await loadPageSettings()
  all[pageId] = settings
  await savePageSettings(all)
}

export async function pageSettingsRoutes(app: FastifyInstance) {
  /** GET /api/site/pages/:pageId — публичный API, настройки страницы (без авторизации) */
  app.get<{ Params: { pageId: string } }>(
    '/api/site/pages/:pageId',
    async (req: FastifyRequest<{ Params: { pageId: string } }>, reply: FastifyReply) => {
      try {
        const { pageId } = req.params
        if (!pageId || !/^[a-z0-9_-]+$/.test(pageId)) {
          return reply.status(400).send({ error: 'Недопустимый pageId' })
        }
        const settings = await getPageSettings(pageId)
        return reply.send({ settings: settings ?? {} })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({ error: 'Ошибка загрузки настроек' })
      }
    }
  )
}
