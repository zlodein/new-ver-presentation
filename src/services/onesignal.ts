type OneSignalInstance = {
  init: (options: {
    appId: string
    safari_web_id?: string
    notifyButton?: { enable?: boolean }
  }) => Promise<void>
  login?: (externalId: string) => Promise<void>
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>
    __ONESIGNAL_INIT_DONE__?: boolean
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

export function initOneSignal(userId?: string): void {
  if (!ONE_SIGNAL_APP_ID) return
  getDeferredQueue().push(async (OneSignal) => {
    if (!window.__ONESIGNAL_INIT_DONE__) {
      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        safari_web_id: ONE_SIGNAL_SAFARI_WEB_ID,
        notifyButton: { enable: true },
      })
      window.__ONESIGNAL_INIT_DONE__ = true
    }

    if (userId && OneSignal.login) {
      await OneSignal.login(userId)
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
