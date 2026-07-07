import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { useOverviewCopy } from '../copy'

interface TopListItem {
  name: string
  count: number
}

interface TopListProps {
  title: string
  items: TopListItem[]
  /**
   * Optional class for the bar fill (e.g. a tag kind var). Falls
   * back to bg-primary when not set.
   */
  barClassName?: string
  emptyMessage?: string
}

export function TopList({
  title,
  items,
  barClassName = 'bg-primary',
  emptyMessage,
}: TopListProps) {
  const copy = useOverviewCopy()
  const resolvedEmpty = emptyMessage ?? copy.empty.noData
  const max = items.reduce((acc, i) => Math.max(acc, i.count), 0)

  return (
    <Card className="h-full p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{resolvedEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const pct = max === 0 ? 0 : (item.count / max) * 100
            return (
              <li key={item.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate" title={item.name}>
                  {item.name}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', barClassName)}
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                  {item.count}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
