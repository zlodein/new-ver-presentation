import { ref, computed } from 'vue'
import { getToken, setToken, api, hasApi, type AuthUser, type AuthResponse } from '@/api/client'

const token = ref<string | null>(getToken())
const user = ref<AuthUser | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && hasApi())
  const currentUser = computed(() => user.value)

  async function fetchUser() {
    if (!token.value || !hasApi()) return
    try {
      user.value = await api.get<AuthUser>('/api/auth/me')
    } catch {
      setToken(null)
      user.value = null
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
    setToken(res.token)
    token.value = res.token
    user.value = res.user
    return res.user
  }

  async function register(data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) {
    const res = await api.post<AuthResponse>('/api/auth/register', data)
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
