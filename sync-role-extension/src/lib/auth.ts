import { BACKEND_URL } from "./constants"

const TOKEN_KEY = "syncrole_token"
const REFRESH_TOKEN_KEY = "syncrole_refresh_token"

// --- Token expiration helpers ---

export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return decoded.exp || null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token)
  if (exp === null) return true
  return Date.now() / 1000 >= exp
}

// --- chrome.storage.local helpers ---

export async function getStoredToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY)
  return result[TOKEN_KEY] || null
}

export async function setStoredToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token })
}

export async function clearStoredToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY)
  await chrome.storage.local.remove(REFRESH_TOKEN_KEY)
}

export async function getStoredRefreshToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(REFRESH_TOKEN_KEY)
  return result[REFRESH_TOKEN_KEY] || null
}

export async function setStoredTokens(
  token: string,
  refreshToken: string
): Promise<void> {
  await chrome.storage.local.set({
    [TOKEN_KEY]: token,
    [REFRESH_TOKEN_KEY]: refreshToken,
  })
}

// --- Token refresh ---

export async function refreshStoredToken(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      await clearStoredToken()
      return null
    }
    const data = await res.json()
    await setStoredTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    await clearStoredToken()
    return null
  }
}

// --- Session exchange (cookie → Bearer) ---

export async function exchangeCookieForToken(): Promise<string | null> {
  // Try to get Supabase session cookie from the backend domain
  const backendUrl = new URL(BACKEND_URL)
  try {
    const cookies = await chrome.cookies.getAll({ url: backendUrl.origin })
    const sbCookie = cookies.find(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    )
    if (!sbCookie) return null

    // The cookie contains a session JSON — send it to the backend
    const res = await fetch(`${BACKEND_URL}/auth/session`, {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) return null
    const data = await res.json()
    await setStoredTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

// --- Auth header helper ---

export async function getAuthHeaders(): Promise<Record<string, string>> {
  let token = await getStoredToken()

  if (token && isTokenExpired(token)) {
    token = await refreshStoredToken()
  }

  if (!token) {
    token = await exchangeCookieForToken()
  }

  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

// --- Badge update ---

export async function updateAuthBadge(): Promise<void> {
  const token = await getStoredToken()
  if (token && !isTokenExpired(token)) {
    chrome.action.setBadgeText({ text: "" })
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" })
  } else {
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
  }
}
