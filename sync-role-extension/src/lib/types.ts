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
}

export interface PageContent {
  url: string
  pageContent: string
}

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
  location: string
  salary: string
  description: string
  recruiterName: string
  publishedAt: string
  employmentType: string
  requiredError: string
}

export interface ExtensionMessage {
  type: "PAGE_HAS_JOB" | "GET_PAGE_CONTENT" | "PAGE_CONTENT" | "JOB_SAVED"
  payload?: PageContent
}

export const JOB_SITE_PATTERNS = [
  /linkedin\.com\/jobs\//i,
  /indeed\.com\/(view\/)?job/i,
  /glassdoor\.com\/Job\//i,
  /glassdoor\.com\/job-listing\//i,
  /remote\.co\/remote-jobs\//i,
  /arc\.dev\/jobs\//i,
  /occmundial\.com\/empleo\//i,
  /upwork\.com\/job\//i,
]
