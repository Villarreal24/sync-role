import { describe, it, expect } from 'vitest'
import { formatPublishDate, formatRelativeTime } from './date'

const ES_UNITS = {
  prefix: 'hace',
  minutesSingular: 'minuto',
  minutesPlural: 'minutos',
  hoursSingular: 'hora',
  hoursPlural: 'horas',
  daysSingular: 'día',
  daysPlural: 'días',
  weeksSingular: 'semana',
  weeksPlural: 'semanas',
  monthsSingular: 'mes',
  monthsPlural: 'meses',
}

const EN_UNITS = {
  prefix: 'ago',
  minutesSingular: 'minute',
  minutesPlural: 'minutes',
  hoursSingular: 'hour',
  hoursPlural: 'hours',
  daysSingular: 'day',
  daysPlural: 'days',
  weeksSingular: 'week',
  weeksPlural: 'weeks',
  monthsSingular: 'month',
  monthsPlural: 'months',
}

const NOW = new Date('2026-07-17T12:00:00Z')

function isoOffset(seconds: number): string {
  return new Date(NOW.getTime() - seconds * 1000).toISOString()
}

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

describe('formatRelativeTime', () => {
  describe('guards', () => {
    it('returns null for empty / null / undefined', () => {
      expect(formatRelativeTime('', 'es', ES_UNITS, NOW)).toBeNull()
      expect(formatRelativeTime(undefined, 'es', ES_UNITS, NOW)).toBeNull()
      expect(formatRelativeTime(null, 'es', ES_UNITS, NOW)).toBeNull()
    })

    it('returns null for unparseable strings', () => {
      expect(formatRelativeTime('not a date', 'es', ES_UNITS, NOW)).toBeNull()
      expect(formatRelativeTime('hello world', 'es', ES_UNITS, NOW)).toBeNull()
    })

    it('returns "hace 0 minutos" / "0 minutes ago" for future dates (diff < 0)', () => {
      const future = new Date(NOW.getTime() + 60_000).toISOString()
      expect(formatRelativeTime(future, 'es', ES_UNITS, NOW)).toBe('hace 0 minutos')
      expect(formatRelativeTime(future, 'en', EN_UNITS, NOW)).toBe('0 minutes ago')
    })

    it('returns "hace 0 minutos" / "0 minutes ago" when diff is exactly 0', () => {
      expect(formatRelativeTime(NOW.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 0 minutos')
      expect(formatRelativeTime(NOW.toISOString(), 'en', EN_UNITS, NOW)).toBe('0 minutes ago')
    })
  })

  describe('minutes bucket (< 1h)', () => {
    it('formats 1 minute singular in ES and EN', () => {
      expect(formatRelativeTime(isoOffset(60), 'es', ES_UNITS, NOW)).toBe('hace 1 minuto')
      expect(formatRelativeTime(isoOffset(60), 'en', EN_UNITS, NOW)).toBe('1 minute ago')
    })

    it('formats 30 minutes plural in ES and EN', () => {
      expect(formatRelativeTime(isoOffset(30 * 60), 'es', ES_UNITS, NOW)).toBe('hace 30 minutos')
      expect(formatRelativeTime(isoOffset(30 * 60), 'en', EN_UNITS, NOW)).toBe('30 minutes ago')
    })

    it('floors to 1 minute when diff is < 60s (30s -> 1 minuto)', () => {
      expect(formatRelativeTime(isoOffset(30), 'es', ES_UNITS, NOW)).toBe('hace 1 minuto')
    })
  })

  describe('hours bucket (< 24h)', () => {
    it('formats 1 hour singular', () => {
      expect(formatRelativeTime(isoOffset(60 * 60), 'es', ES_UNITS, NOW)).toBe('hace 1 hora')
      expect(formatRelativeTime(isoOffset(60 * 60), 'en', EN_UNITS, NOW)).toBe('1 hour ago')
    })

    it('formats 7 hours plural', () => {
      expect(formatRelativeTime(isoOffset(7 * 60 * 60), 'es', ES_UNITS, NOW)).toBe('hace 7 horas')
      expect(formatRelativeTime(isoOffset(7 * 60 * 60), 'en', EN_UNITS, NOW)).toBe('7 hours ago')
    })
  })

  describe('days bucket (<= 30 days)', () => {
    it('formats 1 day singular', () => {
      const d = new Date(NOW.getTime() - 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 1 día')
      expect(formatRelativeTime(d.toISOString(), 'en', EN_UNITS, NOW)).toBe('1 day ago')
    })

    it('formats 7 days plural', () => {
      const d = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 7 días')
      expect(formatRelativeTime(d.toISOString(), 'en', EN_UNITS, NOW)).toBe('7 days ago')
    })

    it('formats the 30-day boundary (still days)', () => {
      const d = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 30 días')
    })

    it('switches to weeks at 31 days (no longer days)', () => {
      const d = new Date(NOW.getTime() - 31 * 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)
      expect(result).toMatch(/^hace \d+ semanas?$/)
    })
  })

  describe('weeks bucket (31 to 63 days, jumps to 4+ weeks)', () => {
    it('formats 4 weeks at the days→weeks transition (31 days)', () => {
      const d = new Date(NOW.getTime() - 31 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 4 semanas')
      expect(formatRelativeTime(d.toISOString(), 'en', EN_UNITS, NOW)).toBe('4 weeks ago')
    })

    it('formats 5 weeks at 38 days', () => {
      const d = new Date(NOW.getTime() - 38 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 5 semanas')
    })

    it('formats 8 weeks at 56 days (still weeks)', () => {
      const d = new Date(NOW.getTime() - 56 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 8 semanas')
    })
  })

  describe('months bucket (> 9 weeks, jumps to 2+ months)', () => {
    it('formats 2 months at 64 days (first reachable months value)', () => {
      const d = new Date(NOW.getTime() - 64 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 2 meses')
      expect(formatRelativeTime(d.toISOString(), 'en', EN_UNITS, NOW)).toBe('2 months ago')
    })

    it('formats 5 months at ~150 days', () => {
      const d = new Date(NOW.getTime() - 5 * 30 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 5 meses')
      expect(formatRelativeTime(d.toISOString(), 'en', EN_UNITS, NOW)).toBe('5 months ago')
    })
  })

  describe('parseDate coverage (indirect)', () => {
    it('accepts YYYY-MM-DD as a date-only ISO string', () => {
      const d = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000)
      const isoDate = d.toISOString().slice(0, 10)
      const result = formatRelativeTime(isoDate, 'es', ES_UNITS, NOW)
      expect(result).toMatch(/^hace \d+ días?$/)
    })

    it('accepts a full ISO timestamp', () => {
      const d = new Date(NOW.getTime() - 3 * 60 * 60 * 1000)
      expect(formatRelativeTime(d.toISOString(), 'es', ES_UNITS, NOW)).toBe('hace 3 horas')
    })
  })
})
