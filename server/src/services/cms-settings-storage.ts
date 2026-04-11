/**
 * Хранение настроек CMS (страницы, тарифы, флаги сайта) в БД с fallback на JSON-файлы
 * при отсутствии DATABASE_URL (файловое хранилище).
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { db, useFileStore, useMysql, usePg } from '../db/index.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import * as pgSchema from '../db/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../../data')
const PAGE_SETTINGS_PATH = path.join(DATA_DIR, 'page-settings.json')
const SITE_SETTINGS_PATH = path.join(DATA_DIR, 'site-settings.json')
const TARIFF_SETTINGS_PATH = path.join(DATA_DIR, 'tariff-settings.json')

export const CMS_KEY_SITE = 'site'
export const CMS_KEY_TARIFFS = 'tariffs'

export function cmsKeyPage(pageId: string): string {
  return `page_${pageId}`
}

function isMissingTableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /doesn't exist|does not exist|Unknown table|relation .* does not exist|no such table/i.test(msg)
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function upsertMysql(key: string, payload: Record<string, unknown>): Promise<void> {
  const mysqlDb = db as unknown as MySql2Database<typeof mysqlSchema>
  const str = JSON.stringify(payload)
  const existing = await mysqlDb
    .select()
    .from(mysqlSchema.cmsSettings)
    .where(eq(mysqlSchema.cmsSettings.key, key))
    .limit(1)
  if (existing.length) {
    await mysqlDb
      .update(mysqlSchema.cmsSettings)
      .set({ payload: str })
      .where(eq(mysqlSchema.cmsSettings.key, key))
  } else {
    await mysqlDb.insert(mysqlSchema.cmsSettings).values({ key, payload: str })
  }
}

async function upsertPg(key: string, payload: Record<string, unknown>): Promise<void> {
  const pgDb = db as unknown as NodePgDatabase<typeof pgSchema>
  const existing = await pgDb
    .select()
    .from(pgSchema.cmsSettings)
    .where(eq(pgSchema.cmsSettings.key, key))
    .limit(1)
  if (existing.length) {
    await pgDb
      .update(pgSchema.cmsSettings)
      .set({ payload, updatedAt: new Date() })
      .where(eq(pgSchema.cmsSettings.key, key))
  } else {
    await pgDb.insert(pgSchema.cmsSettings).values({ key, payload, updatedAt: new Date() })
  }
}

export async function upsertCmsPayload(key: string, payload: Record<string, unknown>): Promise<void> {
  if (!db || useFileStore) {
    throw new Error('upsertCmsPayload: база данных недоступна')
  }
  try {
    if (useMysql) await upsertMysql(key, payload)
    else if (usePg) await upsertPg(key, payload)
  } catch (err) {
    if (isMissingTableError(err)) {
      console.error(
        '[cms_settings] Таблица cms_settings отсутствует. Выполните миграцию: server/sql/migrate_cms_settings.sql (MySQL) или migrate_cms_settings_pg.sql (PostgreSQL).'
      )
    }
    throw err
  }
}

async function getMysql(key: string): Promise<Record<string, unknown> | null> {
  const mysqlDb = db as unknown as MySql2Database<typeof mysqlSchema>
  const rows = await mysqlDb
    .select()
    .from(mysqlSchema.cmsSettings)
    .where(eq(mysqlSchema.cmsSettings.key, key))
    .limit(1)
  if (!rows.length) return null
  const p = rows[0].payload
  if (typeof p === 'string') {
    try {
      return JSON.parse(p) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return p as Record<string, unknown>
}

async function getPg(key: string): Promise<Record<string, unknown> | null> {
  const pgDb = db as unknown as NodePgDatabase<typeof pgSchema>
  const rows = await pgDb
    .select()
    .from(pgSchema.cmsSettings)
    .where(eq(pgSchema.cmsSettings.key, key))
    .limit(1)
  if (!rows.length) return null
  return rows[0].payload as Record<string, unknown>
}

export async function getCmsPayload(key: string): Promise<Record<string, unknown> | null> {
  if (!db || useFileStore) return null
  try {
    if (useMysql) return await getMysql(key)
    if (usePg) return await getPg(key)
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn('[cms_settings] Таблица не найдена, используется файловый fallback до миграции.')
      return null
    }
    throw err
  }
  return null
}

// ——— Однократный импорт из legacy JSON в БД ———

let pageFileImported = false
let siteFileImported = false
let tariffFileImported = false

async function importPageSettingsFileOnce(): Promise<void> {
  if (!db || useFileStore || pageFileImported) return
  const all = await readJsonFile<Record<string, Record<string, unknown>>>(PAGE_SETTINGS_PATH)
  if (!all || typeof all !== 'object') {
    pageFileImported = true
    return
  }
  try {
    for (const [pageId, blob] of Object.entries(all)) {
      if (blob && typeof blob === 'object') {
        await upsertCmsPayload(cmsKeyPage(pageId), blob as Record<string, unknown>)
      }
    }
    pageFileImported = true
  } catch {
    pageFileImported = true
  }
}

async function importSiteSettingsFileOnce(): Promise<void> {
  if (!db || useFileStore || siteFileImported) return
  const data = await readJsonFile<Record<string, unknown>>(SITE_SETTINGS_PATH)
  if (!data || typeof data !== 'object') {
    siteFileImported = true
    return
  }
  try {
    await upsertCmsPayload(CMS_KEY_SITE, data)
    siteFileImported = true
  } catch {
    siteFileImported = true
  }
}

async function importTariffSettingsFileOnce(): Promise<void> {
  if (!db || useFileStore || tariffFileImported) return
  const data = await readJsonFile<Record<string, unknown>>(TARIFF_SETTINGS_PATH)
  if (!data || typeof data !== 'object') {
    tariffFileImported = true
    return
  }
  try {
    await upsertCmsPayload(CMS_KEY_TARIFFS, data)
    tariffFileImported = true
  } catch {
    tariffFileImported = true
  }
}

/** Публичный API страниц: чтение настроек одной страницы. */
export async function getPageBlobFromStorage(pageId: string): Promise<Record<string, unknown> | null> {
  if (db && !useFileStore) {
    try {
      await importPageSettingsFileOnce()
      const row = await getCmsPayload(cmsKeyPage(pageId))
      if (row !== null) return row
    } catch (err) {
      if (!isMissingTableError(err)) throw err
    }
  }
  const all = await readJsonFile<Record<string, Record<string, unknown>>>(PAGE_SETTINGS_PATH)
  if (!all) return null
  const v = all[pageId]
  return v && typeof v === 'object' ? v : null
}

export async function setPageBlobToStorage(pageId: string, settings: Record<string, unknown>): Promise<void> {
  if (db && !useFileStore) {
    try {
      await upsertCmsPayload(cmsKeyPage(pageId), settings)
      return
    } catch (err) {
      if (!isMissingTableError(err)) throw err
      console.warn('[cms_settings] Fallback на файл page-settings.json')
    }
  }
  const all = (await readJsonFile<Record<string, Record<string, unknown>>>(PAGE_SETTINGS_PATH)) ?? {}
  all[pageId] = settings
  await writeJsonFile(PAGE_SETTINGS_PATH, all)
}

export async function getSiteBlobFromStorage(): Promise<Record<string, unknown>> {
  if (db && !useFileStore) {
    try {
      await importSiteSettingsFileOnce()
      const row = await getCmsPayload(CMS_KEY_SITE)
      if (row !== null) return row
    } catch (err) {
      if (!isMissingTableError(err)) throw err
    }
  }
  return (await readJsonFile<Record<string, unknown>>(SITE_SETTINGS_PATH)) ?? {}
}

export async function mergeSiteBlobToStorage(partial: Record<string, unknown>): Promise<void> {
  const current = await getSiteBlobFromStorage()
  const next = { ...current, ...partial }
  if (db && !useFileStore) {
    try {
      await upsertCmsPayload(CMS_KEY_SITE, next)
      return
    } catch (err) {
      if (!isMissingTableError(err)) throw err
    }
  }
  await writeJsonFile(SITE_SETTINGS_PATH, next)
}

export async function getTariffBlobFromStorage(): Promise<Record<string, unknown>> {
  if (db && !useFileStore) {
    try {
      await importTariffSettingsFileOnce()
      const row = await getCmsPayload(CMS_KEY_TARIFFS)
      if (row !== null) return row
    } catch (err) {
      if (!isMissingTableError(err)) throw err
    }
  }
  return (await readJsonFile<Record<string, unknown>>(TARIFF_SETTINGS_PATH)) ?? {}
}

export async function setTariffBlobToStorage(data: Record<string, unknown>): Promise<void> {
  if (db && !useFileStore) {
    try {
      await upsertCmsPayload(CMS_KEY_TARIFFS, data)
      return
    } catch (err) {
      if (!isMissingTableError(err)) throw err
    }
  }
  await writeJsonFile(TARIFF_SETTINGS_PATH, data)
}
