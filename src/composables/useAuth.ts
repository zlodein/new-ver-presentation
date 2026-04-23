import { ref, computed } from 'vue'
import { getToken, setToken, api, hasApi, type AuthUser, type AuthResponse } from '@/api/client'

const token = ref<string | null>(getToken())
const user = ref<AuthUser | null>(null)
let fetchUserInFlight: Promise<void> | null = null

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && hasApi())
  const currentUser = computed(() => user.value)

  async function fetchUser(): Promise<void> {
    const currentToken = getToken()
    if (!currentToken || !hasApi()) return
    if (fetchUserInFlight) return fetchUserInFlight
    const run = async () => {
      try {
        const next = await api.get<AuthUser>('/api/auth/me')
        token.value = getToken()
        user.value = next
      } catch {
        setToken(null)
        token.value = null
        user.value = null
      } finally {
        fetchUserInFlight = null
      }
    }
    fetchUserInFlight = run()
    return fetchUserInFlight
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
    if (res.twoFactorRequired && res.pendingToken) {
      return { twoFactorRequired: true, pendingToken: res.pendingToken } as unknown as AuthUser
    }
    if (!res.token || !res.user) {
      throw new Error('Некорректный ответ авторизации')
    }
    const authToken: string = res.token as string
    const authUser: AuthResponse['user'] = res.user as AuthResponse['user']
    setToken(authToken)
    token.value = authToken
    user.value = authUser ?? null
    return authUser as AuthUser
  }

  async function register(data: {
    email: string
    password: string
    name?: string
    last_name?: string
    middle_name?: string
    user_img?: string
  }) {
    const res = await api.post<AuthResponse & { pendingVerification?: boolean; email?: string }>('/api/auth/register', data)
    if (res.pendingVerification && res.email) {
      return { pendingVerification: true, email: res.email } as unknown as AuthUser
    }
    if (!res.token || !res.user) {
      throw new Error('Некорректный ответ регистрации')
    }
    setToken(res.token)
    token.value = res.token
    user.value = res.user
    return res.user
  }

  function logout() {
    setToken(null)
    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    isLoggedIn,
    currentUser,
    hasApi,
    fetchUser,
    login,
    register,
    logout,
  }
}
