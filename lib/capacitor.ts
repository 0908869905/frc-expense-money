/**
 * Capacitor 環境偵測工具
 * 用於判斷 App 是否在 Capacitor WebView 中執行
 */

interface CapacitorGlobal {
  getPlatform?: () => string
  isNativePlatform?: () => boolean
}

function getCapacitor(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor
}

/**
 * 偵測目前是否在 Capacitor 原生 App 環境中
 */
export function isNativeApp(): boolean {
  return !!getCapacitor()
}

/**
 * 偵測是否為 iOS 平台
 */
export function isIOSApp(): boolean {
  const cap = getCapacitor()
  if (!cap) return false
  if (typeof cap.getPlatform === 'function') {
    return cap.getPlatform() === 'ios'
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * 偵測是否在一般瀏覽器中（非原生 App）
 */
export function isWebBrowser(): boolean {
  return !isNativeApp()
}
