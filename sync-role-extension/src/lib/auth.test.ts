import { describe, it, expect, vi, beforeEach } from "vitest"
import { getStoredToken, setStoredToken, clearStoredToken } from "./auth"

// Mock chrome.storage.local
const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}

vi.stubGlobal("chrome", {
  storage: {
    local: mockStorage,
  },
})

describe("getStoredToken", () => {
  beforeEach(() => {
    mockStorage.get.mockReset()
    mockStorage.set.mockReset()
    mockStorage.remove.mockReset()
  })

  it("returns token when stored", async () => {
    mockStorage.get.mockResolvedValue({ syncrole_token: "test-jwt-token" })
    const token = await getStoredToken()
    expect(token).toBe("test-jwt-token")
    expect(mockStorage.get).toHaveBeenCalledWith("syncrole_token")
  })

  it("returns null when no token stored", async () => {
    mockStorage.get.mockResolvedValue({})
    const token = await getStoredToken()
    expect(token).toBeNull()
  })
})

describe("setStoredToken", () => {
  beforeEach(() => {
    mockStorage.get.mockReset()
    mockStorage.set.mockReset()
    mockStorage.remove.mockReset()
  })

  it("stores token in chrome.storage.local", async () => {
    mockStorage.set.mockResolvedValue(undefined)
    await setStoredToken("new-jwt-token")
    expect(mockStorage.set).toHaveBeenCalledWith({ syncrole_token: "new-jwt-token" })
  })
})

describe("clearStoredToken", () => {
  beforeEach(() => {
    mockStorage.get.mockReset()
    mockStorage.set.mockReset()
    mockStorage.remove.mockReset()
  })

  it("removes token from chrome.storage.local", async () => {
    mockStorage.remove.mockResolvedValue(undefined)
    await clearStoredToken()
    expect(mockStorage.remove).toHaveBeenCalledWith("syncrole_token")
  })
})
