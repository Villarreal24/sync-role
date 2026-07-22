import { BACKEND_URL } from "./constants"
import { getAuthHeaders } from "./auth"
import type { ScrapeRequest, ScrapeResponse, JobPostingPayload } from "./types"

/**
 * Centralized fetch wrapper for all extension API calls.
 *
 * Uses credentials: 'include' to send cookies with requests
 * (the httpOnly Supabase session cookie is sent automatically).
 * Falls back to injecting Cookie header from chrome.cookies API
 * when credentials: 'include' can't send cross-domain cookies
 * (extension on ATS → API on separate origin).
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers as Record<string, string> || {}),
    },
  })
}

export async function scrapePage(data: ScrapeRequest): Promise<ScrapeResponse> {
  const res = await apiFetch(`${BACKEND_URL}/scrape`, {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Scrape failed (${res.status}): ${err}`)
  }
  return res.json()
}

export async function createJob(data: JobPostingPayload): Promise<void> {
  const body = {
    title: data.title,
    company: data.company,
    sourceUrl: data.source_url,
    location: data.location,
    salary: data.salary,
    description: data.description,
    recruiterName: data.recruiter_name,
    publishedAt: data.published_at,
    employmentType: data.employment_type,
    workMode: data.work_mode,
    seniority: data.seniority,
    technologies: data.technologies,
  }
  const res = await apiFetch(`${BACKEND_URL}/jobs`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Create job failed (${res.status}): ${err}`)
  }
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string
  phone: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
}

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await apiFetch(`${BACKEND_URL}/profiles/me`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
