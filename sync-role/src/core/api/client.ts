import { useAuthStore } from '@/features/auth/store/auth.store'

const API_BASE = import.meta.env.BACKEND_API_URL

/** Singleton mutex — 401 */
let refreshPromise: Promise<boolean> | null = null

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() / 1000 >= (payload.exp ?? 0)
  } catch {
    return true
  }
}

async function attemptTokenRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, clearAuth } = useAuthStore.getState()
  if (!refreshToken) {
    console.warn('[auth] no refresh token, clearing session')
    clearAuth('expired')
    return false
  }

  if (refreshPromise) {
    console.log('[auth] awaiting in-flight refresh...')
    return refreshPromise
  }

  refreshPromise = (async () => {
    console.log('[auth] attempting refresh...')
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.warn('[auth] refresh failed', res.status, text)
        clearAuth('expired')
        return false
      }
      const data = await res.json()
      console.log('[auth] refresh succeeded')
      setAuth(data.access_token, data.refresh_token, data.user)
      return true
    } catch (err) {
      console.error('[auth] refresh network error', err)
      clearAuth('expired')
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
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

/** Central request wrapper — pre-emptive refresh, 401 → retry, DELETE no body */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // 1. Pre-emptive refresh
  const preState = useAuthStore.getState()
  if (preState.token && isTokenExpired(preState.token)) {
    const ok = await attemptTokenRefresh()
    if (!ok) throw new AuthError('Session expired')
  }

  // 2. Build headers
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  // 3. Initial request
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  // 4. 401 → refresh + retry once
  if (res.status === 401) {
    const ok = await attemptTokenRefresh()
    if (!ok) throw new AuthError('Session expired')

    const newToken = useAuthStore.getState().token
    if (newToken) headers['Authorization'] = `Bearer ${newToken}`
    const retryRes = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    if (!retryRes.ok) {
      throw new ApiError(`${method} ${path} failed: ${retryRes.status}`, retryRes.status)
    }
    if (method === 'DELETE') return undefined as T
    return retryRes.json()
  }

  // 5. Non-auth error
  if (!res.ok) throw new ApiError(`${method} ${path} failed: ${res.status}`, res.status)

  // DELETE returns no body
  if (method === 'DELETE') return undefined as T
  return res.json()
}

export const apiClient = {
  get:    <T>(path: string)           => request<T>('GET', path),
  post:   <T>(path: string, b: unknown) => request<T>('POST', path, b),
  patch:  <T>(path: string, b: unknown) => request<T>('PATCH', path, b),
  delete: (path: string)              => request<void>('DELETE', path),
}
