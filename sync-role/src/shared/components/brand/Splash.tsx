import { useLayoutEffect, useState } from 'react'
import { SyncRoleLogo } from './SyncRoleLogo'
import { cn } from '@/shared/lib/utils'

const FADE_MS = 400

/**
 * Branded loading state shown by the shell on first paint. Self-managed:
 * server renders without the fade class, client hydrates without it, and
 * useLayoutEffect triggers the fade + unmount on first commit. This way
 * the splash's className never differs from the React tree, avoiding
 * the hydration mismatch a script-driven class would cause.
 */
export function Splash() {
  const [fading, setFading] = useState(false)
  const [visible, setVisible] = useState(true)

  useLayoutEffect(() => {
    setFading(true)
    const timer = setTimeout(() => setVisible(false), FADE_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      id="app-splash"
      aria-hidden="true"
      className={cn(fading && 'app-splash--fading')}
    >
      <SyncRoleLogo size="md" className="text-muted-foreground" />
    </div>
  )
}
