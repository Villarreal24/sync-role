import { useState } from 'react'
import { MoreHorizontal, ExternalLink, Trash2 } from 'lucide-react'
import { useUpdateJobStatus, useDeleteJob } from '../hooks/use-jobs'
import { useJobsCopy } from '../copy'
import type { JobStatus, JobPosting } from '../types'
import { statusToken } from '@/shared/design-tokens'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'

const statusValues: JobStatus[] = ['saved', 'applied', 'interviewing', 'rejected', 'offer']

interface JobActionsMenuProps {
  job: JobPosting
}

export function JobActionsMenu({ job }: JobActionsMenuProps) {
  const copy = useJobsCopy()
  const [open, setOpen] = useState(false)
  const updateStatus = useUpdateJobStatus()
  const deleteJob = useDeleteJob()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={copy.actions.openMenu}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {copy.actions.viewSource}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{copy.actions.changeStatus}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusValues.map((value) => (
              <DropdownMenuItem
                key={value}
                onSelect={() => updateStatus.mutate({ id: job.id, status: value })}
              >
                {statusToken(value).label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => deleteJob.mutate(job.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {copy.actions.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
