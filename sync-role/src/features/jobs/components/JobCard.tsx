import { useState, useRef, useEffect } from 'react'
import { useUpdateJobStatus, useDeleteJob } from '../hooks/use-jobs'
import { useJobsCopy } from '../copy'
import type { JobPosting, JobStatus } from '../types'
import { Calendar, ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { spacing, fontSize } from '@/shared/design-tokens'
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
import { formatCreatedAt } from '@/shared/date'
import { useLocale } from '@/shared/copy/locale'
import { useCommonCopy } from '@/shared/copy/common'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/components/ui/tooltip'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

const statusValues: JobStatus[] = ['saved', 'applied', 'interviewing', 'rejected', 'offer']

interface Props {
  job: JobPosting
  onClick?: () => void
}

export function JobCard({ job, onClick }: Props) {
  const copy = useJobsCopy()
  const commonCopy = useCommonCopy()
  const { locale } = useLocale()
  const [showDescription, setShowDescription] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleOverflowing, setTitleOverflowing] = useState(false)
  const [showAllTechs, setShowAllTechs] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const el = titleRef.current
    if (el) {
      setTitleOverflowing(el.scrollWidth > el.clientWidth)
    }
  }, [job.title])

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
    setDeleteDialogOpen(true)
  }

  return (
    <Card
      className={cn(
        'shadow-sm hover:shadow-md transition-shadow gap-0 p-0',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-3 gap-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {titleOverflowing ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 ref={titleRef} className={cn('truncate text-base font-semibold text-foreground')}>
                    {job.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>{job.title}</TooltipContent>
              </Tooltip>
            ) : (
              <h3 ref={titleRef} className={cn('truncate text-base font-semibold text-foreground')}>
                {job.title}
              </h3>
            )}
            <p className={cn('truncate text-muted-foreground', fontSize.body)}>
              {job.company}
            </p>
          </div>
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
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAllTechs(!showAllTechs)
                }}
                className="h-auto p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAllTechs ? copy.card.showLess : copy.card.seeMore}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {job.description && (
            <div>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDescription(!showDescription)
                }}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className={cn('h-5 w-5 text-muted-foreground', !job.description && 'ml-auto')}
              >
                <Calendar size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {formatCreatedAt(job.createdAt, locale)}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>

      <CardFooter className={cn(spacing.cardFooter, 'border-t border-border flex items-center justify-between gap-1')}>
        <Select value={job.status} onValueChange={handleStatusChange}>
          <SelectTrigger
            onClick={(e) => e.stopPropagation()}
            className={cn(
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={copy.card.openSourceTooltip}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={9} />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copy.card.openSourceTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={copy.card.deleteJob}
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={9} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copy.card.deleteJob}</TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => deleteJob.mutate(job.id)}
          title={copy.card.deleteConfirmTitle}
          description={copy.card.deleteConfirmDescription}
          confirmLabel={copy.card.deleteJob}
          cancelLabel={commonCopy.cancel}
        />
    </Card>
  )
}
