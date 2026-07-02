import { BACKEND_URL } from "./constants"
import { getAuthHeaders } from "./auth"
import type { ScrapeRequest, ScrapeResponse, JobPostingPayload } from "./types"

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers as Record<string, string> || {}),
    },
  })
  return res
}

export async function scrapePage(data: ScrapeRequest): Promise<ScrapeResponse> {
  const res = await fetchWithAuth(`${BACKEND_URL}/scrape`, {
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
  const res = await fetchWithAuth(`${BACKEND_URL}/jobs`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Create job failed (${res.status}): ${err}`)
  }
}
