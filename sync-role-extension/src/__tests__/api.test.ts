import { describe, it, expect, vi, beforeEach } from "vitest"
import { createJob } from "../lib/api"
import type { JobPostingPayload } from "../lib/types"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock chrome.storage.local for auth token lookup
const mockStorage = {
  get: vi.fn(),
}

vi.stubGlobal("chrome", {
  storage: {
    local: mockStorage,
  },
})

describe("createJob", () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockStorage.get.mockReset()
    // Return no stored token so requests are unauthenticated
    mockStorage.get.mockResolvedValue({})
  })

  it("should send correct camelCase body with all fields", async () => {
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

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]

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

    const [, opts] = mockFetch.mock.calls[0]
    const body = JSON.parse(opts.body)
    expect(body.workMode).toBe("")
    expect(body.seniority).toBe("")
    expect(body.technologies).toEqual([])
  })

  it("should throw on non-ok response", async () => {
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
