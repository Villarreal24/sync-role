import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobDetailSheet } from './JobDetailSheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CopyProvider } from '@/shared/copy/locale'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { makeJob } from '../__fixtures__/jobs'

function renderSheet(job = makeJob(), open = true, onOpenChange = vi.fn()) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <CopyProvider>
        <TooltipProvider>
          <JobDetailSheet job={job} open={open} onOpenChange={onOpenChange} />
        </TooltipProvider>
      </CopyProvider>
    </QueryClientProvider>,
  )
}

describe('JobDetailSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = renderSheet(makeJob(), false)
    expect(container.textContent).toBe('')
  })

  it('renders job title and company', () => {
    renderSheet()
    expect(screen.getByText('AI Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Inc')).toBeInTheDocument()
  })

  it('renders tags', () => {
    renderSheet()
    expect(screen.getAllByText('Remote').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Full-time')).toBeInTheDocument()
    expect(screen.getByText('Mid')).toBeInTheDocument()
  })

  it('renders location and salary', () => {
    renderSheet()
    expect(screen.getByText('$5,000 - $8,000 per month')).toBeInTheDocument()
  })

  it('renders recruiter label and name', () => {
    renderSheet()
    expect(screen.getByText('Recruiter')).toBeInTheDocument()
    expect(screen.getByText('Jane Recruiter')).toBeInTheDocument()
  })

  it('renders technologies', () => {
    renderSheet()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  it('renders description', () => {
    renderSheet()
    expect(screen.getByText(/LLM infrastructure/)).toBeInTheDocument()
  })

  it('renders notes section with empty state', () => {
    renderSheet()
    expect(screen.getByText('No notes yet')).toBeInTheDocument()
  })

  it('shows existing notes', () => {
    const job = makeJob({
      ownershipNote: [
        {
          id: 'n1',
          title: 'Initial Interview',
          content: 'Talked with HR about salary expectations',
          createdAt: '2026-06-01T10:00:00Z',
        },
      ],
    })
    renderSheet(job)
    expect(screen.getByText('Initial Interview')).toBeInTheDocument()
    expect(screen.getByText('Talked with HR about salary expectations')).toBeInTheDocument()
  })

  it('has an external link button', () => {
    renderSheet()
    const link = screen.getByLabelText('View posting')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/jobs/1')
  })
})
