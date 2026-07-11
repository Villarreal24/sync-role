import type { JobPosting, JobStatus } from '../types'
import { JobCard } from './JobCard'
import { Badge } from '@/shared/components/ui/badge'

interface Props {
  status: JobStatus
  title: string
  jobs: JobPosting[]
  onCardClick: (job: JobPosting) => void
}

export function KanbanColumn({ title, jobs, onCardClick }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Badge
          variant="secondary"
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2"
        >
          {jobs.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet</p>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onCardClick(job)} />)
        )}
      </div>
    </section>
  )
}
