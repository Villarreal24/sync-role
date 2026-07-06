import { useEffect, useState } from 'react'

/**
 * Returns false on the server and on the first client render, then
 * true after the first effect commit. Use this in components that
 * read from client-only state (cookies, localStorage) so the SSR
 * output and the first client render produce the same DOM. After
 * the effect, the component can re-render with the real client data
 * without React throwing away the hydrated tree.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
