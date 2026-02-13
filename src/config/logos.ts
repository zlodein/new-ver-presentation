/**
 * Версия логотипов. Увеличьте это число после замены файлов в public/images/logo/,
 * чтобы браузер загрузил новые картинки (обход кэша).
 */
export const LOGO_VERSION = '2'

export function logoUrl(path: string): string {
  return `/images/logo/${path}?v=${LOGO_VERSION}`
}
