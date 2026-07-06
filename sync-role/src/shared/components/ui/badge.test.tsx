import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Saved</Badge>)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Badge className="my-class">x</Badge>)
    expect(screen.getByText('x')).toHaveClass('my-class')
  })

  it('static variant has no hover and no default bg (relies on className)', () => {
    render(<Badge variant="static" data-testid="b">x</Badge>)
    const el = screen.getByTestId('b')
    expect(el.className).toContain('border-transparent')
    expect(el.className).not.toContain('hover:bg')
    expect(el.className).not.toContain('bg-primary')
  })
})
