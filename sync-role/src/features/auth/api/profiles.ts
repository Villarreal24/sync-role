import { useQuery } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/core/api/client'

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string
  phone: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileUpdate {
  displayName?: string
  avatarUrl?: string
  phone?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  portfolioUrl?: string | null
}

interface ProfileResponse {
  id: string
  display_name: string
  avatar_url: string
  phone: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  created_at: string
  updated_at: string
}

interface ProfileUpdateRequest {
  display_name?: string
  avatar_url?: string
  phone?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
}

function toProfile(row: ProfileResponse): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    phone: row.phone ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    githubUrl: row.github_url ?? null,
    portfolioUrl: row.portfolio_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PROFILE_QUERY_KEY = ['profile'] as const

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
  if (update.phone !== undefined) body.phone = update.phone
  if (update.linkedinUrl !== undefined) body.linkedin_url = update.linkedinUrl
  if (update.githubUrl !== undefined) body.github_url = update.githubUrl
  if (update.portfolioUrl !== undefined) body.portfolio_url = update.portfolioUrl
  const data = await apiClient.patch<ProfileResponse>('/profiles/me', body)
  return toProfile(data)
}

/**
 * React Query hook that fetches the user profile.
 * Returns null when the profile row does not exist (new signups).
 */
export function useProfile() {
  return useQuery<Profile | null>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  })
}
