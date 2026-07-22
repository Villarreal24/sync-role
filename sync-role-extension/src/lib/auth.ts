import { FRONTEND_URL } from "./constants"

const SESSION_COOKIE_PREFIX = "sb-"

const TAG = "[syncrole-auth]"

let debugLog: (...args: unknown[]) => void
try {
  debugLog = (...args: unknown[]) => console.log(TAG, ...args)
} catch {
  debugLog = () => {}
}

function extractAccessToken(cookieValue: string): string | null {
  try {
    debugLog("extractAccessToken input length:", cookieValue.length, "prefix:", cookieValue.slice(0, 10))
    const raw = cookieValue.startsWith("base64-") ? cookieValue.slice(7) : cookieValue
    debugLog("after strip base64- prefix, raw length:", raw.length)
    const standard = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4)
    const decoded = atob(padded)
    const parts = JSON.parse(decoded)
    debugLog("parsed cookie array length:", parts.length)
    if (Array.isArray(parts) && parts.length >= 1 && typeof parts[0] === "string") {
      debugLog("access_token extracted, length:", parts[0].length)
      return parts[0]
    }
    debugLog("cookie value did not match expected array format")
    return null
  } catch (err) {
    debugLog("extractAccessToken error:", err)
    return null
  }
}

async function findSessionCookie(): Promise<chrome.cookies.Cookie | null> {
  try {
    const urlsToTry = [FRONTEND_URL, `${FRONTEND_URL}/`]
    for (const url of urlsToTry) {
      debugLog("chrome.cookies.getAll({ url:", url, "})")
      const allCookies = await chrome.cookies.getAll({ url })
      debugLog("  ->", allCookies.length, "cookies")
      if (allCookies.length === 0) continue
      allCookies.forEach((c) =>
        debugLog("  cookie:", c.name, "len:", (c.value || "").length, "domain:", c.domain, "secure:", c.secure, "httpOnly:", c.httpOnly),
      )
      const sessionCookie = allCookies.find(
        (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith("-auth-token"),
      )
      debugLog("  session cookie found (exact match):", !!sessionCookie)
      if (sessionCookie) debugLog("  session cookie value present:", !!sessionCookie.value)
      if (sessionCookie?.value) return sessionCookie
    }
    debugLog("no session cookie found in any URL variant")
    return null
  } catch (err) {
    debugLog("findSessionCookie error:", err)
    return null
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookie = await findSessionCookie()
  if (!cookie) {
    debugLog("getAccessToken: no session cookie found")
    return null
  }
  debugLog("getAccessToken: cookie found, extracting token")
  const token = extractAccessToken(cookie.value)
  debugLog("getAccessToken: token extracted:", !!token)
  return token
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken()
  if (token) {
    debugLog("getAuthHeaders: returning Authorization Bearer")
    return { Authorization: `Bearer ${token}` }
  }
  debugLog("getAuthHeaders: no token, returning empty")
  return {}
}

export async function hasSession(): Promise<boolean> {
  const token = await getAccessToken()
  debugLog("hasSession:", !!token)
  return token !== null
}

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
