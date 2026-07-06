import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('drops falsy values', () => {
    expect(cn('foo', false, null, undefined, 0, 'bar')).toBe('foo bar')
  })

  it('supports conditional objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('supports arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('returns empty string when no input', () => {
    expect(cn()).toBe('')
  })

  it('deduplicates conflicting tailwind utilities (last wins)', () => {
    expect(cn('h-10', 'h-5')).toBe('h-5')
    expect(cn('h-5', 'h-10')).toBe('h-10')
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-xs')).toBe('text-xs')
  })

  it('keeps non-conflicting tailwind utilities together', () => {
    expect(cn('h-10 w-full bg-blue-500')).toBe('h-10 w-full bg-blue-500')
    expect(cn('h-10', 'w-full', 'bg-blue-500')).toBe('h-10 w-full bg-blue-500')
  })
})
