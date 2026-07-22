import { describe, it, expect, vi, beforeEach } from "vitest"
import { hasSession, getAuthHeaders, getAccessToken } from "./auth"

// Mock chrome.cookies.getAll
const mockCookiesGetAll = vi.fn()

vi.stubGlobal("chrome", {
  cookies: {
    getAll: mockCookiesGetAll,
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
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
  })

  it("returns the access token from the session cookie", async () => {
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
})

describe("getAuthHeaders", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
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
