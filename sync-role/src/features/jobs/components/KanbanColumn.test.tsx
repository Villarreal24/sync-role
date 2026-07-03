import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { useJobFiltersStore } from '../store/job.store'
import { makeJob } from '../__fixtures__/jobs'

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('KanbanColumn', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
  })

  it('renders its title and the job count', () => {
    renderWithQueryClient(
      <KanbanColumn
        status="offer"
        title="Offer"
        jobs={[makeJob({ id: 'a' }), makeJob({ id: 'b' })]}
      />,
    )
    const section = screen.getByText('Offer').closest('section') as HTMLElement
    expect(section).toBeInTheDocument()
    expect(within(section).getByText('2')).toBeInTheDocument()
    expect(within(section).getByText('Offer')).toBeInTheDocument()
  })

  it('shows "No jobs yet" when empty', () => {
    renderWithQueryClient(<KanbanColumn status="offer" title="Offer" jobs={[]} />)
    expect(screen.getByText('No jobs yet')).toBeInTheDocument()
  })

  it('renders one card per job', () => {
    renderWithQueryClient(
      <KanbanColumn
        status="applied"
        title="Applied"
        jobs={[
          makeJob({ id: 'a', title: 'Job A' }),
          makeJob({ id: 'b', title: 'Job B' }),
          makeJob({ id: 'c', title: 'Job C' }),
        ]}
      />,
    )
    const section = screen.getByText('Applied').closest('section') as HTMLElement
    expect(within(section).getByText('Job A')).toBeInTheDocument()
    expect(within(section).getByText('Job B')).toBeInTheDocument()
    expect(within(section).getByText('Job C')).toBeInTheDocument()
  })
})
