import { FRONTEND_DOMAIN } from "./constants"

// The Supabase session cookie name prefix matches sb-{ref}-auth-token
// Since we can't predict the exact ref at build time, we match the prefix
const SESSION_COOKIE_PREFIX = "sb-"
const SESSION_COOKIE_SUFFIX = "-auth-token"

/**
 * Parse the Supabase SSR cookie value to extract the access token.
 *
 * Cookie format: base64url(JSON.stringify([access_token, refresh_token, user, expires_at]))
 */
function extractAccessToken(cookieValue: string): string | null {
  try {
    const padded = cookieValue + "=".repeat((4 - (cookieValue.length % 4)) % 4)
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
 * Get the session cookie from the FE domain using chrome.cookies API.
 * Returns the full Cookie header value if a session exists, null otherwise.
 */
export async function getSessionCookieHeader(): Promise<string | null> {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: FRONTEND_DOMAIN,
    })

    const sessionCookie = cookies.find(
      (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith(SESSION_COOKIE_SUFFIX),
    )

    if (!sessionCookie) return null
    return `${sessionCookie.name}=${sessionCookie.value}`
  } catch {
    return null
  }
}

/**
 * Get auth headers for API requests.
 * Returns the Cookie header if a session exists, empty object otherwise.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieHeader = await getSessionCookieHeader()
  if (cookieHeader) {
    return { Cookie: cookieHeader }
  }
  return {}
}

/**
 * Check if the user has an active session by looking for the Supabase cookie.
 */
export async function hasSession(): Promise<boolean> {
  const header = await getSessionCookieHeader()
  return header !== null
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
