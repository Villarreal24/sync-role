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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, refreshToken, user) =>
    set({ token, refreshToken, user, isAuthenticated: true }),
  clearAuth: () =>
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
  setToken: (token) => set({ token }),
}))
