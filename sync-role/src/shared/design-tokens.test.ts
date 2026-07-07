import { describe, it, expect } from 'vitest'
import {
  spacing,
  fontSize,
  radius,
  color,
  statusTokens,
  tagTokens,
  tagFallback,
  statusToken,
  tagToken,
} from './design-tokens'

describe('design-tokens', () => {
  it('spacing exports the expected keys', () => {
    expect(spacing.field).toBe('space-y-4')
    expect(spacing.inputPad).toBe('px-3 py-2')
    expect(spacing.buttonPad).toBe('w-full py-2 px-4')
    expect(spacing.buttonGroup).toBe('gap-2.5')
    expect(spacing.cardFooter).toBe('px-3 pt-2.5 pb-2')
    expect(spacing.tableCell).toBe('py-3 align-top')
    expect(spacing.tableEmpty).toBe('py-12')
    expect(spacing.section).toBe('gap-6')
  })

  it('fontSize exports the expected keys', () => {
    expect(fontSize.title).toContain('text-xl')
    expect(fontSize.label).toContain('text-sm')
    expect(fontSize.caption).toBe('text-xs')
  })

  it('radius exports the expected keys', () => {
    expect(radius.md).toBe('rounded-md')
    expect(radius.xl).toBe('rounded-xl')
  })

  it('color exposes semantic shadcn tokens (theme-aware)', () => {
    expect(color.bg).toBe('bg-background')
    expect(color.fg).toBe('text-foreground')
    expect(color.muted).toBe('text-muted-foreground')
    expect(color.border).toBe('border-border')
    expect(color.card).toContain('bg-card')
    expect(color.popover).toContain('bg-popover')
    expect(color.input).toBe('bg-input')
  })

  it('statusTokens has all 5 statuses with bg, text and label', () => {
    const statuses = ['saved', 'applied', 'interviewing', 'rejected', 'offer'] as const
    for (const s of statuses) {
      const t = statusTokens[s]
      expect(t.bg).toBeTruthy()
      expect(t.text).toBeTruthy()
      expect(t.label).toBeTruthy()
    }
  })

  it('tagTokens has workMode, employment and seniority kinds', () => {
    expect(tagTokens.workMode.Remote).toBeTruthy()
    expect(tagTokens.employment['Full-time']).toBeTruthy()
    expect(tagTokens.seniority.Mid).toBeTruthy()
  })

  it('statusToken returns the expected token', () => {
    expect(statusToken('applied').label).toBe('Applied')
    expect(statusToken('offer').label).toBe('Offer')
  })

  it('tagToken returns the expected token for known values', () => {
    const remote = tagToken('workMode', 'Remote')
    expect(remote.bg).toContain('--tag-workMode-Remote-bg')
    expect(remote.text).toContain('--tag-workMode-Remote-fg')
  })

  it('tagToken returns fallback for unknown values', () => {
    const t = tagToken('workMode', 'Unknown-Mode')
    expect(t).toEqual(tagFallback)
  })
})
