import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth.store'

const API_BASE = import.meta.env.BACKEND_API_URL

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: { id: string; email: string }
}

function toAuthUser(u: { id: string; email: string }) {
  return { id: u.id, email: u.email, displayName: '', avatarUrl: '' }
}

export function useAuth() {
  const { token, refreshToken, user, isAuthenticated, setAuth, clearAuth, hydrateProfile } =
    useAuthStore()
  const navigate = useNavigate()

  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Registration failed')
    }
    const data: AuthResponse = await res.json()
    setAuth(data.access_token, data.refresh_token, toAuthUser(data.user))
    void hydrateProfile()
    navigate({ to: '/' })
  }, [setAuth, hydrateProfile, navigate])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Login failed')
    }
    const data: AuthResponse = await res.json()
    setAuth(data.access_token, data.refresh_token, toAuthUser(data.user))
    void hydrateProfile()
    navigate({ to: '/' })
  }, [setAuth, hydrateProfile, navigate])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Best effort logout
    }
    clearAuth()
    navigate({ to: '/auth' })
  }, [token, clearAuth, navigate])

  const refreshAuth = useCallback(async () => {
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        clearAuth()
        navigate({ to: '/auth' })
        return false
      }
      const data: AuthResponse = await res.json()
      setAuth(data.access_token, data.refresh_token, toAuthUser(data.user))
      return true
    } catch {
      clearAuth()
      navigate({ to: '/auth' })
      return false
    }
  }, [refreshToken, clearAuth, setAuth, navigate])

  return { token, user, isAuthenticated, register, login, logout, refreshAuth }
}
