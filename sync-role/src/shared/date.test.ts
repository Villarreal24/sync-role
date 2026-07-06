import { describe, it, expect } from 'vitest'
import { formatPublishDate } from './date'

describe('formatPublishDate', () => {
  it('formats a valid ISO date as DD/MM/YYYY', () => {
    expect(formatPublishDate('2026-09-25').display).toBe('25/09/2026')
    expect(formatPublishDate('2026-01-05').display).toBe('05/01/2026')
  })

  it('produces a full English date for the tooltip', () => {
    const result = formatPublishDate('2026-09-25')
    expect(result.full).toBe('Friday 25 September 2026')
    expect(result.isExact).toBe(true)
  })

  it('returns the raw value when the date is not parseable', () => {
    const result = formatPublishDate('3 days ago')
    expect(result.display).toBe('3 days ago')
    expect(result.full).toBeNull()
    expect(result.isExact).toBe(false)
  })

  it('returns a dash for empty / null / undefined', () => {
    expect(formatPublishDate('').display).toBe('—')
    expect(formatPublishDate(undefined).display).toBe('—')
    expect(formatPublishDate(null).display).toBe('—')
  })
})
