import { useState, useRef, useEffect } from 'react'
import { useUpdateJobStatus, useDeleteJob } from '../hooks/use-jobs'
import { useJobsCopy } from '../copy'
import type { JobPosting, JobStatus } from '../types'
import { ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { statusToken, spacing, fontSize } from '@/shared/design-tokens'
import { TagBadge } from '@/shared/components/TagBadge'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

const statusValues: JobStatus[] = ['saved', 'applied', 'interviewing', 'rejected', 'offer']

interface Props {
  job: JobPosting
}

export function JobCard({ job }: Props) {
  const copy = useJobsCopy()
  const [showDescription, setShowDescription] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const [showAllTechs, setShowAllTechs] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    if (!showAllTechs) {
      const el = tagsRef.current
      if (el) {
        setIsOverflowing(el.scrollHeight > el.clientHeight)
      }
    }
  }, [job.technologies, showAllTechs])

  const updateStatus = useUpdateJobStatus()
  const deleteJob = useDeleteJob()

  const handleStatusChange = (value: string) => {
    updateStatus.mutate({ id: job.id, status: value as JobStatus })
  }

  const handleDelete = () => {
    deleteJob.mutate(job.id)
  }

  const status = statusToken(job.status)

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow gap-0 p-0">
      <CardHeader className="p-4 pb-3 gap-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={cn('truncate text-base font-semibold text-foreground')}>
              {job.title}
            </h3>
            <p className={cn('truncate text-muted-foreground', fontSize.body)}>
              {job.company}
            </p>
          </div>
          <Badge
            variant="static"
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 font-medium',
              status.bg,
              status.text,
            )}
          >
            {copy.statusLabels[job.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {job.workMode && <TagBadge kind="workMode" value={job.workMode} />}
          {job.employmentType && <TagBadge kind="employment" value={job.employmentType} />}
          {job.seniority && <TagBadge kind="seniority" value={job.seniority} />}
        </div>

        {job.location && (
          <p className={cn('text-muted-foreground', fontSize.caption)}>{job.location}</p>
        )}
        {job.salary && (
          <p className={cn('font-medium text-muted-foreground', fontSize.caption)}>
            {job.salary}
          </p>
        )}
        <div className={cn('flex flex-wrap gap-3 text-muted-foreground', fontSize.caption)}>
          {job.recruiterName && <span>{copy.card.recruiterPrefix} {job.recruiterName}</span>}
          {job.publishedAt && <span>{job.publishedAt}</span>}
        </div>

        {job.technologies.length > 0 && (
          <div>
            <div
              ref={tagsRef}
              className={cn(
                'flex flex-wrap gap-1',
                !showAllTechs && 'max-h-[4.5rem] overflow-hidden',
              )}
            >
              {job.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="static"
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-medium',
                    fontSize.caption,
                    'bg-secondary text-secondary-foreground',
                  )}
                >
                  {tech}
                </Badge>
              ))}
            </div>
            {isOverflowing && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setShowAllTechs(!showAllTechs)}
                className="h-auto p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAllTechs ? copy.card.showLess : copy.card.seeMore}
              </Button>
            )}
          </div>
        )}

        {job.description && (
          <div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setShowDescription(!showDescription)}
              className="h-auto p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showDescription ? (
                <>
                  <ChevronUp size={12} /> {copy.card.hideDescription}
                </>
              ) : (
                <>
                  <ChevronDown size={12} /> {copy.card.showDescription}
                </>
              )}
            </Button>
            {showDescription && (
              <p className={cn('mt-1 line-clamp-6 whitespace-pre-wrap text-muted-foreground', fontSize.caption)}>
                {job.description}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className={cn(spacing.cardFooter, 'border-t border-border flex items-center justify-between gap-1')}>
        <Select value={job.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={cn(
            'h-5 w-auto min-w-[4rem] border-input bg-transparent text-muted-foreground px-1.5 gap-1',
            fontSize.caption,
            '[&>svg]:size-3',
          )}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusValues.map((value) => (
              <SelectItem key={value} value={value} className={fontSize.caption}>
                {copy.statusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className={cn('flex items-center', spacing.buttonGroup)}>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={copy.card.openSource}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
          >
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={9} />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={copy.card.deleteJob}
            onClick={handleDelete}
            className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={9} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
