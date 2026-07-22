const API_BASE = import.meta.env.BACKEND_API_URL

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
