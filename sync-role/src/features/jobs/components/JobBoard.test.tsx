import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { JobBoard } from './JobBoard'
import { useJobFiltersStore } from '../store/job.store'
import { makeJobList } from '../__fixtures__/jobs'

vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  AuthError: class AuthError extends Error {},
}))

import { apiClient } from '@/core/api/client'

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('JobBoard', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
    vi.clearAllMocks()
  })

  it('shows a loading skeleton while jobs are fetching', () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    renderWithQueryClient(<JobBoard />)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows an error alert when the query fails', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'))
    renderWithQueryClient(<JobBoard />)
    expect(await screen.findByText(/failed to load jobs/i)).toBeInTheDocument()
  })

  it('renders all 5 columns with their counts', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobBoard />)

    const columnTitles = await screen.findAllByRole('heading', { level: 2 })
    const titleTexts = columnTitles.map((h) => h.textContent)
    expect(titleTexts).toEqual(['Saved', 'Applied', 'Interviewing', 'Rejected', 'Offer'])
  })

  it('distributes jobs across columns based on status', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobBoard />)

    await screen.findByText('AI Engineer (LLMs, RAG)')
    const appliedHeading = screen.getByRole('heading', { name: 'Applied', level: 2 })
    const appliedColumn = appliedHeading.closest('section') as HTMLElement
    expect(within(appliedColumn).getByText('AI Engineer (LLMs, RAG)')).toBeInTheDocument()
    expect(within(appliedColumn).getByText('Full Stack Software Engineer')).toBeInTheDocument()
    expect(within(appliedColumn).getByText('Sr Software Engineer')).toBeInTheDocument()
  })

  it('orders cards within each column by createdAt DESC (newest first)', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobBoard />)

    await screen.findByText('AI Engineer (LLMs, RAG)')

    const appliedHeading = screen.getByRole('heading', { name: 'Applied', level: 2 })
    const appliedColumn = appliedHeading.closest('section') as HTMLElement
    const cardTitles = within(appliedColumn)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(cardTitles).toEqual([
      'Sr Software Engineer',
      'Full Stack Software Engineer',
      'AI Engineer (LLMs, RAG)',
    ])

    const interviewingHeading = screen.getByRole('heading', { name: 'Interviewing', level: 2 })
    const interviewingColumn = interviewingHeading.closest('section') as HTMLElement
    const interviewingTitles = within(interviewingColumn)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(interviewingTitles).toEqual(['Backend Developer'])
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobBoard />)

    const input = await screen.findByPlaceholderText(/search by title or company/i)
    await user.type(input, 'Backend')

    await waitFor(() => {
      expect(screen.getByText('Backend Developer')).toBeInTheDocument()
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
    })
  })

  it('shows "No jobs yet" in empty columns', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
    renderWithQueryClient(<JobBoard />)

    await screen.findByText('Saved')
    const emptyMessages = screen.getAllByText('No jobs yet')
    expect(emptyMessages.length).toBe(5)
  })
})
