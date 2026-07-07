import { apiClient, ApiError } from '@/core/api/client'

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

/**
 * Fetch the authenticated user's profile.
 * Returns null when the profile row does not exist yet (Supabase signup
 * with RLS does not auto-create the row — the backend /profiles/me
 * returns 404 in that case).
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const data = await apiClient.get<ProfileResponse>('/profiles/me')
    return toProfile(data)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function updateProfile(update: ProfileUpdate): Promise<Profile> {
  const body: ProfileUpdateRequest = {}
  if (update.displayName !== undefined) body.display_name = update.displayName
  if (update.avatarUrl !== undefined) body.avatar_url = update.avatarUrl
  const data = await apiClient.patch<ProfileResponse>('/profiles/me', body)
  return toProfile(data)
}
