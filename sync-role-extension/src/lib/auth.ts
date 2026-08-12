import { BACKEND_URL, FRONTEND_URL } from "./constants"

const SESSION_COOKIE_PREFIX = "sb-"

const TAG = "[syncrole-auth]"

let debugLog: (...args: unknown[]) => void
try {
  debugLog = (...args: unknown[]) => console.log(TAG, ...args)
} catch {
  debugLog = () => {}
}

export function extractAccessToken(cookieValue: string): string | null {
  try {
    debugLog("extractAccessToken input length:", cookieValue.length, "prefix:", cookieValue.slice(0, 10))

    // Normalize: trim whitespace, strip JSON-string wrapping, strip base64- prefix
    let raw = cookieValue.trim()
    // Chrome may wrap cookie values in JSON double-quotes — strip first
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1)
    if (raw.startsWith("base64-")) raw = raw.slice(7)

    debugLog("after normalize, raw length:", raw.length, "prefix:", raw.slice(0, 10))
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

async function findAndStoreSession(
  cookies: { name: string; value: string }[],
): Promise<string | null> {
  const sessionCookie = cookies.find(
    (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith("-auth-token"),
  )
  if (sessionCookie?.value) {
    debugLog("  session cookie found:", sessionCookie.name)
    const token = extractAccessToken(sessionCookie.value)
    if (token) {
      await chrome.storage.local.set({ "sb-session-token": token })
      return token
    }
  }
  return null
}

export async function getAccessToken(): Promise<string | null> {
  // 1) Try chrome.storage.local first (fast path — background listener stored the
  //    already-extracted JWT, so no base64 decode needed here).
  try {
    debugLog("getAccessToken: checking chrome.storage.local")
    const result = await chrome.storage.local.get("sb-session-token")
    const storedToken = result["sb-session-token"]
    if (storedToken) {
      // Issue 1 — Stale token guard: verify the session cookie still exists
      debugLog("getAccessToken: found JWT in storage, verifying cookie")
      const allCookies = await chrome.cookies.getAll({})
      const cookieStillExists = allCookies.some(
        (c) => c.name.startsWith(SESSION_COOKIE_PREFIX) && c.name.endsWith("-auth-token"),
      )
      if (cookieStillExists) {
        return storedToken
      }
      debugLog("getAccessToken: session cookie gone, clearing stale token")
      await chrome.storage.local.remove("sb-session-token")
      // Fall through to tier 2/3
    }
    debugLog("getAccessToken: nothing in storage, trying cookie APIs")
  } catch (err) {
    debugLog("getAccessToken: storage error:", err)
  }

  // 2) Try chrome.cookies.getAll({ url }) — works for cookies scoped to exact origin
  try {
    const urlsToTry = [FRONTEND_URL, `${FRONTEND_URL}/`]
    for (const url of urlsToTry) {
      debugLog("chrome.cookies.getAll({ url:", url, "})")
      const allCookies = await chrome.cookies.getAll({ url })
      debugLog("  ->", allCookies.length, "cookies")
      allCookies.forEach((c) =>
        debugLog("  cookie:", c.name, "len:", (c.value || "").length, "domain:", c.domain, "secure:", c.secure, "httpOnly:", c.httpOnly),
      )
      const token = await findAndStoreSession(allCookies)
      if (token) return token
    }
  } catch (err) {
    debugLog("chrome.cookies.getAll({ url }) error:", err)
  }

  // 3) Try chrome.cookies.getAll({}) without filter — returns ALL cookies accessible
  //    via host_permissions, regardless of URL/domain scope quirks.
  try {
    debugLog("chrome.cookies.getAll({}) — no filter, all accessible cookies")
    const allCookies = await chrome.cookies.getAll({})
    debugLog("  ->", allCookies.length, "total accessible cookies")
    allCookies.forEach((c) =>
      debugLog("  cookie:", c.name, "domain:", c.domain, "path:", c.path),
    )
    const token = await findAndStoreSession(allCookies)
    if (token) return token
  } catch (err) {
    debugLog("chrome.cookies.getAll({}) error:", err)
  }

  // 4) Backend /auth/session endpoint fallback
  //    The cookie APIs above may not find the sb-*-auth-token cookie when the
  //    extension lacks host_permissions for the backend origin. The /auth/session
  //    endpoint reads the httpOnly cookie server-side, so we just need to include
  //    cookies via credentials: 'include' — no chrome.cookies needed.
  try {
    debugLog("getAccessToken: trying backend /auth/session endpoint")
    const res = await fetch(`${BACKEND_URL}/auth/session`, {
      credentials: "include",
    })
    if (res.ok) {
      const data = await res.json()
      if (data.session?.access_token) {
        debugLog("getAccessToken: session endpoint returned token, storing")
        await chrome.storage.local.set({ "sb-session-token": data.session.access_token })
        return data.session.access_token
      }
    }
    debugLog("getAccessToken: /auth/session returned no session")
  } catch (err) {
    debugLog("getAccessToken: /auth/session fetch error:", err)
  }

  debugLog("getAccessToken: no session cookie found")
  return null
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
