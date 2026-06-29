import { useState } from 'react'
import { useUpdateJobStatus, useDeleteJob } from '../hooks/use-jobs'
import type { JobPosting, JobStatus } from '../types'
import { ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { getEmploymentTypeColor } from '#/shared/helpers'

const statusColors: Record<JobStatus, string> = {
  saved: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  interviewing: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
}

const statusLabels: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
  offer: 'Offer',
}

interface Props {
  job: JobPosting
}

export function JobCard({ job }: Props) {
  const [showDescription, setShowDescription] = useState(false)
  const updateStatus = useUpdateJobStatus()
  const deleteJob = useDeleteJob()

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateStatus.mutate({ id: job.id, status: e.target.value as JobStatus })
  }

  const handleDelete = () => {
    deleteJob.mutate(job.id)
  }

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {job.title}
          </h3>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {job.company}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[job.status]}`}
        >
          {statusLabels[job.status]}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {job.employmentType && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getEmploymentTypeColor(job.employmentType)}`}
          >
            {job.employmentType}
          </span>
        )}
      </div>

      {job.location && (
        <p className="mb-1 text-xs text-zinc-400">{job.location}</p>
      )}
      {job.salary && (
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {job.salary}
        </p>
      )}
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-zinc-400">
        {job.recruiterName && <span>Recruiter: {job.recruiterName}</span>}
        {job.publishedAt && <span>{job.publishedAt}</span>}
      </div>

      {job.description && (
        <div className="mb-3">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showDescription ? (
              <>
                <ChevronUp size={12} /> Hide description
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Show description
              </>
            )}
          </button>
          {showDescription && (
            <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">
              {job.description}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-3 dark:border-zinc-800">
        <select
          value={job.status}
          onChange={handleStatusChange}
          className="rounded-lg border bg-transparent px-2 py-1 text-xs text-zinc-600 outline-none transition-colors hover:border-zinc-400 focus:border-blue-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
