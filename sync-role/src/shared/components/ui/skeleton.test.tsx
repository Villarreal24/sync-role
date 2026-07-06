import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders a div with the skeleton class', () => {
    render(<Skeleton data-testid="skel" />)
    const el = screen.getByTestId('skel')
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('animate-pulse')
  })
})
