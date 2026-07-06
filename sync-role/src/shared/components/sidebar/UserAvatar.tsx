import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMounted } from '@/shared/hooks/use-mounted'
import { cn } from '@/shared/lib/utils'

interface UserAvatarProps {
  size?: 'sm' | 'md'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
}

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]/g, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (local.slice(0, 2) || '?').toUpperCase()
}

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (parts[0]?.slice(0, 2) || '?').toUpperCase()
}

export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  // SSR safety: until React mounts on the client, ignore the auth
  // store (which on the server has no user because getCookie() returns
  // null outside the browser) and render the neutral fallback. After
  // mount, the store is read and the avatar re-renders with the real
  // user data.
  const mounted = useMounted()
  const user = useAuthStore((s) => s.user)
  const displayName = mounted ? (user?.displayName ?? '') : ''
  const avatarUrl = mounted ? (user?.avatarUrl ?? '') : ''
  const email = mounted ? (user?.email ?? '') : ''

  const initials = displayName
    ? initialsFromDisplayName(displayName)
    : email
      ? initialsFromEmail(email)
      : '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || email || 'User avatar'}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground',
        sizeMap[size],
        className,
      )}
      aria-label={displayName || email || 'User avatar'}
      role="img"
    >
      {initials}
    </div>
  )
}
