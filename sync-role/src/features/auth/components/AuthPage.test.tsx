import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPage } from './AuthPage'
import { useAuthStore } from '../store/auth.store'

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
    vi.restoreAllMocks()
    mockLogin.mockReset()
    mockRegister.mockReset()
    mockNavigate.mockReset()
  })

  it('renders the login form by default', () => {
    render(<AuthPage />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('shows the Google OAuth button on login', () => {
    render(<AuthPage />)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    expect(screen.getByText(/or continue with/i)).toBeInTheDocument()
  })

  it('switches to the register form when the Register button is clicked', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('switches back to the login form from register', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /^register$/i }))
    const toggleButtons = screen.getAllByRole('button', { name: /^sign in$/i })
    const toggleButton = toggleButtons[toggleButtons.length - 1]
    await user.click(toggleButton)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('captures access_token, refresh_token, user_id and email from URL params and calls setAuth + navigate', () => {
    window.history.replaceState({}, '', '/auth?access_token=at&refresh_token=rt&user_id=u1&email=a%40b.com')
    render(<AuthPage />)

    const state = useAuthStore.getState()
    expect(state.token).toBe('at')
    expect(state.refreshToken).toBe('rt')
    expect(state.user).toEqual({ id: 'u1', email: 'a@b.com' })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    expect(window.location.search).toBe('')
  })
})
