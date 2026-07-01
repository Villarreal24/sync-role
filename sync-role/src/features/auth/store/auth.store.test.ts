import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'

const mockUser = { id: 'user-1', email: 'test@example.com' }

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })

  it('setAuth sets token, user, and isAuthenticated', () => {
    useAuthStore.getState().setAuth('test-token', 'test-refresh', mockUser)
    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token')
    expect(state.refreshToken).toBe('test-refresh')
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clearAuth resets all auth state', () => {
    useAuthStore.getState().setAuth('test-token', 'test-refresh', mockUser)
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setToken updates only the access token', () => {
    useAuthStore.getState().setAuth('old-token', 'test-refresh', mockUser)
    useAuthStore.getState().setToken('new-token')
    const state = useAuthStore.getState()
    expect(state.token).toBe('new-token')
    expect(state.refreshToken).toBe('test-refresh')
    expect(state.isAuthenticated).toBe(true)
  })
})
