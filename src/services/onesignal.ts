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

export function initOneSignal(userId?: string): void {
  if (!ONE_SIGNAL_APP_ID) return
  window.OneSignalDeferred = window.OneSignalDeferred || []

  window.OneSignalDeferred.push(async (OneSignal) => {
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
