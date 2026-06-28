import { useJobsQuery } from '../hooks/use-jobs'
import { useJobFiltersStore } from '../store/job.store'
import { KanbanColumn } from './KanbanColumn'
import type { JobStatus } from '../types'

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
      <div className="flex items-center justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Failed to load jobs. Make sure the backend server is running.
      </div>
    )
  }

  const filteredJobs = (jobs ?? []).filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pl-10 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-blue-500"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
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
