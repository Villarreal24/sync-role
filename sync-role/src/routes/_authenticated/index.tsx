import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  component: Overview,
})

function Overview() {
  return (
    <div className="mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A summary of your job applications and activity.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Dashboard metrics coming soon.
        </p>
      </div>
    </div>
  )
}
