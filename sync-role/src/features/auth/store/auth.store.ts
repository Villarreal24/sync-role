import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  phone: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  /**
   * True after hydrateProfile() has run at least once for this session.
   * Prevents the AuthGuard from re-fetching /profiles/me on every
   * render when the user has an empty profile (e.g. signed up via
   * email/password and never set displayName/avatarUrl — the
   * backend returns 404 and the store stays empty, so checking
   * user.displayName === '' alone would loop forever).
   */
  profileHydrated: boolean
  /** Set to 'expired' when the refresh token fails so AuthPage
   * can show a Shadcn Alert. AuthPage clears it after reading. */
  sessionExpiredReason: 'expired' | null
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void
  clearAuth: (reason?: 'expired') => void
  clearSessionExpired: () => void
  setToken: (token: string) => void
  setProfile: (displayName: string, avatarUrl: string, phone?: string | null, linkedinUrl?: string | null, githubUrl?: string | null, portfolioUrl?: string | null) => void
  hydrateProfile: () => Promise<void>
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

function loadFromCookies(): {
  token: string | null
  refreshToken: string | null
  userId: string | null
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
} {
  return {
    token: getCookie('syncrole_token'),
    refreshToken: getCookie('syncrole_refresh'),
    userId: getCookie('syncrole_uid'),
    email: getCookie('syncrole_email'),
    displayName: getCookie('syncrole_display_name'),
    avatarUrl: getCookie('syncrole_avatar_url'),
    phone: getCookie('syncrole_phone'),
    linkedinUrl: getCookie('syncrole_linkedin_url'),
    githubUrl: getCookie('syncrole_github_url'),
    portfolioUrl: getCookie('syncrole_portfolio_url'),
  }
}

const initial = loadFromCookies()
const initialUser: AuthUser | null =
  initial.userId && initial.email
    ? {
        id: initial.userId,
        email: initial.email,
        displayName: initial.displayName ?? '',
        avatarUrl: initial.avatarUrl ?? '',
        phone: initial.phone ?? null,
        linkedinUrl: initial.linkedinUrl ?? null,
        githubUrl: initial.githubUrl ?? null,
        portfolioUrl: initial.portfolioUrl ?? null,
      }
    : null

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  refreshToken: initial.refreshToken,
  user: initialUser,
  isAuthenticated: initial.token !== null && initial.userId !== null,
  profileHydrated: false,
  sessionExpiredReason: null,

  setAuth: (token, refreshToken, user) => {
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: true,
      // New session: re-hydrate the profile on next AuthGuard run.
      profileHydrated: false,
    })
    setCookie('syncrole_token', token, 3600) // access_token: 1h
    setCookie('syncrole_refresh', refreshToken, 31536000) // refresh_token: 1 año
    setCookie('syncrole_uid', user.id, 604800)
    setCookie('syncrole_email', user.email, 604800)
    if (user.displayName) setCookie('syncrole_display_name', user.displayName, 604800)
    if (user.avatarUrl) setCookie('syncrole_avatar_url', user.avatarUrl, 604800)

    // Notify the extension (content script) so it stores tokens
    window.postMessage(
      {
        type: 'SYNCROLE_AUTH',
        access_token: token,
        refresh_token: refreshToken,
        user: { id: user.id, email: user.email },
      },
      window.location.origin,
    )
  },

  clearAuth: (reason) => {
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      profileHydrated: false,
      sessionExpiredReason: reason ?? null,
    })
    removeCookie('syncrole_token')
    removeCookie('syncrole_refresh')
    removeCookie('syncrole_uid')
    removeCookie('syncrole_email')
    removeCookie('syncrole_display_name')
    removeCookie('syncrole_avatar_url')
    removeCookie('syncrole_phone')
    removeCookie('syncrole_linkedin_url')
    removeCookie('syncrole_github_url')
    removeCookie('syncrole_portfolio_url')

    // Tell the extension to drop its cached tokens so it doesn't
    // try to use a session that no longer exists server-side.
    window.postMessage({ type: 'SYNCROLE_LOGOUT' }, window.location.origin)
  },

  clearSessionExpired: () => {
    set({ sessionExpiredReason: null })
  },

  setToken: (token) => {
    set({ token })
    setCookie('syncrole_token', token, 3600)
  },

  setProfile: (displayName, avatarUrl, phone = null, linkedinUrl = null, githubUrl = null, portfolioUrl = null) => {
    const current = useAuthStore.getState().user
    if (!current) return
    set({
      user: {
        ...current,
        displayName,
        avatarUrl,
        phone,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
      },
    })
    setCookie('syncrole_display_name', displayName, 604800)
    setCookie('syncrole_avatar_url', avatarUrl, 604800)
    if (phone) setCookie('syncrole_phone', phone, 604800)
    if (linkedinUrl) setCookie('syncrole_linkedin_url', linkedinUrl, 604800)
    if (githubUrl) setCookie('syncrole_github_url', githubUrl, 604800)
    if (portfolioUrl) setCookie('syncrole_portfolio_url', portfolioUrl, 604800)
  },

  hydrateProfile: async () => {
    const { getProfile } = await import('../api/profiles')
    try {
      const profile = await getProfile()
      if (profile) {
        useAuthStore.getState().setProfile(
          profile.displayName,
          profile.avatarUrl,
          profile.phone,
          profile.linkedinUrl,
          profile.githubUrl,
          profile.portfolioUrl,
        )
      }
    } finally {
      // Mark hydrated regardless of outcome (success, 404, error) so
      // the AuthGuard doesn't loop re-fetching on every render.
      set({ profileHydrated: true })
    }
  },
}))
