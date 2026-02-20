const API_BASE = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env?.VITE_API_URL?.replace(/\/$/, '') ?? ''
const IS_PROD = (import.meta as ImportMeta & { env: { PROD?: boolean } }).env?.PROD === true
const REQUEST_TIMEOUT_MS = 30000

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** API считается настроенным, если задан VITE_API_URL или это прод-сборка (запросы идут на тот же домен /api). */
export function hasApi(): boolean {
  return API_BASE.length > 0 || IS_PROD
}

/** Базовый URL API (для OAuth-редиректов и т.п.). В проде без VITE_API_URL — пустая строка (тот же домен). */
export function getApiBase(): string {
  return API_BASE
}

function buildUrl(path: string): string {
  const base = API_BASE
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const { method = 'GET', body, headers: optHeaders, signal: optSignal, ...rest } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(optHeaders as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const signal = optSignal ?? controller.signal
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  if (!optSignal) {
    timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  }
  const clearTimeoutOnce = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  signal.addEventListener('abort', clearTimeoutOnce, { once: true })

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal,
    ...rest,
  }

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body) as BodyInit
  }

  try {
    const res = await fetch(buildUrl(path), fetchOptions)
    clearTimeoutOnce()
    signal.removeEventListener('abort', clearTimeoutOnce)
    if (res.status === 204) return undefined as T
    const data = await res.json().catch(() => ({}))
    const errMsg = (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string')
      ? (data as { error: string }).error
      : res.statusText
    if (!res.ok) throw new ApiError(res.status, errMsg, data)
    return data as T
  } catch (err) {
    clearTimeoutOnce()
    signal.removeEventListener('abort', clearTimeoutOnce)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'Превышено время ожидания', undefined)
    }
    throw err
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Типы ответов API
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  last_name?: string | null
  middle_name?: string | null
  user_img?: string | null
  personal_phone?: string | null
  position?: string | null
  messengers?: Record<string, string> | null
  createdAt?: string
  tariff?: string | null
  testDriveUsed?: boolean
  /** Лимит презентаций на тарифе Эксперт (1–100) */
  expertPlanQuantity?: number
  /** Сколько презентаций уже создано (удалённые тоже считаются) */
  expertPresentationsUsed?: number
  // Для обратной совместимости
  firstName?: string | null
  lastName?: string | null
  // Регистрация: 'email' | 'google' | 'yandex' и т.д. — для отображения смены пароля
  auth_provider?: string | null
  // Работа
  company_name?: string | null
  work_position?: string | null
  role_id?: number | null
  company_logo?: string | null
  work_email?: string | null
  work_phone?: string | null
  work_website?: string | null
  /** Настройки подстановки данных в блок контактов при создании презентации */
  presentation_display_preferences?: PresentationDisplayPreferences | null
}

export interface PresentationDisplayPreferences {
  /** Фото или логотип: none | personal | company */
  avatarOrLogo?: 'none' | 'personal' | 'company'
  /** ФИО или название организации: none | personal | company */
  nameOrOrg?: 'none' | 'personal' | 'company'
  /** Выводить данные о себе (position) — устарело, использовать aboutType */
  showAbout?: boolean
  /** Что выводить в блоке «О себе»: none | about (position) | position (work_position) */
  aboutType?: 'none' | 'about' | 'position'
  /** Телефон: none | personal | work */
  phoneType?: 'none' | 'personal' | 'work'
  /** Выводить заполненные мессенджеры */
  showMessengers?: boolean
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface PresentationListItem {
  id: string
  title: string
  coverImage?: string
  updatedAt: string
  status?: string
}

export interface PresentationFull {
  id: string
  title: string
  coverImage?: string
  content: { slides: unknown[] }
  updatedAt: string
}
