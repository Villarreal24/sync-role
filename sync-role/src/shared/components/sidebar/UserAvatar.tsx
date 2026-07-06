import { useAuthStore } from '@/features/auth/store/auth.store'
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
  const user = useAuthStore((s) => s.user)
  const displayName = user?.displayName ?? ''
  const avatarUrl = user?.avatarUrl ?? ''
  const email = user?.email ?? ''

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
