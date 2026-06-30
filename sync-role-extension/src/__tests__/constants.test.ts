import { describe, it, expect } from "vitest"
import {
  WORK_MODE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SENIORITY_OPTIONS,
  BACKEND_URL,
} from "../lib/constants"

describe("WORK_MODE_OPTIONS", () => {
  it("should include empty string for unselected state", () => {
    expect(WORK_MODE_OPTIONS[0]).toBe("")
  })

  it("should contain Remote, Hybrid, On-site", () => {
    expect(WORK_MODE_OPTIONS).toContain("Remote")
    expect(WORK_MODE_OPTIONS).toContain("Hybrid")
    expect(WORK_MODE_OPTIONS).toContain("On-site")
  })

  it("should have exactly 4 options", () => {
    expect(WORK_MODE_OPTIONS).toHaveLength(4)
  })
})

describe("EMPLOYMENT_TYPE_OPTIONS", () => {
  it("should include empty string for unselected state", () => {
    expect(EMPLOYMENT_TYPE_OPTIONS[0]).toBe("")
  })

  it("should contain all employment types", () => {
    expect(EMPLOYMENT_TYPE_OPTIONS).toContain("Full-time")
    expect(EMPLOYMENT_TYPE_OPTIONS).toContain("Part-time")
    expect(EMPLOYMENT_TYPE_OPTIONS).toContain("Contract")
    expect(EMPLOYMENT_TYPE_OPTIONS).toContain("Freelance")
    expect(EMPLOYMENT_TYPE_OPTIONS).toContain("Internship")
  })

  it("should have exactly 6 options", () => {
    expect(EMPLOYMENT_TYPE_OPTIONS).toHaveLength(6)
  })
})

describe("SENIORITY_OPTIONS", () => {
  it("should include empty string for unselected state", () => {
    expect(SENIORITY_OPTIONS[0]).toBe("")
  })

  it("should contain all seniority levels", () => {
    expect(SENIORITY_OPTIONS).toContain("Junior")
    expect(SENIORITY_OPTIONS).toContain("Mid")
    expect(SENIORITY_OPTIONS).toContain("Senior")
    expect(SENIORITY_OPTIONS).toContain("Staff")
    expect(SENIORITY_OPTIONS).toContain("Principal")
  })

  it("should have exactly 6 options", () => {
    expect(SENIORITY_OPTIONS).toHaveLength(6)
  })
})

describe("BACKEND_URL", () => {
  it("should default to localhost:8000", () => {
    expect(BACKEND_URL).toBe("http://localhost:8000/api/v1")
  })
})
