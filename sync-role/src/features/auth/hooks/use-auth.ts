import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSupabaseBrowserClient } from '@/core/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

const API_BASE = import.meta.env.BACKEND_API_URL

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true })
  const navigate = useNavigate()

  useEffect(() => {
    const client = getSupabaseBrowserClient()

    // Check current session from cookies
    client.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
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
    // Backend sets httpOnly cookie — refresh session state
    const client = getSupabaseBrowserClient()
    const { data: { session } } = await client.auth.getSession()
    if (session) {
      setState({ user: session.user, session, loading: false })
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
    // Backend sets httpOnly cookie — refresh session state
    const client = getSupabaseBrowserClient()
    const { data: { session } } = await client.auth.getSession()
    if (session) {
      setState({ user: session.user, session, loading: false })
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
    const client = getSupabaseBrowserClient()
    await client.auth.signOut()
    setState({ user: null, session: null, loading: false })
    navigate({ to: '/auth', replace: true })
  }, [navigate])

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    register,
    login,
    signInWithGoogle,
    logout,
  }
}
