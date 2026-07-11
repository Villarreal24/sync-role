import { useState, useRef, useEffect, useOptimistic, startTransition } from 'react'
import { ExternalLink, Plus, Trash2, AlertCircle, Pencil } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/components/ui/tooltip'
import { useJobsCopy } from '../copy'
import { useUpdateJob } from '../hooks/use-jobs'
import type { JobPosting, Note } from '../types'
import { TagBadge } from '@/shared/components/TagBadge'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import { fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'
import { formatPublishDate, formatCreatedAt } from '@/shared/date'
import { useLocale } from '@/shared/copy/locale'

interface Props {
  job: JobPosting | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type NoteAction =
  | { type: 'add'; note: Note }
  | { type: 'remove'; noteId: string }
  | { type: 'edit'; noteId: string; title: string; content: string }

export function JobDetailSheet({ job, open, onOpenChange }: Props) {
  const copy = useJobsCopy()
  const { locale } = useLocale()
  const updateJob = useUpdateJob()
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const notes = (job?.ownershipNote ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const [optimisticNotes, dispatchNotes] = useOptimistic(
    notes,
    (state: Note[], action: NoteAction) => {
      switch (action.type) {
        case 'add':
          return state.some((n) => n.id === action.note.id)
            ? state
            : [action.note, ...state]
        case 'remove':
          return state.filter((n) => n.id !== action.noteId)
        case 'edit':
          return state.map((n) =>
            n.id === action.noteId
              ? { ...n, title: action.title, content: action.content }
              : n,
          )
      }
    },
  )

  useEffect(() => {
    if (!open) {
      setNoteTitle('')
      setNoteContent('')
      setError(null)
      setEditingId(null)
      setEditTitle('')
      setEditContent('')
    }
  }, [open])

  if (!job) return null

  const date = formatPublishDate(job.publishedAt)

  const handleAddNote = () => {
    if (!noteContent.trim()) return
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: new Date().toISOString(),
    }
    const updatedNotes = [...notes, newNote]
    const prevTitle = noteTitle
    const prevContent = noteContent

    setNoteTitle('')
    setNoteContent('')
    setError(null)

    startTransition(async () => {
      dispatchNotes({ type: 'add', note: newNote })
      try {
        await updateJob.mutateAsync({ id: job.id, data: { ownershipNote: updatedNotes } })
      } catch {
        setNoteTitle(prevTitle)
        setNoteContent(prevContent)
        setError(copy.sheet.noteSaveError)
        setTimeout(() => setError(null), 6000)
      }
    })
  }

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId)
    setError(null)

    startTransition(async () => {
      dispatchNotes({ type: 'remove', noteId })
      try {
        await updateJob.mutateAsync({ id: job.id, data: { ownershipNote: updatedNotes } })
      } catch {
        setError(copy.sheet.noteSaveError)
        setTimeout(() => setError(null), 6000)
      }
    })
  }

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return
    const noteId = editingId
    const freshTitle = editTitle.trim()
    const freshContent = editContent.trim()
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, title: freshTitle, content: freshContent } : n,
    )

    setEditingId(null)
    setEditTitle('')
    setEditContent('')

    startTransition(async () => {
      dispatchNotes({ type: 'edit', noteId, title: freshTitle, content: freshContent })
      try {
        await updateJob.mutateAsync({ id: job.id, data: { ownershipNote: updatedNotes } })
      } catch {
        setError(copy.sheet.noteSaveError)
        setTimeout(() => setError(null), 6000)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0" closeLabel={copy.sheet.close}>
        <SheetHeader className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg leading-tight">{job.title}</SheetTitle>
              <SheetDescription className="mt-0.5 text-base font-medium text-foreground">
                {job.company}
              </SheetDescription>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {job.workMode && <TagBadge kind="workMode" value={job.workMode} />}
            {job.employmentType && <TagBadge kind="employment" value={job.employmentType} />}
            {job.seniority && <TagBadge kind="seniority" value={job.seniority} />}
            <div className="ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    aria-label={copy.card.openSourceTooltip}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copy.card.openSourceTooltip}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SheetHeader>

        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {job.location && (
                <div>
                  <p className={cn('text-muted-foreground', fontSize.caption)}>
                    {copy.sheet.location}
                  </p>
                  <p className={cn('text-foreground', fontSize.body)}>{job.location}</p>
                </div>
              )}
              {job.salary && (
                <div>
                  <p className={cn('text-muted-foreground', fontSize.caption)}>
                    {copy.sheet.salary}
                  </p>
                  <p className={cn('text-foreground', fontSize.body)}>{job.salary}</p>
                </div>
              )}
              {job.recruiterName && (
                <div>
                  <p className={cn('text-muted-foreground', fontSize.caption)}>
                    {copy.sheet.recruiter}
                  </p>
                  <p className={cn('text-foreground', fontSize.body)}>{job.recruiterName}</p>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <h4 className={cn('mb-2 font-semibold text-foreground', fontSize.body)}>
                {copy.sheet.details}
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className={cn('text-muted-foreground', fontSize.caption)}>
                    {copy.sheet.publishedAt}
                  </span>
                  <span className={cn('text-foreground', fontSize.caption)}>
                    {date.isExact ? (
                      <span className="underline-offset-4 hover:underline cursor-default" title={date.full ?? undefined}>
                        {date.display}
                      </span>
                    ) : (
                      date.display
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={cn('text-muted-foreground', fontSize.caption)}>
                    {copy.sheet.appliedAt}
                  </span>
                  <span
                    className={cn('text-foreground', fontSize.caption)}
                    title={formatCreatedAt(job.createdAt, locale)}
                  >
                    {formatCreatedAt(job.createdAt, locale)}
                  </span>
                </div>
              </div>
            </div>

            {job.technologies.length > 0 && (
              <div className="border-t border-border pt-5">
                <h4 className={cn('mb-2 font-semibold text-foreground', fontSize.body)}>
                  {copy.sheet.technologies}
                </h4>
                <div className="flex flex-wrap gap-1.5">
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
              </div>
            )}

            {job.description && (
              <div className="border-t border-border pt-5">
                <h4 className={cn('mb-2 font-semibold text-foreground', fontSize.body)}>
                  {copy.sheet.description}
                </h4>
                <p className={cn('whitespace-pre-wrap text-muted-foreground leading-relaxed', fontSize.body)}>
                  {job.description}
                </p>
              </div>
            )}

            <div className="border-t border-border pt-5">
              <h4 className={cn('mb-3 font-semibold text-foreground', fontSize.body)}>
                {copy.sheet.notes}
              </h4>

              {error && (
                <Alert variant="destructive" className="mb-3 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className={cn(fontSize.caption)}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  placeholder={copy.sheet.noteTitlePlaceholder}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder={copy.sheet.addNotePlaceholder}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddNote()
                      }
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="h-8 shrink-0"
                  >
                    <Plus size={14} className="mr-1" />
                    {copy.sheet.addNote}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {optimisticNotes.length === 0 ? (
                  <p className={cn('text-muted-foreground italic', fontSize.caption)}>
                    {copy.sheet.noNotes}
                  </p>
                ) : (
                  optimisticNotes.map((note) => {
                    const isSaving = !notes.some((n) => n.id === note.id)
                    return (
                      <div
                        key={note.id}
                        className={cn(
                          'group flex items-start gap-2 rounded-lg border border-border p-3',
                          isSaving ? 'bg-muted/10 opacity-60' : 'bg-muted/30',
                        )}
                      >
                        {editingId === note.id ? (
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              placeholder={copy.sheet.noteTitlePlaceholder}
                              className="h-8 text-xs"
                              autoFocus
                            />
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSaveEdit()
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              placeholder={copy.sheet.editNotePlaceholder}
                              rows={3}
                              className={cn(
                                'flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[60px]',
                                fontSize.caption,
                              )}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-7 text-xs"
                              >
                                {copy.sheet.cancelEdit}
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editContent.trim()}
                                className="h-7 text-xs"
                              >
                                {copy.sheet.saveNote}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              {note.title && (
                                <p className={cn('font-medium text-foreground', fontSize.body)}>
                                  {note.title}
                                </p>
                              )}
                              <p className={cn('text-muted-foreground whitespace-pre-wrap', fontSize.caption)}>
                                {note.content}
                              </p>
                              <p className={cn('mt-1 text-muted-foreground/60', fontSize.caption)}>
                                {formatCreatedAt(note.createdAt, locale)}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit note"
                                onClick={() => handleStartEdit(note)}
                                disabled={isSaving}
                                className={cn(
                                  'mt-0.5 h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground',
                                  isSaving ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
                                )}
                              >
                                <Pencil size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete note"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={isSaving}
                                className={cn(
                                  'mt-0.5 h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive',
                                  isSaving ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
                                )}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
