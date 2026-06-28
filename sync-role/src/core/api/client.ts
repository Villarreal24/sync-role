const API_BASE = 'http://localhost:8000/api/v1'

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return res.json()
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
    return res.json()
  },

  patch: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
    return res.json()
  },

  delete: async (path: string): Promise<void> => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
  },
}
