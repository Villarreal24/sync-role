import { createFileRoute } from '@tanstack/react-router'
import { Overview } from '@/features/overview'

export const Route = createFileRoute('/_authenticated/')({
  component: OverviewRoute,
})

function OverviewRoute() {
  return (
    <div className="mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A summary of your job applications and activity.
        </p>
      </header>
      <Overview />
    </div>
  )
}
