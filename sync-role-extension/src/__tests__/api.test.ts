import { describe, it, expect, vi, beforeEach } from "vitest"
import { createJob } from "../lib/api"
import type { JobPostingPayload } from "../lib/types"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock chrome APIs for getAuthHeaders / getAccessToken
vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  },
  cookies: {
    getAll: vi.fn().mockResolvedValue([]),
  },
})

describe("createJob", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  /** Helper: get the API fetch call (skip the /auth/session endpoint call at index 0) */
  function apiCallIndex(): number[] {
    return mockFetch.mock.calls
      .map((call, i) => ({ url: call[0], i }))
      .filter(({ url }) => !url.includes('/auth/session'))
      .map(({ i }) => i)
  }

  it("should send correct camelCase body with all fields", async () => {
    // First fetch call = /auth/session fallback in getAccessToken
    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    // Second fetch call = actual API call
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)

    const payload: JobPostingPayload = {
      title: "Test Engineer",
      company: "TestCorp",
      source_url: "https://test.com/job",
      location: "Remote",
      salary: "$100k",
      description: "A great job",
      recruiter_name: "Jane",
      published_at: "3 days ago",
      employment_type: "Full-time",
      work_mode: "Remote",
      seniority: "Senior",
      technologies: ["Python", "FastAPI"],
    }

    await createJob(payload)

    // Find the actual API call (skip session endpoint)
    const apiCalls = mockFetch.mock.calls.filter(([url]) => !url.includes('/auth/session'))
    expect(apiCalls).toHaveLength(1)
    const [url, opts] = apiCalls[0]

    expect(url).toContain("/jobs")
    expect(opts.method).toBe("POST")
    expect(opts.headers["Content-Type"]).toBe("application/json")

    const body = JSON.parse(opts.body)
    expect(body.title).toBe("Test Engineer")
    expect(body.company).toBe("TestCorp")
    expect(body.sourceUrl).toBe("https://test.com/job")
    expect(body.employmentType).toBe("Full-time")
    expect(body.workMode).toBe("Remote")
    expect(body.seniority).toBe("Senior")
    expect(body.technologies).toEqual(["Python", "FastAPI"])
  })

  it("should send empty strings for missing fields", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)

    const payload: JobPostingPayload = {
      title: "Minimal Job",
      company: "MinCorp",
      source_url: "",
      location: "",
      salary: "",
      description: "",
      recruiter_name: "",
      published_at: "",
      employment_type: "",
      work_mode: "",
      seniority: "",
      technologies: [],
    }

    await createJob(payload)

    const apiCalls = mockFetch.mock.calls.filter(([url]) => !url.includes('/auth/session'))
    expect(apiCalls).toHaveLength(1)
    const [, opts] = apiCalls[0]
    const body = JSON.parse(opts.body)
    expect(body.workMode).toBe("")
    expect(body.seniority).toBe("")
    expect(body.technologies).toEqual([])
  })

  it("should throw on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false } as Response)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request"),
    } as Response)

    const payload: JobPostingPayload = {
      title: "Fail",
      company: "FailCorp",
      source_url: "",
      location: "",
      salary: "",
      description: "",
      recruiter_name: "",
      published_at: "",
      employment_type: "",
      work_mode: "",
      seniority: "",
      technologies: [],
    }

    await expect(createJob(payload)).rejects.toThrow("Create job failed")
  })
})
