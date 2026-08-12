import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserAvatar } from './UserAvatar'
import type { ReactNode } from 'react'

const mockUseAuth = vi.hoisted(() => vi.fn())
const mockUseProfile = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/features/auth/api/profiles', () => ({
  useProfile: (...args: any[]) => mockUseProfile(...args),
}))

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('UserAvatar', () => {
  it('renders initials from displayName when set', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'john@example.com' } })
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', displayName: 'John Doe', avatarUrl: '', phone: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '', updatedAt: '' },
      isLoading: false,
      isError: false,
    } as any)
    render(<UserAvatar />, { wrapper: makeWrapper() })
    expect(screen.getByRole('img', { name: 'John Doe' })).toHaveTextContent('JD')
  })

  it('renders the avatar image when avatarUrl is set', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'ab@example.com' } })
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', displayName: 'AB', avatarUrl: 'https://example.com/avatar.png', phone: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '', updatedAt: '' },
      isLoading: false,
      isError: false,
    } as any)
    render(<UserAvatar />, { wrapper: makeWrapper() })
    const img = screen.getByRole('img', { name: 'AB' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('renders initials from email when displayName is empty', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'jane.smith@example.com' } })
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', displayName: '', avatarUrl: '', phone: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '', updatedAt: '' },
      isLoading: false,
      isError: false,
    } as any)
    render(<UserAvatar />, { wrapper: makeWrapper() })
    expect(screen.getByRole('img', { name: /jane/i })).toHaveTextContent('JS')
  })

  it('renders a placeholder when there is no user or profile', () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as any)
    render(<UserAvatar />, { wrapper: makeWrapper() })
    expect(screen.getByRole('img')).toHaveTextContent('?')
  })
})
