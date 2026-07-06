import { useJobsQuery } from '../hooks/use-jobs'
import { useJobFiltersStore } from '../store/job.store'
import { KanbanColumn } from './KanbanColumn'
import type { JobStatus } from '../types'
import { Search } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'

const columns: { status: JobStatus; title: string }[] = [
  { status: 'saved', title: 'Saved' },
  { status: 'applied', title: 'Applied' },
  { status: 'interviewing', title: 'Interviewing' },
  { status: 'rejected', title: 'Rejected' },
  { status: 'offer', title: 'Offer' },
]

export function JobBoard() {
  const { data: jobs, isLoading, error } = useJobsQuery()
  const searchQuery = useJobFiltersStore((s) => s.searchQuery)
  const statusFilter = useJobFiltersStore((s) => s.statusFilter)
  const setSearchQuery = useJobFiltersStore((s) => s.setSearchQuery)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load jobs</AlertTitle>
        <AlertDescription>
          Make sure the backend server is running.
        </AlertDescription>
      </Alert>
    )
  }

  const filteredJobs = (jobs ?? [])
    .filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            type="text"
            placeholder="Search by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            jobs={filteredJobs.filter((j) => j.status === col.status)}
          />
        ))}
      </div>
    </div>
  )
}
