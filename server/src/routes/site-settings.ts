import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getSiteBlobFromStorage, mergeSiteBlobToStorage } from '../services/cms-settings-storage.js'

export interface SiteSettings {
  siteDisabled?: boolean
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const b = await getSiteBlobFromStorage()
  return b as SiteSettings
}

export async function setSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  await mergeSiteBlobToStorage(settings as Record<string, unknown>)
}

export async function siteSettingsRoutes(app: FastifyInstance) {
  /** GET /api/site/status — публичный, статус сайта (включён/отключён для всех кроме админа) */
  app.get('/api/site/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await getSiteSettings()
      return reply.send({ siteDisabled: !!settings.siteDisabled })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Ошибка' })
    }
  })
}
