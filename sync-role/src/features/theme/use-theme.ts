import { useEffect } from 'react'
import { useThemeStore, type Theme } from './theme.store'

const STORAGE_KEY = 'sync-role:theme'

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 'system'
    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } }
    const theme = parsed?.state?.theme
    if (theme === 'light' || theme === 'dark' || theme === 'system') return theme
  } catch {
    // ignore
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return theme
}

function applyResolvedToHtml(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const setResolvedTheme = useThemeStore((s) => s.setResolvedTheme)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const current = useThemeStore.getState().theme
    const resolved = resolveTheme(current)
    applyResolvedToHtml(resolved)
    setResolvedTheme(resolved)

    if (current !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const next: 'light' | 'dark' = mql.matches ? 'dark' : 'light'
      applyResolvedToHtml(next)
      setResolvedTheme(next)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, setResolvedTheme])

  return { theme, resolvedTheme: resolvedTheme ?? resolveTheme(theme), setTheme }
}

export { readStoredTheme, resolveTheme, applyResolvedToHtml }
