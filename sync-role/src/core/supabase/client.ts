import { createBrowserClient } from '@supabase/ssr'

function getAll(): Array<{ name: string; value: string }> {
  if (typeof document === 'undefined') return []
  return document.cookie.split('; ').filter(Boolean).map((pair) => {
    const sep = pair.indexOf('=')
    if (sep === -1) return { name: pair, value: '' }
    return { name: pair.slice(0, sep), value: pair.slice(sep + 1) }
  })
}

function setAll(cookies: Array<{ name: string; value: string }>) {
  if (typeof document === 'undefined') return
  cookies.forEach(({ name, value }) => {
    document.cookie = `${name}=${value}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  })
}

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    cookies: { getAll, setAll },
  },
)

export function getSupabaseBrowserClient() {
  return supabase
}
