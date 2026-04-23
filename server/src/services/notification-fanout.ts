import { and, eq, isNull } from 'drizzle-orm'
import { db, useMysql } from '../db/index.js'
import * as pgSchema from '../db/schema.js'
import * as mysqlSchema from '../db/schema-mysql.js'
import { sendMobilePush, sendWebPush } from './push.js'

async function sendOneSignalPush(userId: string, payload: { title: string; message?: string; type?: string; sourceId?: string }): Promise<boolean> {
  const appId = process.env.ONESIGNAL_APP_ID?.trim()
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim()
  if (!appId || !restApiKey) return false

  const body = {
    app_id: appId,
    target_channel: 'push',
    include_aliases: { external_id: [userId] },
    headings: {
      en: payload.title,
      ru: payload.title,
    },
    contents: {
      en: payload.message?.trim() || payload.title,
      ru: payload.message?.trim() || payload.title,
    },
    data: {
      type: payload.type ?? 'info',
      sourceId: payload.sourceId ?? '',
    },
  }

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn('[onesignal] send failed', res.status, errText)
      return false
    }
    return true
  } catch (err) {
    console.warn('[onesignal] send failed', err)
    return false
  }
}

export async function fanoutNotificationToPush(userId: string, payload: { title: string; message?: string; type?: string; sourceId?: string }) {
  const sentViaOneSignal = await sendOneSignalPush(userId, payload)
  if (sentViaOneSignal) return

  if (!db) return
  if (useMysql) {
    const uid = Number(userId)
    if (Number.isNaN(uid)) return
    const mysqlDb = db as unknown as import('drizzle-orm/mysql2').MySql2Database<typeof mysqlSchema>
    const subs = await mysqlDb.query.userPushSubscriptions.findMany({
      where: and(eq(mysqlSchema.userPushSubscriptions.user_id, uid), isNull(mysqlSchema.userPushSubscriptions.revoked_at)),
    })
    const activeSessions = await mysqlDb.query.userSessions.findMany({
      where: eq(mysqlSchema.userSessions.user_id, uid),
      columns: { session_id: true },
    })
    const activeSessionIds = new Set(activeSessions.map((s) => s.session_id))
    for (const sub of subs) {
      if (!activeSessionIds.has(sub.session_id)) continue
      if (sub.platform === 'web') {
        await sendWebPush(
          { endpoint: sub.endpoint ?? '', p256dh: sub.p256dh ?? null, auth: sub.auth ?? null },
          { title: payload.title, body: payload.message ?? '', type: payload.type ?? 'info', sourceId: payload.sourceId ?? '' }
        )
      } else if (sub.token) {
        await sendMobilePush(sub.token, {
          title: payload.title,
          body: payload.message ?? '',
          data: { type: payload.type ?? 'info', sourceId: payload.sourceId ?? '' },
        })
      }
    }
    return
  }
  const pgDb = db as unknown as import('drizzle-orm/node-postgres').NodePgDatabase<typeof pgSchema>
  const subs = await pgDb.query.userPushSubscriptions.findMany({
    where: and(eq(pgSchema.userPushSubscriptions.userId, userId), isNull(pgSchema.userPushSubscriptions.revokedAt)),
  })
  const activeSessions = await pgDb.query.userSessions.findMany({
    where: eq(pgSchema.userSessions.userId, userId),
    columns: { sessionId: true },
  })
  const activeSessionIds = new Set(activeSessions.map((s) => s.sessionId))
  for (const sub of subs) {
    if (!activeSessionIds.has(sub.sessionId)) continue
    if (sub.platform === 'web') {
      await sendWebPush(
        { endpoint: sub.endpoint ?? '', p256dh: sub.p256dh ?? null, auth: sub.auth ?? null },
        { title: payload.title, body: payload.message ?? '', type: payload.type ?? 'info', sourceId: payload.sourceId ?? '' }
      )
    } else if (sub.token) {
      await sendMobilePush(sub.token, {
        title: payload.title,
        body: payload.message ?? '',
        data: { type: payload.type ?? 'info', sourceId: payload.sourceId ?? '' },
      })
    }
  }
}
