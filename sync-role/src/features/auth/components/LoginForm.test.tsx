import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the title and form fields', () => {
    render(<LoginForm onLogin={vi.fn()} onToggleMode={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('requires email and password', () => {
    render(<LoginForm onLogin={vi.fn()} onToggleMode={vi.fn()} />)
    const email = screen.getByLabelText(/email/i) as HTMLInputElement
    const password = screen.getByLabelText(/password/i) as HTMLInputElement
    expect(email.required).toBe(true)
    expect(password.required).toBe(true)
  })

  it('calls onLogin with email and password on submit', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<LoginForm onLogin={onLogin} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('renders the error message when login fails', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    render(<LoginForm onLogin={onLogin} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })

  it('calls onToggleMode when the Register button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleMode = vi.fn()
    render(<LoginForm onLogin={vi.fn()} onToggleMode={onToggleMode} />)

    await user.click(screen.getByRole('button', { name: /register/i }))
    expect(onToggleMode).toHaveBeenCalled()
  })
})
