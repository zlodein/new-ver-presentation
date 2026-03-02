import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_SETTINGS_PATH = path.join(__dirname, '../../data/site-settings.json')

export interface SiteSettings {
  siteDisabled?: boolean
}

async function loadSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(SITE_SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw) as SiteSettings
  } catch {
    return {}
  }
}

async function saveSiteSettings(data: SiteSettings): Promise<void> {
  const dir = path.dirname(SITE_SETTINGS_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(SITE_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return loadSiteSettings()
}

export async function setSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const current = await loadSiteSettings()
  await saveSiteSettings({ ...current, ...settings })
}

export async function siteSettingsRoutes(app: FastifyInstance) {
  /** GET /api/site/status — публичный, статус сайта (включён/отключён для всех кроме админа) */
  app.get('/api/site/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await loadSiteSettings()
      return reply.send({ siteDisabled: !!settings.siteDisabled })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Ошибка' })
    }
  })
}
