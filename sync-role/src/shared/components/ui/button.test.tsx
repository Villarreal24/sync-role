import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('renders disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Button className="my-class">Click me</Button>)
    expect(screen.getByRole('button')).toHaveClass('my-class')
  })

  it('handles click events', () => {
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Click me</Button>)
    screen.getByRole('button').click()
    expect(clicked).toBe(true)
  })
})
