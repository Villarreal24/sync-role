import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

/**
 * Loading state for the Overview dashboard. Matches the real layout
 * (4 KPI cards on top, 2 panels below) so there's no jump when the
 * data arrives.
 */
export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-20" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-48" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-64 w-full" />
        </Card>
      </div>
    </div>
  )
}
