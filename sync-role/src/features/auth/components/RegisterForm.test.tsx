import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from './RegisterForm'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the title and all three form fields', () => {
    render(<RegisterForm onRegister={vi.fn()} onToggleMode={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows an error when passwords do not match', async () => {
    const onRegister = vi.fn()
    const user = userEvent.setup()
    render(<RegisterForm onRegister={onRegister} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('shows an error when password is less than 8 characters', async () => {
    const onRegister = vi.fn()
    const user = userEvent.setup()
    render(<RegisterForm onRegister={onRegister} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('calls onRegister with email and password on valid submit', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<RegisterForm onRegister={onRegister} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'longpassword')
    await user.type(screen.getByLabelText(/confirm password/i), 'longpassword')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledWith('a@b.com', 'longpassword')
    })
  })

  it('renders the server error message when registration fails', async () => {
    const onRegister = vi.fn().mockRejectedValue(new Error('Email already used'))
    const user = userEvent.setup()
    render(<RegisterForm onRegister={onRegister} onToggleMode={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/^password$/i), 'longpassword')
    await user.type(screen.getByLabelText(/confirm password/i), 'longpassword')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Email already used')).toBeInTheDocument()
  })

  it('calls onToggleMode when the Sign In button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleMode = vi.fn()
    render(<RegisterForm onRegister={vi.fn()} onToggleMode={onToggleMode} />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onToggleMode).toHaveBeenCalled()
  })
})
