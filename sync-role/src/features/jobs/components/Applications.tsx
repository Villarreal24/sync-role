import { useState, useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { JobBoard } from '@/features/jobs/components/JobBoard'
import { JobListView } from '@/features/jobs/components/JobListView'
import { JobDetailSheet } from '@/features/jobs/components/JobDetailSheet'
import { ViewSwitcher, type JobView } from '@/features/jobs/components/ViewSwitcher'
import { useJobsQuery } from '@/features/jobs/hooks/use-jobs'

type ApplicationsSearch = { view?: JobView }

export function Applications() {
  const navigate = useNavigate({ from: '/applications' })
  const search = useRouterState({ select: (s) => s.location.search as ApplicationsSearch })
  const view: JobView = search.view === 'list' ? 'list' : 'board'
  const { data: jobs } = useJobsQuery()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const selectedJob = useMemo(
    () => (selectedJobId ? (jobs ?? []).find((j) => j.id === selectedJobId) ?? null : null),
    [selectedJobId, jobs],
  )

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
      {view === 'list' ? (
        <JobListView onRowClick={(job) => setSelectedJobId(job.id)} />
      ) : (
        <JobBoard onCardClick={(job) => setSelectedJobId(job.id)} />
      )}
      <JobDetailSheet
        job={selectedJob}
        open={selectedJob !== null}
        onOpenChange={(open) => { if (!open) setSelectedJobId(null) }}
      />
    </div>
  )
}
