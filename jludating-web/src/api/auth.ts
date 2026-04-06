import axios from 'axios'
import type { AxiosError } from 'axios'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import { apiClient } from './client'

const TOKEN_KEY = 'jludating_access_token'
const REFRESH_KEY = 'jludating_refresh_token'
const SESSION_KEY = 'jludating_session'

/** 从 localStorage 恢复 token */
export function restoreTokens(): {
  accessToken: string | null
  refreshToken: string | null
} {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

/** 保存 tokens 到 localStorage */
export function saveTokens(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.accessToken)
  localStorage.setItem(REFRESH_KEY, session.refreshToken)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

/** 清除 tokens（logout 时） */
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(SESSION_KEY)
  // 同时清除 zustand/persist 的持久化 key
  localStorage.removeItem('jludating-auth')
}

/** 获取缓存的 session */
export function getCachedSession(): AuthSession | null {
  // 优先从 jludating_session 读（saveTokens 写入），兼容 zustand/persist
  const raw = localStorage.getItem(SESSION_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      // ignore
    }
  }
  // fallback: 从 zustand/persist 的 key 读
  const zustandRaw = localStorage.getItem('jludating-auth')
  if (zustandRaw) {
    try {
      const parsed = JSON.parse(zustandRaw) as { state?: { session?: AuthSession } }
      return parsed?.state?.session ?? null
    } catch {
      return null
    }
  }
  return null
}

// ─── Request interceptor：自动附加 access token ─────────────────────────────
apiClient.interceptors.request.use((config) => {
  const { accessToken } = restoreTokens()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── Response interceptor：401 时尝试 refresh ───────────────────────────────
let _isRefreshing = false
let _refreshSubscribers: Array<(token: string) => void> = []

function subscribeRefresh(cb: (token: string) => void) {
  _refreshSubscribers.push(cb)
}

function notifyRefreshed(token: string) {
  _refreshSubscribers.forEach(cb => cb(token))
  _refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as import('axios').AxiosRequestConfig & { _retry?: boolean }
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    const { refreshToken } = restoreTokens()
    if (!refreshToken) {
      clearTokens()
      window.location.replace('/login')
      return Promise.reject(error)
    }

    // 防止并发多个 refresh 请求
    if (_isRefreshing) {
      return new Promise((resolve) => {
        subscribeRefresh((newToken) => {
          original.headers!.Authorization = `Bearer ${newToken}`
          resolve(apiClient(original))
        })
      })
    }

    _isRefreshing = true
    try {
      // 使用 apiClient 保持统一 baseURL
      const { data } = await apiClient.post<AuthSession>('/auth/refresh', { refreshToken })
      saveTokens(data)
      // 同步更新 zustand store（避免循环依赖用动态 import）
      import('@/stores/use-auth-store').then(({ useAuthStore }) => {
        useAuthStore.getState().setSession(data)
      })
      notifyRefreshed(data.accessToken)
      original.headers!.Authorization = `Bearer ${data.accessToken}`
      return apiClient(original)
    } catch {
      clearTokens()
      import('@/stores/use-auth-store').then(({ useAuthStore }) => {
        useAuthStore.getState().setSession(null)
      })
      window.location.replace('/login')
      return Promise.reject(error)
    } finally {
      _isRefreshing = false
    }
  },
)

// ─── 忽略未使用的 axios import（仅保留类型用途）─────────────────────────────
void axios // keep import to avoid removing by tree-shaking during type usage

export const authApi = {
  sendCode: async (email: string) => {
    const { data } = await apiClient.post<{ message: string; allowed: boolean }>('/auth/send-code', { email })
    return data
  },

  verifyCode: async (email: string, code: string) => {
    const { data } = await apiClient.post<{ email: string; verified: boolean }>('/auth/verify-code', {
      email,
      code,
    })
    return data
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<AuthSession>('/auth/register', payload)
    saveTokens(data)
    return data
  },

  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<AuthSession>('/auth/login', payload)
    saveTokens(data)
    return data
  },

  logout: async () => {
    const { refreshToken } = restoreTokens()
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } finally {
      clearTokens()
    }
  },
}
