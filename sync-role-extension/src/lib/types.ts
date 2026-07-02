export interface ScrapeRequest {
  url: string
  page_content: string
}

export interface ScrapeResponse {
  title: string
  company: string
  source_url: string
  location: string
  salary: string
  description: string
  recruiter_name: string
  published_at: string
  employment_type: string
  work_mode: string
  seniority: string
  technologies: string[]
}

export interface JobPostingPayload {
  title: string
  company: string
  source_url: string
  location: string
  salary: string
  description: string
  recruiter_name: string
  published_at: string
  employment_type: string
  work_mode: string
  seniority: string
  technologies: string[]
}

export interface PageContent {
  url: string
  pageContent: string
}

export type PanelState =
  | "idle"
  | "loading"
  | "loaded"
  | "scrape_error"
  | "saving"
  | "save_success"
  | "save_error"

export type PopupState =
  | "loading"
  | "loaded"
  | "scrape_error"
  | "saving"
  | "save_success"
  | "save_error"
  | "no_job"

export interface FormState {
  title: string
  company: string
  sourceUrl: string
  location: string
  salary: string
  description: string
  recruiterName: string
  publishedAt: string
  employmentType: string
  workMode: string
  seniority: string
  technologies: string
  requiredError: string
}

export interface OverlayState {
  visible: boolean
}

export interface ExtensionMessage {
  type: "PAGE_HAS_JOB" | "GET_PAGE_CONTENT" | "PAGE_CONTENT" | "JOB_SAVED" | "SHOW_OVERLAY" | "HIDE_OVERLAY" | "OVERLAY_SAVED" | "GET_OVERLAY_STATE" | "AUTH_CHECK" | "AUTH_LOGIN"
  payload?: PageContent | OverlayState
}

export function extractCompanyFromDomain(url: string): string | null {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean)[0]
    if (segment) {
      return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return null
  } catch {
    return null
  }
}

export const JOB_SITE_PATTERNS = [
  /linkedin\.com\/jobs\//i,
  /indeed\.com\/(view\/)?job/i,
  /glassdoor\.com\/Job\//i,
  /glassdoor\.com\/job-listing\//i,
  /remote\.co\/remote-jobs\//i,
  /arc\.dev\/jobs\//i,
  /occmundial\.com\/empleo\//i,
  /occ\.com\.mx\/(empleos?|empleo)\//i,
  /upwork\.com\/job\//i,
]
