import type { JobPosting, JobStatus } from '../types'
import { JobCard } from './JobCard'

interface Props {
  status: JobStatus
  title: string
  jobs: JobPosting[]
}

export function KanbanColumn({ title, jobs }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b pb-2 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {jobs.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No jobs yet
          </p>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </section>
  )
}
