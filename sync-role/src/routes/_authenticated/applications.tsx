import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { JobBoard } from '@/features/jobs/components/JobBoard'
import { JobListView } from '@/features/jobs/components/JobListView'
import { ViewSwitcher, type JobView } from '@/features/jobs/components/ViewSwitcher'

type ApplicationsSearch = { view?: JobView }

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: (search: Record<string, unknown>): ApplicationsSearch => {
    const view = search.view
    return { view: view === 'list' ? 'list' : 'board' }
  },
  component: Applications,
})

export function Applications() {
  const { view = 'board' } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const handleViewChange = (next: JobView) => {
    navigate({
      search: (prev) => ({ ...prev, view: next }),
      replace: true,
    })
  }

  return (
    <div className="mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your job applications
          </p>
        </div>
        <ViewSwitcher value={view} onChange={handleViewChange} />
      </header>
      {view === 'list' ? <JobListView /> : <JobBoard />}
    </div>
  )
}
