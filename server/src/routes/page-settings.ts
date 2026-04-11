import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  getPageBlobFromStorage,
  setPageBlobToStorage,
} from '../services/cms-settings-storage.js'

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
export type StoredPageBlob = Record<string, unknown>

export async function getPageSettings(pageId: string): Promise<StoredPageBlob | null> {
  return getPageBlobFromStorage(pageId)
}

export async function setPageSettings(pageId: string, settings: StoredPageBlob): Promise<void> {
  await setPageBlobToStorage(pageId, settings)
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
