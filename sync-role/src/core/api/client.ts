const API_BASE = import.meta.env.BACKEND_API_URL

interface SessionUser {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
}

interface SessionResponse {
  user: SessionUser | null
  session: { access_token: string } | null
}

/**
 * Fetch the current session from the backend's /auth/session endpoint.
 *
 * The backend reads the httpOnly Supabase session cookie and validates
 * the access_token with Supabase. This avoids needing document.cookie
 * access to httpOnly cookies which browsers block.
 *
 * Returns minimal session info needed for auth state and API calls.
 */
export async function fetchSession(): Promise<{ user: SessionUser | null; accessToken: string | null }> {
  const API_BASE = import.meta.env.BACKEND_API_URL
  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      credentials: 'include',
    })
    if (!res.ok) return { user: null, accessToken: null }
    const data: SessionResponse = await res.json()
    if (!data.user || !data.session) return { user: null, accessToken: null }
    return { user: data.user, accessToken: data.session.access_token }
  } catch {
    return { user: null, accessToken: null }
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

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (res.status === 401) {
    if (isBrowser()) {
      // Redirect to auth page — session expired or not logged in
      window.location.href = '/auth'
    }
    throw new AuthError('Session expired')
  }

  if (!res.ok) {
    throw new ApiError(`${method} ${path} failed: ${res.status}`, res.status)
  }

  if (method === 'DELETE') return undefined as T
  return res.json()
}

export const apiClient = {
  get:    <T>(path: string)           => request<T>('GET', path),
  post:   <T>(path: string, b: unknown) => request<T>('POST', path, b),
  patch:  <T>(path: string, b: unknown) => request<T>('PATCH', path, b),
  delete: (path: string)              => request<void>('DELETE', path),
}
