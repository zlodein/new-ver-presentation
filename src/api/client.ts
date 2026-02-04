const API_BASE = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env?.VITE_API_URL?.replace(/\/$/, '') ?? ''

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function hasApi(): boolean {
  return API_BASE.length > 0
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body, headers: optHeaders, ...rest } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(optHeaders as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...rest,
  }

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body) as BodyInit
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOptions)

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data)
  return data as T
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
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Типы ответов API
export interface AuthUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  createdAt?: string
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
}

export interface PresentationFull {
  id: string
  title: string
  coverImage?: string
  content: { slides: unknown[] }
  updatedAt: string
}
