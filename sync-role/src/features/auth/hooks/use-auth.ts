import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { fetchSession } from '@/core/api/client'

const API_BASE = import.meta.env.BACKEND_API_URL

export interface AuthUser {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })
  const navigate = useNavigate()

  useEffect(() => {
    // Check current session via backend endpoint (reads httpOnly cookie server-side)
    fetchSession().then(({ user }) => {
      setState({ user, loading: false })
    })
  }, [])

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
    // Backend sets httpOnly cookie — fetch session from backend endpoint
    const { user } = await fetchSession()
    if (user) {
      setState({ user, loading: false })
      navigate({ to: '/' })
    }
  }, [navigate])

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
    // Backend sets httpOnly cookie — fetch session from backend endpoint
    const { user } = await fetchSession()
    if (user) {
      setState({ user, loading: false })
      navigate({ to: '/' })
    }
  }, [navigate])

  const signInWithGoogle = useCallback(async () => {
    const res = await fetch(`${API_BASE}/auth/google`)
    if (!res.ok) throw new Error('Failed to initiate Google login')
    const data = await res.json()
    window.location.href = data.url
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' })
    } catch {
      // Best effort — clear client state
    }
    setState({ user: null, loading: false })
    navigate({ to: '/auth', replace: true })
  }, [navigate])

  return {
    user: state.user,
    loading: state.loading,
    register,
    login,
    signInWithGoogle,
    logout,
  }
}
