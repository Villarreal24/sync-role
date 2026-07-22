import { FRONTEND_URL } from "./constants"

// The Supabase session cookie name prefix matches sb-{ref}-auth-token
// Since we can't predict the exact ref at build time, we match the prefix
const SESSION_COOKIE_PREFIX = "sb-"

/**
 * Parse the Supabase SSR cookie value to extract the access token.
 *
 * Cookie format: "base64-" + base64url(JSON.stringify([access_token, refresh_token, user, expires_at]))
 */
function extractAccessToken(cookieValue: string): string | null {
  try {
    const raw = cookieValue.startsWith("base64-") ? cookieValue.slice(7) : cookieValue
    const standard = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4)
    const decoded = atob(padded)
    const parts = JSON.parse(decoded)
    if (Array.isArray(parts) && parts.length >= 1 && typeof parts[0] === "string") {
      return parts[0]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Find the Supabase session cookie from the FE domain using chrome.cookies.getAll.
 * Returns the raw cookie object or null.
 */
async function findSessionCookie(): Promise<chrome.cookies.Cookie | null> {
  try {
    const cookies = await chrome.cookies.getAll({ url: FRONTEND_URL })
    const sessionCookie = cookies.find(
      (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith("-auth-token"),
    )
    if (!sessionCookie) return null
    // Also check chunked cookies: if a .0 chunk exists, try the first chunk
    const chunked = cookies.find(
      (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith("-auth-token.0"),
    )
    return sessionCookie.value ? sessionCookie : (chunked ?? null)
  } catch {
    return null
  }
}

/**
 * Get the access token from the Supabase session cookie on the FE domain.
 * Returns the JWT access_token if a valid session exists, null otherwise.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookie = await findSessionCookie()
  if (!cookie) return null
  return extractAccessToken(cookie.value)
}

/**
 * Get auth headers for API requests.
 * Returns Authorization: Bearer header if a session exists, empty object otherwise.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

/**
 * Check if the user has an active session by looking for the Supabase cookie.
 */
export async function hasSession(): Promise<boolean> {
  const token = await getAccessToken()
  return token !== null
}

/**
 * Update the extension badge based on auth state.
 */
export async function updateAuthBadge(): Promise<void> {
  const session = await hasSession()
  if (session) {
    chrome.action.setBadgeText({ text: "" })
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" })
  } else {
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
  }
}
