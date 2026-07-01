import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void
  clearAuth: () => void
  setToken: (token: string) => void
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 604800): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function loadFromCookies(): { token: string | null; refreshToken: string | null; userId: string | null; email: string | null } {
  return {
    token: getCookie('syncrole_token'),
    refreshToken: getCookie('syncrole_refresh'),
    userId: getCookie('syncrole_uid'),
    email: getCookie('syncrole_email'),
  }
}

const initial = loadFromCookies()
const initialUser: AuthUser | null =
  initial.userId && initial.email ? { id: initial.userId, email: initial.email } : null

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  refreshToken: initial.refreshToken,
  user: initialUser,
  isAuthenticated: initial.token !== null && initial.userId !== null,

  setAuth: (token, refreshToken, user) => {
    set({ token, refreshToken, user, isAuthenticated: true })
    setCookie('syncrole_token', token, 3600)       // access_token: 1h
    setCookie('syncrole_refresh', refreshToken, 604800) // refresh_token: 7d
    setCookie('syncrole_uid', user.id, 604800)
    setCookie('syncrole_email', user.email, 604800)
  },

  clearAuth: () => {
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
    removeCookie('syncrole_token')
    removeCookie('syncrole_refresh')
    removeCookie('syncrole_uid')
    removeCookie('syncrole_email')
  },

  setToken: (token) => {
    set({ token })
    setCookie('syncrole_token', token, 3600)
  },
}))
