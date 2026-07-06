export interface Profile {
  id: string
  displayName: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface ProfileUpdate {
  displayName?: string
  avatarUrl?: string
}

interface ProfileResponse {
  id: string
  display_name: string
  avatar_url: string
  created_at: string
  updated_at: string
}

interface ProfileUpdateRequest {
  display_name?: string
  avatar_url?: string
}

function toProfile(row: ProfileResponse): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

import { useAuthStore } from '../store/auth.store'

const API_BASE = import.meta.env.BACKEND_API_URL

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export async function getProfile(): Promise<Profile | null> {
  const res = await fetch(`${API_BASE}/api/v1/profiles/me`, {
    headers: { ...getAuthHeaders() },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET /profiles/me failed: ${res.status}`)
  const data: ProfileResponse = await res.json()
  return toProfile(data)
}

export async function updateProfile(update: ProfileUpdate): Promise<Profile> {
  const body: ProfileUpdateRequest = {}
  if (update.displayName !== undefined) body.display_name = update.displayName
  if (update.avatarUrl !== undefined) body.avatar_url = update.avatarUrl
  const res = await fetch(`${API_BASE}/api/v1/profiles/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH /profiles/me failed: ${res.status}`)
  const data: ProfileResponse = await res.json()
  return toProfile(data)
}
