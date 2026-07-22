export const BACKEND_URL =
  process.env.PLASMO_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1"

// Frontend URL for sign-in redirect.
// Defaults to localhost:3000 for dev; set PLASMO_PUBLIC_FRONTEND_URL for prod.
export const FRONTEND_URL =
  process.env.PLASMO_PUBLIC_FRONTEND_URL || "http://localhost:3000"

// Frontend domain for cookie reading via chrome.cookies API.
// Extension reads the sb-*-auth-token cookie from this domain.
// Defaults to localhost for dev; set PLASMO_PUBLIC_FRONTEND_DOMAIN for prod.
export const FRONTEND_DOMAIN =
  process.env.PLASMO_PUBLIC_FRONTEND_DOMAIN || "localhost"

export const WORK_MODE_OPTIONS = ["", "Remote", "Hybrid", "On-site"]

export const EMPLOYMENT_TYPE_OPTIONS = [
  "",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
]

export const SENIORITY_OPTIONS = [
  "",
  "Junior",
  "Mid",
  "Senior",
  "Staff",
  "Principal",
]
