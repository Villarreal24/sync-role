import { Badge } from '@/shared/components/ui/badge'
import { tagToken, type TagKind, fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'

interface TagBadgeProps {
  kind: TagKind
  value: string
  className?: string
}

export function TagBadge({ kind, value, className }: TagBadgeProps) {
  const token = tagToken(kind, value)
  return (
    <Badge
      variant="static"
      className={cn(
        'rounded-full px-2 py-0.5 font-medium',
        fontSize.caption,
        token.bg,
        token.text,
        className,
      )}
    >
      {value}
    </Badge>
  )
}
