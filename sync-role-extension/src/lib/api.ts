import { BACKEND_URL } from "./constants"
import { getAuthHeaders, refreshStoredToken, clearStoredToken } from "./auth"
import type { ScrapeRequest, ScrapeResponse, JobPostingPayload } from "./types"

/**
 * Centralized fetch wrapper for all extension API calls.
 *
 * Handles for every request:
 * - Auth header injection (Bearer token from chrome.storage)
 * - 401 → refresh token → retry once
 * - 401 after refresh fails → clear stored tokens
 *
 * Consumers still check `res.ok` for their specific error handling.
 * This keeps the retry logic in ONE place instead of per-endpoint.
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()

  const doFetch = (extraHeaders: Record<string, string>): Promise<Response> =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    })

  let res = await doFetch(authHeaders)

  if (res.status === 401) {
    const newToken = await refreshStoredToken()
    if (newToken) {
      res = await doFetch({ Authorization: `Bearer ${newToken}` })
    } else {
      await clearStoredToken()
    }
  }

  return res
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
 *
 * Error handling by status code:
 * - 401 → handled centrally by apiFetch (refresh + retry or clear tokens)
 * - 404 → expected for new sign-ups, returns null silently.
 * - 400, 403, 500 → returns null silently (auxiliary feature).
 * - Network error → returns null silently.
 */
export async function fetchProfile(): Promise<Profile | null> {
  try {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) return null

    const res = await apiFetch(`${BACKEND_URL}/profiles/me`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
