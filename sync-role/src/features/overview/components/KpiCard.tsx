import type { LucideIcon } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

interface KpiCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  subtext?: string
  subtextTone?: 'success' | 'warning' | 'info' | 'muted'
}

const toneClass: Record<NonNullable<KpiCardProps['subtextTone']>, string> = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
  muted: 'text-muted-foreground',
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  subtext,
  subtextTone = 'muted',
}: KpiCardProps) {
  return (
    <Card className="relative h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            'h-5 w-5 shrink-0',
            subtextTone === 'success' && 'text-emerald-500',
            subtextTone === 'warning' && 'text-amber-500',
            subtextTone === 'info' && 'text-sky-500',
            subtextTone === 'muted' && 'text-muted-foreground',
          )}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      {subtext ? (
        <p className={cn('mt-1 text-xs', toneClass[subtextTone])}>{subtext}</p>
      ) : null}
    </Card>
  )
}
