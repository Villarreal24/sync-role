import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPage } from './AuthPage'

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockNavigate = vi.fn()
const mockSetSession = vi.fn()
const mockUseSearch = vi.fn().mockReturnValue({})

vi.mock('@/core/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      setSession: mockSetSession,
    },
  }),
}))

vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
    session: null,
    loading: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearch: () => mockUseSearch(),
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) =>
    <a href={props.to}>{children}</a>,
}))

describe('AuthPage', () => {
  beforeEach(() => {
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

  describe('OAuth callback', () => {
    beforeEach(() => {
      mockUseSearch.mockReturnValue({})
      mockSetSession.mockReset()
      mockSetSession.mockResolvedValue({ data: { session: { user: { id: 'abc' } } } })
    })

    it('redirects to / on user_id param without calling setSession', async () => {
      mockUseSearch.mockReturnValue({ user_id: 'abc', email: 'test@test.com' })
      render(<AuthPage />)

      await vi.waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
      })
      expect(mockSetSession).not.toHaveBeenCalled()
    })

    it('still calls setSession when access_token present', async () => {
      mockUseSearch.mockReturnValue({ access_token: 'tok', refresh_token: 'ref' })
      render(<AuthPage />)

      await vi.waitFor(() => {
        expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'tok', refresh_token: 'ref' })
      })
    })
  })
})
