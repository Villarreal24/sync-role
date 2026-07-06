import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TagBadge } from './TagBadge'

describe('TagBadge', () => {
  it('renders the value with the matching token CSS var', () => {
    render(<TagBadge kind="workMode" value="Remote" />)
    const badge = screen.getByText('Remote')
    expect(badge.className).toContain('--tag-workMode-Remote-bg')
    expect(badge.className).toContain('--tag-workMode-Remote-fg')
  })

  it('falls back to the fallback token for unknown values', () => {
    render(<TagBadge kind="workMode" value="Unknown" />)
    const badge = screen.getByText('Unknown')
    expect(badge.className).toContain('--tag-fallback-bg')
    expect(badge.className).toContain('--tag-fallback-fg')
  })

  it('renders the caption fontSize token', () => {
    render(<TagBadge kind="employment" value="Full-time" />)
    expect(screen.getByText('Full-time').className).toContain('text-xs')
  })

  it('accepts additional className', () => {
    render(<TagBadge kind="seniority" value="Senior" className="my-class" />)
    expect(screen.getByText('Senior').className).toContain('my-class')
  })
})
