import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { ProfileMenu } from './ProfileMenu'
import { useThemeStore } from '@/features/theme/theme.store'
import { useAuthStore } from '@/features/auth/store/auth.store'

const mockNavigate = vi.fn()
const mockLogout = vi.fn()

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    login: vi.fn(),
    register: vi.fn(),
    refreshAuth: vi.fn(),
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

function renderMenu() {
  return render(
    <TooltipProvider>
      <ProfileMenu>
        <button>Open menu</button>
      </ProfileMenu>
    </TooltipProvider>,
  )
}

describe('ProfileMenu', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolvedTheme: null })
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.com', displayName: 'A B', avatarUrl: '' },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    })
    mockNavigate.mockReset()
    mockLogout.mockReset()
  })

  it('opens the menu with the three top-level items', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByText('Open menu'))
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })

  it('opens the Theme submenu and shows System/Light/Dark', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByText('Open menu'))
    await user.click(screen.getByText('Theme'))
    expect(await screen.findByText('System')).toBeInTheDocument()
    expect(await screen.findByText('Light')).toBeInTheDocument()
    expect(await screen.findByText('Dark')).toBeInTheDocument()
  })

  it('opens the Theme submenu when hovering Theme', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByText('Open menu'))
    await user.hover(screen.getByText('Theme'))
    expect(await screen.findByText('System')).toBeInTheDocument()
    expect(await screen.findByText('Light')).toBeInTheDocument()
    expect(await screen.findByText('Dark')).toBeInTheDocument()
  })

  it('navigates to / when Profile is clicked', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByText('Open menu'))
    await user.click(screen.getByText('Profile'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('calls logout and navigates to /auth when Log out is clicked', async () => {
    const user = userEvent.setup()
    mockLogout.mockResolvedValue(undefined)
    renderMenu()
    await user.click(screen.getByText('Open menu'))
    await user.click(screen.getByText('Log out'))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/auth', replace: true })
  })
})
