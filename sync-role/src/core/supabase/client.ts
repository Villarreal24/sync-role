import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client

  _client = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return document.cookie.split('; ').filter(Boolean).map((pair) => {
            const sep = pair.indexOf('=')
            if (sep === -1) return { name: pair, value: '' }
            return { name: pair.slice(0, sep), value: pair.slice(sep + 1) }
          })
        },
        setAll(cookies) {
          if (typeof document === 'undefined') return
          cookies.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
          })
        },
      },
    },
  )

  return _client
}
