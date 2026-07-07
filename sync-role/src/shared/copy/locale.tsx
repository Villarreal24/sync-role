import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * The two locales the app supports today. Latin American Spanish
 * is the explicit second language; the provider defaults to English
 * so a fresh visitor sees the same copy as before.
 */
export type Locale = 'en' | 'es'

export interface CopyContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const STORAGE_KEY = 'sync-role:locale'

const CopyContext = createContext<CopyContextValue>({
  locale: 'en',
  setLocale: () => {},
})

/**
 * Read the current locale + setter. The default is 'en' so any
 * component that renders without a <CopyProvider/> (e.g. unit tests)
 * still gets English copy and doesn't crash.
 */
export function useLocale(): CopyContextValue {
  return useContext(CopyContext)
}

/**
 * Mount once at the app root (src/routes/__root.tsx). Initial state
 * is always 'en' on both server and first client render — the
 * stored locale is read in a useEffect AFTER mount, so:
 *   - SSR and first client render produce identical HTML (no
 *     hydration mismatch).
 *   - After mount, if the user had switched languages before, the
 *     app re-renders with the right copy.
 */
export function CopyProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'es') {
        setLocaleState(stored)
      }
    } catch {
      // localStorage blocked (private mode, etc.) — keep the default
    }
  }, [])

  const value = useMemo<CopyContextValue>(
    () => ({
      locale,
      setLocale: (l) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, l)
        } catch {
          // ignore — best effort
        }
        setLocaleState(l)
      },
    }),
    [locale],
  )

  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>
}
