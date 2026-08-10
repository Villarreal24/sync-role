import { describe, it, expect, vi, beforeEach } from "vitest"
import { hasSession, getAuthHeaders, getAccessToken, extractAccessToken } from "./auth"

// Mock chrome APIs
const mockCookiesGetAll = vi.fn()
const mockStorageLocalGet = vi.fn()
const mockStorageLocalSet = vi.fn()
const mockStorageLocalRemove = vi.fn()
const mockCookiesOnChangedAddListener = vi.fn()

vi.stubGlobal("chrome", {
  cookies: {
    getAll: mockCookiesGetAll,
    onChanged: {
      addListener: mockCookiesOnChangedAddListener,
    },
  },
  storage: {
    local: {
      get: mockStorageLocalGet,
      set: mockStorageLocalSet,
      remove: mockStorageLocalRemove,
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
  },
})

// Helper: build a valid mock cookie value from a plain access_token
function mockCookieValue(accessToken: string): string {
  const payload = JSON.stringify([accessToken, "rt", { id: "u1", email: "t@t.com" }, 999999])
  // Simulate base64url encoding (atob compatible after standard conversion)
  const b64url = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `base64-${b64url}`
}

describe("getAccessToken", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
    mockStorageLocalGet.mockReset()
    mockStorageLocalSet.mockReset()
    mockStorageLocalRemove.mockReset()
    mockStorageLocalGet.mockResolvedValue({})
  })

  it("returns the access token from the session cookie via URL-based getAll", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("test-at") },
    ])
    expect(await getAccessToken()).toBe("test-at")
  })

  it("returns null when no session cookie exists", async () => {
    mockCookiesGetAll.mockResolvedValue([])
    expect(await getAccessToken()).toBeNull()
  })

  it("returns null when cookies API fails", async () => {
    mockCookiesGetAll.mockRejectedValue(new Error("permission denied"))
    expect(await getAccessToken()).toBeNull()
  })

  it("ignores cookies that are not Supabase session cookies", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "other-cookie", value: "value" },
    ])
    expect(await getAccessToken()).toBeNull()
  })

  it("finds session cookie via getAll({}) (no filter) when URL-based getAll returns empty", async () => {
    // URL-based getAll({ url }) returns empty; no-filter getAll({}) returns the cookie
    let callCount = 0
    mockCookiesGetAll.mockImplementation(() => {
      callCount++
      if (callCount <= 2) return Promise.resolve([]) // URL-based calls return empty
      return Promise.resolve([
        { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("no-filter-at") },
      ])
    })
    expect(await getAccessToken()).toBe("no-filter-at")
  })

  it("handles cookie value wrapped in JSON double-quotes (Chrome MV3 behavior)", async () => {
    // Chrome MV3 sometimes wraps cookie values in JSON double-quotes.
    // Mock a value like: "base64-<base64>" (with quotes)
    const rawValue = mockCookieValue("json-wrapped-at")
    const quotedValue = `"${rawValue}"`
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: quotedValue },
    ])
    expect(await getAccessToken()).toBe("json-wrapped-at")
  })

  it("handles raw base64url cookie value without base64- prefix", async () => {
    // Some Supabase versions set the cookie as raw base64url without the "base64-" prefix
    const rawValue = mockCookieValue("raw-b64-at")
    const noPrefixValue = rawValue.replace("base64-", "")
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: noPrefixValue },
    ])
    expect(await getAccessToken()).toBe("raw-b64-at")
  })
})

describe("getAuthHeaders", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
    mockStorageLocalGet.mockReset()
    mockStorageLocalSet.mockReset()
    mockStorageLocalRemove.mockReset()
    mockStorageLocalGet.mockResolvedValue({})
  })

  it("returns Authorization Bearer header when session exists", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("test-at") },
    ])
    const headers = await getAuthHeaders()
    expect(headers).toEqual({ Authorization: "Bearer test-at" })
  })

  it("returns empty object when no session", async () => {
    mockCookiesGetAll.mockResolvedValue([])
    const headers = await getAuthHeaders()
    expect(headers).toEqual({})
  })
})

describe("hasSession", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
    mockStorageLocalGet.mockReset()
    mockStorageLocalSet.mockReset()
    mockStorageLocalRemove.mockReset()
    mockStorageLocalGet.mockResolvedValue({})
  })

  it("returns true when session cookie exists", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("test-at") },
    ])
    expect(await hasSession()).toBe(true)
  })

  it("returns false when no session cookie", async () => {
    mockCookiesGetAll.mockResolvedValue([])
    expect(await hasSession()).toBe(false)
  })
})

describe("background cookies.onChanged", () => {
  beforeEach(() => {
    mockStorageLocalGet.mockReset()
    mockStorageLocalSet.mockReset()
    mockStorageLocalRemove.mockReset()
    mockCookiesGetAll.mockReset()
    mockStorageLocalGet.mockResolvedValue({})
    mockCookiesGetAll.mockResolvedValue([])
  })

  it("saves extracted access token to storage when session cookie is created/updated", async () => {
    // Dynamic import triggers side-effect listener registration after mocks
    await import("../background")

    const callback = mockCookiesOnChangedAddListener.mock.calls[0]?.[0]
    if (!callback) throw new Error("Listener not registered")

    const rawValue = mockCookieValue("extracted-at-from-bg")
    await callback({
      cookie: {
        name: "sb-kicwqgyzxygujewlvxpv-auth-token",
        value: rawValue,
        domain: "localhost",
      },
      cause: "explicit",
      removed: false,
    })

    // Background stores the EXTRACTED JWT, not the raw cookie value
    expect(mockStorageLocalSet).toHaveBeenCalledWith({ "sb-session-token": "extracted-at-from-bg" })
    expect(chrome.action.setBadgeText).toHaveBeenCalled()
  })

  it("removes session cookie from storage when cookie is removed", async () => {
    const callback = mockCookiesOnChangedAddListener.mock.calls[0]?.[0]
    if (!callback) throw new Error("Listener not registered")

    await callback({
      cookie: {
        name: "sb-kicwqgyzxygujewlvxpv-auth-token",
        value: "irrelevant",
        domain: "localhost",
      },
      cause: "explicit",
      removed: true,
    })

    expect(mockStorageLocalRemove).toHaveBeenCalledWith("sb-session-token")
    expect(chrome.action.setBadgeText).toHaveBeenCalled()
  })
})

describe("getAccessToken with storage-first", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
    mockStorageLocalGet.mockReset()
    mockStorageLocalSet.mockReset()
    mockStorageLocalRemove.mockReset()
    mockStorageLocalGet.mockResolvedValue({})
  })

  it("reads session token from storage when session cookie still exists", async () => {
    // Storage contains the ALREADY EXTRACTED JWT
    mockStorageLocalGet.mockResolvedValue({ "sb-session-token": "pre-extracted-jwt" })
    // getAll({}) returns the session cookie → cookie confirmed
    mockCookiesGetAll.mockImplementation(async (params) => {
      if (Object.keys(params || {}).length === 0) {
        return [{ name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("pre-extracted-jwt") }]
      }
      return []
    })

    const token = await getAccessToken()

    expect(token).toBe("pre-extracted-jwt")
    // Should not re-store what's already there
    expect(mockStorageLocalSet).not.toHaveBeenCalled()
  })

  it("falls back to URL-based chrome.cookies.getAll when storage is empty and saves extracted JWT", async () => {
    mockStorageLocalGet.mockResolvedValue({})
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: mockCookieValue("fallback-at") },
    ])

    const token = await getAccessToken()

    expect(token).toBe("fallback-at")
    expect(mockCookiesGetAll).toHaveBeenCalled()
    // Fallback should also save the extracted JWT for future fast reads
    expect(mockStorageLocalSet).toHaveBeenCalledWith({ "sb-session-token": "fallback-at" })
  })

  describe("stale cookie detection (Issue 1)", () => {
    beforeEach(() => {
      mockCookiesGetAll.mockReset()
      mockStorageLocalGet.mockReset()
      mockStorageLocalSet.mockReset()
      mockStorageLocalRemove.mockReset()
    })

    it("returns token from storage when cookie still exists", async () => {
      mockStorageLocalGet.mockResolvedValue({ "sb-session-token": "stored-jwt" })
      // getAll({}) returns a session cookie → cookie confirmed
      mockCookiesGetAll.mockImplementation(async (params) => {
        if (Object.keys(params || {}).length === 0) {
          return [{ name: "sb-proj-auth-token", value: mockCookieValue("stored-jwt") }]
        }
        return []
      })

      const token = await getAccessToken()

      expect(token).toBe("stored-jwt")
      // Should NOT re-store — token was already in storage
      expect(mockStorageLocalSet).not.toHaveBeenCalled()
      // Should NOT remove a valid token
      expect(mockStorageLocalRemove).not.toHaveBeenCalled()
    })

    it("clears storage and returns null when cookie is gone", async () => {
      mockStorageLocalGet.mockResolvedValue({ "sb-session-token": "stale-jwt" })
      // getAll({}) returns no session cookie
      mockCookiesGetAll.mockImplementation(async (params) => {
        if (Object.keys(params || {}).length === 0) {
          return []  // no session cookie anywhere
        }
        return []
      })

      const token = await getAccessToken()

      expect(mockStorageLocalRemove).toHaveBeenCalledWith("sb-session-token")
      expect(token).toBeNull()
    })

    it("still falls through to cookie APIs when storage is empty", async () => {
      mockStorageLocalGet.mockResolvedValue({})  // no stored token
      // URL-based getAll returns empty; no-filter getAll returns session cookie
      let callCount = 0
      mockCookiesGetAll.mockImplementation(() => {
        callCount++
        if (callCount <= 2) return Promise.resolve([])  // URL-based tries
        return Promise.resolve([
          { name: "sb-proj-auth-token", value: mockCookieValue("cookie-at") },
        ])
      })

      const token = await getAccessToken()

      expect(token).toBe("cookie-at")
    })
  })
})
