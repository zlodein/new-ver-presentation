type OneSignalInitOptions = {
  appId: string
  safari_web_id?: string
  notifyButton?: { enable?: boolean }
  /** Относительный путь от корня сайта (без ведущего /). См. OneSignal Web SDK. */
  serviceWorkerPath?: string
  serviceWorkerParam?: { scope?: string }
}

type OneSignalInstance = {
  init: (options: OneSignalInitOptions) => Promise<void>
  login?: (externalId: string) => Promise<void>
  setExternalUserId?: (externalId: string) => Promise<void>
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>
    __ONESIGNAL_INIT_DONE__?: boolean
    __ONESIGNAL_INIT_PROMISE__?: Promise<void>
    __ONESIGNAL_LEGACY_SW_CLEANUP_PROMISE__?: Promise<void>
  }
}

const ONE_SIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined
const ONE_SIGNAL_SAFARI_WEB_ID = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID as string | undefined

function getDeferredQueue(): Array<(oneSignal: OneSignalInstance) => void | Promise<void>> {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  return window.OneSignalDeferred
}

function runWithOneSignal<T>(handler: (oneSignal: OneSignalInstance & Record<string, unknown>) => Promise<T> | T): Promise<T | null> {
  if (!ONE_SIGNAL_APP_ID) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    getDeferredQueue().push(async (oneSignal) => {
      try {
        const result = await handler(oneSignal as OneSignalInstance & Record<string, unknown>)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export function isOneSignalConfigured(): boolean {
  return Boolean(ONE_SIGNAL_APP_ID)
}

/** Старый кастомный SW (`/push-sw.js`) конфликтует с OneSignal на scope `/` — снимаем регистрацию. */
async function unregisterLegacyPushServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const regs = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    regs.map(async (reg) => {
      const url = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? ''
      if (url.includes('push-sw.js')) await reg.unregister()
    })
  )
}

export function initOneSignal(userId?: string): void {
  if (!ONE_SIGNAL_APP_ID) return
  getDeferredQueue().push(async (OneSignal) => {
    if (!window.__ONESIGNAL_INIT_DONE__ && !window.__ONESIGNAL_INIT_PROMISE__) {
      window.__ONESIGNAL_INIT_PROMISE__ = (async () => {
        try {
          if (!window.__ONESIGNAL_LEGACY_SW_CLEANUP_PROMISE__) {
            window.__ONESIGNAL_LEGACY_SW_CLEANUP_PROMISE__ = unregisterLegacyPushServiceWorkers()
          }
          await window.__ONESIGNAL_LEGACY_SW_CLEANUP_PROMISE__
          await OneSignal.init({
            appId: ONE_SIGNAL_APP_ID,
            safari_web_id: ONE_SIGNAL_SAFARI_WEB_ID,
            notifyButton: { enable: true },
            serviceWorkerPath: 'OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: '/' },
          })
          window.__ONESIGNAL_INIT_DONE__ = true
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('already initialized') || msg.includes('SDK already initialized')) {
            window.__ONESIGNAL_INIT_DONE__ = true
            return
          }
          if (msg.includes('Registration failed - storage error') || msg.includes('AbortError')) {
            console.warn('[onesignal] browser storage/service worker state is corrupted or blocked:', msg)
            return
          }
          throw err
        }
      })().finally(() => {
        window.__ONESIGNAL_INIT_PROMISE__ = undefined
      })
    }
    if (window.__ONESIGNAL_INIT_PROMISE__) {
      await window.__ONESIGNAL_INIT_PROMISE__
    }

    if (userId) {
      let bound = false
      if (OneSignal.login) {
        await OneSignal.login(userId)
        bound = true
      }
      if (!bound) {
        const userApi = (OneSignal as { User?: { addAlias?: (label: string, id: string) => Promise<void> } }).User
        if (userApi?.addAlias) {
          await userApi.addAlias('external_id', userId)
          bound = true
        }
      }
      if (!bound && OneSignal.setExternalUserId) {
        await OneSignal.setExternalUserId(userId)
      }
    }
  })
}

export async function getPushPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function getPushEnabledState(): Promise<boolean | null> {
  const result = await runWithOneSignal<boolean | null>(async (oneSignal) => {
    const pushSub = (oneSignal as { User?: { PushSubscription?: { optedIn?: boolean } } }).User?.PushSubscription
    if (typeof pushSub?.optedIn === 'boolean') return pushSub.optedIn
    return null
  })
  if (result !== null) return result
  const permission = await getPushPermissionState()
  return permission === 'granted'
}

export async function setPushEnabled(enabled: boolean): Promise<boolean> {
  const result = await runWithOneSignal<boolean>(async (oneSignal) => {
    const notifications = (oneSignal as { Notifications?: { requestPermission?: () => Promise<void> } }).Notifications
    const pushSub = (oneSignal as { User?: { PushSubscription?: { optIn?: () => Promise<void>; optOut?: () => Promise<void>; optedIn?: boolean } } }).User?.PushSubscription
    if (!pushSub) return false
    if (enabled) {
      if (Notification.permission === 'default') {
        await notifications?.requestPermission?.()
      }
      await pushSub.optIn?.()
      return pushSub.optedIn === true || Notification.permission === 'granted'
    }
    await pushSub.optOut?.()
    return false
  })
  return result === true
}
