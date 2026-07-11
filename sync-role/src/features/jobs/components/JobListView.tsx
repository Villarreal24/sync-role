import { Search } from 'lucide-react'
import { useJobsQuery } from '../hooks/use-jobs'
import { useJobFiltersStore } from '../store/job.store'
import { useJobsCopy } from '../copy'
import { useLocale } from '@/shared/copy/locale'
import { JobActionsMenu } from './JobActionsMenu'
import type { JobPosting } from '../types'
import { statusToken, fontSize, spacing } from '@/shared/design-tokens'
import { TagBadge } from '@/shared/components/TagBadge'
import { formatPublishDate, formatCreatedAt, formatListDate } from '@/shared/date'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

interface Props {
  onRowClick?: (job: JobPosting) => void
}

export function JobListView({ onRowClick }: Props) {
  const copy = useJobsCopy()
  const { locale } = useLocale()
  const { data: jobs, isLoading, error } = useJobsQuery()
  const searchQuery = useJobFiltersStore((s) => s.searchQuery)
  const statusFilter = useJobFiltersStore((s) => s.statusFilter)
  const setSearchQuery = useJobFiltersStore((s) => s.setSearchQuery)

  if (isLoading) {
    return (
      <div className={cn('flex flex-col', spacing.section)}>
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="gap-0 p-0 overflow-hidden">
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{copy.board.errorTitle}</AlertTitle>
        <AlertDescription>{copy.board.errorDescription}</AlertDescription>
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
    <div className={cn('flex flex-col', spacing.section)}>
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
          <Input
            type="text"
            placeholder={copy.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
      </div>

      <Card className="gap-0 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.vacancyCompany}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.status}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.modality}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.salary}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.publishDate}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold', fontSize.caption)}>
                {copy.list.postulationDate}
              </TableHead>
              <TableHead className={cn('text-muted-foreground uppercase tracking-wider font-semibold text-right', fontSize.caption)}>
                {copy.list.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className={cn('text-center text-muted-foreground', spacing.tableEmpty)}>
                  {copy.common.noJobs}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => {
                const status = statusToken(job.status)
                const label = copy.statusLabels[job.status]
                const date = formatPublishDate(job.publishedAt)
                const dateCell = date.isExact ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default underline-offset-4 hover:underline">
                        {date.display}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{date.full}</TooltipContent>
                  </Tooltip>
                ) : (
                  <span>{date.display}</span>
                )
                const postulation = formatListDate(job.createdAt, locale)
                return (
                  <TableRow
                    key={job.id}
                    className={cn('border-b-border', onRowClick && 'cursor-pointer')}
                    onClick={() => onRowClick?.(job)}
                  >
                    <TableCell className={spacing.tableCell}>
                      <div className="font-semibold text-foreground">{job.title}</div>
                      <div className={cn('text-muted-foreground', fontSize.caption)}>
                        {job.company}
                      </div>
                    </TableCell>
                    <TableCell className={spacing.tableCell}>
                      <Badge
                        variant="static"
                        className={cn(
                          'rounded-full px-2.5 py-0.5 font-medium',
                          status.bg,
                          status.text,
                        )}
                      >
                        {label}
                      </Badge>
                    </TableCell>
                    <TableCell className={spacing.tableCell}>
                      <div className="flex flex-wrap gap-1">
                        {job.workMode && <TagBadge kind="workMode" value={job.workMode} />}
                        {job.employmentType && (
                          <TagBadge kind="employment" value={job.employmentType} />
                        )}
                        {job.seniority && <TagBadge kind="seniority" value={job.seniority} />}
                      </div>
                    </TableCell>
                    <TableCell className={cn(spacing.tableCell, 'text-foreground')}>
                      {job.salary || '—'}
                    </TableCell>
                    <TableCell className={cn(spacing.tableCell, 'text-muted-foreground', fontSize.body)}>
                      {dateCell}
                    </TableCell>
                    <TableCell className={cn(spacing.tableCell, 'text-muted-foreground', fontSize.caption)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default underline-offset-4 hover:underline leading-tight">
                            {postulation.datePart}
                            <br />
                            {postulation.timePart}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatCreatedAt(job.createdAt, locale)}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      className={cn(spacing.tableCell, 'text-right')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <JobActionsMenu job={job} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
