import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getTariffBlobFromStorage, setTariffBlobToStorage } from '../services/cms-settings-storage.js'

export type TariffSettingsBlob = Record<string, unknown>

export async function getTariffSettingsBlob(): Promise<TariffSettingsBlob> {
  return getTariffBlobFromStorage()
}

export async function setTariffSettingsBlob(data: TariffSettingsBlob): Promise<void> {
  await setTariffBlobToStorage(data)
}

export async function tariffSettingsRoutes(app: FastifyInstance) {
  /** GET /api/site/tariff-settings — публично: тексты и базовые цены для страницы тарифов */
  app.get('/api/site/tariff-settings', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await getTariffSettingsBlob()
      return reply.send({ settings })
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: 'Ошибка загрузки настроек тарифов' })
    }
  })
}
