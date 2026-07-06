import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  it('renders an input with the right type', () => {
    render(<Input type="email" placeholder="Email" />)
    const input = screen.getByPlaceholderText(/email/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('is controlled via value', async () => {
    const user = userEvent.setup()
    render(<Input defaultValue="hello" placeholder="type here" />)
    const input = screen.getByPlaceholderText(/type here/i) as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'world')
    expect(input.value).toBe('world')
  })

  it('is disabled when prop is set', () => {
    render(<Input disabled placeholder="x" />)
    expect(screen.getByPlaceholderText('x')).toBeDisabled()
  })
})
