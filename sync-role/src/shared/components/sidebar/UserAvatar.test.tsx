import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserAvatar } from './UserAvatar'
import { useAuthStore } from '@/features/auth/store/auth.store'

describe('UserAvatar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  })

  it('renders initials from displayName when set', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'john@example.com',
        displayName: 'John Doe',
        avatarUrl: '',
      },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    })
    render(<UserAvatar />)
    expect(screen.getByRole('img', { name: 'John Doe' })).toHaveTextContent('JD')
  })

  it('falls back to email initials when displayName is empty', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'jane.smith@example.com',
        displayName: '',
        avatarUrl: '',
      },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    })
    render(<UserAvatar />)
    expect(screen.getByRole('img', { name: /jane/i })).toHaveTextContent('JS')
  })

  it('renders the avatar image when avatarUrl is set', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'a@b.com',
        displayName: 'AB',
        avatarUrl: 'https://example.com/avatar.png',
      },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    })
    render(<UserAvatar />)
    const img = screen.getByRole('img', { name: 'AB' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('renders a placeholder when there is no user', () => {
    render(<UserAvatar />)
    expect(screen.getByRole('img')).toHaveTextContent('?')
  })
})
