import { getApiBase } from '@/api/client'

/** Полный URL аватара или null, если фото не задано (без заглушки-картинки). */
export function resolveUserImageUrl(userImg: string | null | undefined): string | null {
  const s = userImg?.trim()
  if (!s) return null
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  const path = s.startsWith('/') ? s : `/${s}`
  const base = getApiBase()
  return base ? `${base.replace(/\/$/, '')}${path}` : path
}

export function userInitialsFrom(u: {
  name?: string | null
  last_name?: string | null
  email?: string | null
}): string {
  const name = u.name || ''
  const last = u.last_name || ''
  let initials = ''
  if (name) initials += name.charAt(0).toUpperCase()
  if (last) initials += last.charAt(0).toUpperCase()
  if (!initials && u.email) initials = u.email.charAt(0).toUpperCase()
  return initials || '—'
}
