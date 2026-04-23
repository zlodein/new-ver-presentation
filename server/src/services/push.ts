import webpush from 'web-push'
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let webPushConfigured = false
let firebaseConfigured = false

function ensureWebPushConfigured() {
  if (webPushConfigured) return
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:info@e-presentation.ru'
  if (!publicKey || !privateKey) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  webPushConfigured = true
}

function ensureFirebaseConfigured() {
  if (firebaseConfigured) return
  const projectId = process.env.FCM_PROJECT_ID
  const clientEmail = process.env.FCM_CLIENT_EMAIL
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      } as ServiceAccount),
    })
  }
  firebaseConfigured = true
}

export function getPushPublicKey(): string | null {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || null
}

export async function sendWebPush(subscription: { endpoint: string; p256dh?: string | null; auth?: string | null }, payload: Record<string, unknown>) {
  ensureWebPushConfigured()
  if (!webPushConfigured) return { ok: false, reason: 'web_push_not_configured' }
  if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) return { ok: false, reason: 'invalid_subscription' }
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { ok: true as const }
  } catch (err) {
    return { ok: false as const, reason: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendMobilePush(token: string, payload: { title: string; body?: string; data?: Record<string, string> }) {
  ensureFirebaseConfigured()
  if (!firebaseConfigured) return { ok: false, reason: 'firebase_not_configured' }
  try {
    await getMessaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body || '',
      },
      data: payload.data || {},
    })
    return { ok: true as const }
  } catch (err) {
    return { ok: false as const, reason: err instanceof Error ? err.message : String(err) }
  }
}
