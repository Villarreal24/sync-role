import { cn } from '@/shared/lib/utils'

interface SyncRoleLogoProps {
  size?: 'sm' | 'md'
  className?: string
  withBackground?: boolean
  ariaLabel?: string
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
}

const bgSizeMap = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
}

export function SyncRoleLogo({
  size = 'sm',
  className,
  withBackground = false,
  ariaLabel = 'Sync Role',
}: SyncRoleLogoProps) {
  const logo = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], className)}
      role="img"
      aria-label={ariaLabel}
    >
      <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
      <path d="M12 7 L12 12" />
      <path d="M8 9.5 L12 12" />
      <path d="M16 9.5 L12 12" />
      <path d="M8 14.5 L12 12" />
      <path d="M16 14.5 L12 12" />
      <path d="M12 17 L12 12" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="7" r="0.9" fill="currentColor" />
      <circle cx="16" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
      <circle cx="8" cy="14.5" r="0.9" fill="currentColor" />
      <circle cx="8" cy="9.5" r="0.9" fill="currentColor" />
    </svg>
  )

  if (!withBackground) return logo

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-primary text-primary-foreground',
        bgSizeMap[size],
      )}
    >
      {logo}
    </div>
  )
}
