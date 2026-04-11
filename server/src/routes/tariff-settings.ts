import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TARIFF_SETTINGS_PATH = path.join(__dirname, '../../data/tariff-settings.json')

export type TariffSettingsBlob = Record<string, unknown>

async function loadRaw(): Promise<TariffSettingsBlob> {
  try {
    const raw = await fs.readFile(TARIFF_SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as TariffSettingsBlob) : {}
  } catch {
    return {}
  }
}

async function saveRaw(data: TariffSettingsBlob): Promise<void> {
  const dir = path.dirname(TARIFF_SETTINGS_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(TARIFF_SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getTariffSettingsBlob(): Promise<TariffSettingsBlob> {
  return loadRaw()
}

export async function setTariffSettingsBlob(data: TariffSettingsBlob): Promise<void> {
  await saveRaw(data)
}

export async function tariffSettingsRoutes(app: FastifyInstance) {
  /** GET /api/site/tariff-settings — публично: тексты и базовые цены для страницы тарифов */
  app.get('/api/site/tariff-settings', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await loadRaw()
      return reply.send({ settings })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки настроек тарифов' })
    }
  })
}
