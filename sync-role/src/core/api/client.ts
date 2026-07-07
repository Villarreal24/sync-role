import { useAuthStore } from '@/features/auth/store/auth.store'

const API_BASE = import.meta.env.BACKEND_API_URL

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function attemptTokenRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, clearAuth } = useAuthStore.getState()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      clearAuth()
      return false
    }
    const data = await res.json()
    setAuth(data.access_token, data.refresh_token, data.user)
    return true
  } catch {
    clearAuth()
    return false
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export { AuthError, ApiError }

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, { headers: { ...getAuthHeaders() } })
    if (res.status === 401) {
      const refreshed = await attemptTokenRefresh()
      if (!refreshed) throw new AuthError('Session expired')
      return apiClient.get<T>(path)
    }
    if (!res.ok) throw new ApiError(`GET ${path} failed: ${res.status}`, res.status)
    return res.json()
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    })
    if (res.status === 401) {
      const refreshed = await attemptTokenRefresh()
      if (!refreshed) throw new AuthError('Session expired')
      return apiClient.post<T>(path, body)
    }
    if (!res.ok) throw new ApiError(`POST ${path} failed: ${res.status}`, res.status)
    return res.json()
  },

  patch: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    })
    if (res.status === 401) {
      const refreshed = await attemptTokenRefresh()
      if (!refreshed) throw new AuthError('Session expired')
      return apiClient.patch<T>(path, body)
    }
    if (!res.ok) throw new ApiError(`PATCH ${path} failed: ${res.status}`, res.status)
    return res.json()
  },

  delete: async (path: string): Promise<void> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    if (res.status === 401) {
      const refreshed = await attemptTokenRefresh()
      if (!refreshed) throw new AuthError('Session expired')
      return apiClient.delete(path)
    }
    if (!res.ok) throw new ApiError(`DELETE ${path} failed: ${res.status}`, res.status)
  },
}
