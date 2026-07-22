import { describe, it, expect, vi, beforeEach } from "vitest"
import { hasSession, getAuthHeaders, getSessionCookieHeader } from "./auth"

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

describe("getSessionCookieHeader", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
  })

  it("returns cookie header when session cookie exists", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: "base64-encoded-value" },
    ])
    const header = await getSessionCookieHeader()
    expect(header).toBe("sb-kicwqgyzxygujewlvxpv-auth-token=base64-encoded-value")
  })

  it("returns null when no session cookie exists", async () => {
    mockCookiesGetAll.mockResolvedValue([])
    const header = await getSessionCookieHeader()
    expect(header).toBeNull()
  })

  it("returns null when cookies API fails", async () => {
    mockCookiesGetAll.mockRejectedValue(new Error("permission denied"))
    const header = await getSessionCookieHeader()
    expect(header).toBeNull()
  })

  it("ignores cookies that are not Supabase session cookies", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "other-cookie", value: "value" },
      { name: "another-cookie", value: "value2" },
    ])
    const header = await getSessionCookieHeader()
    expect(header).toBeNull()
  })
})

describe("getAuthHeaders", () => {
  beforeEach(() => {
    mockCookiesGetAll.mockReset()
  })

  it("returns Cookie header when session exists", async () => {
    mockCookiesGetAll.mockResolvedValue([
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: "token-value" },
    ])
    const headers = await getAuthHeaders()
    expect(headers).toEqual({ Cookie: "sb-kicwqgyzxygujewlvxpv-auth-token=token-value" })
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
      { name: "sb-kicwqgyzxygujewlvxpv-auth-token", value: "value" },
    ])
    expect(await hasSession()).toBe(true)
  })

  it("returns false when no session cookie", async () => {
    mockCookiesGetAll.mockResolvedValue([])
    expect(await hasSession()).toBe(false)
  })
})
