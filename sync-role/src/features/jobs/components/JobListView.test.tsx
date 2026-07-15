import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobListView } from './JobListView'
import { useJobFiltersStore } from '../store/job.store'
import { makeJobList } from '../__fixtures__/jobs'
import { TooltipProvider } from '@/shared/components/ui/tooltip'

vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
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

describe('JobListView', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
    vi.clearAllMocks()
  })

  it('renders all 6 column headers', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    expect(await screen.findByText('Vacancy / Company')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Modality')).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Publish date')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders a row for each job with title, company, status, modality, salary, date and actions button', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    await screen.findByText('AI Engineer (LLMs, RAG)')

    const tbody = screen.getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('row')
    expect(rows.length).toBe(makeJobList().length)

    const firstRow = rows[0]
    expect(within(firstRow).getByText('Backend Developer')).toBeInTheDocument()
    expect(within(firstRow).getByText('TechFlow')).toBeInTheDocument()
    expect(within(firstRow).getByText('Interviewing')).toBeInTheDocument()
    expect(within(firstRow).getByText('Hybrid')).toBeInTheDocument()
    expect(within(firstRow).getByText('$60,000 MXN/monthly')).toBeInTheDocument()

    const actionButtons = within(firstRow).getAllByRole('button', { name: /open menu/i })
    expect(actionButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('sorts the list by createdAt DESC (newest first)', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    await screen.findByText('AI Engineer (LLMs, RAG)')

    const tbody = screen.getAllByRole('rowgroup')[1]
    const rows = within(tbody).getAllByRole('row')
    const renderedTitles = rows.map((row) => within(row).getByText(/Engineer|Developer/).textContent)
    expect(renderedTitles).toEqual([
      'Backend Developer',
      'Sr Software Engineer',
      'Full Stack Software Engineer',
      'AI Engineer (LLMs, RAG)',
      'Software Engineer',
    ])
  })

  it('renders the "Publish date" column header', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)
    expect(await screen.findByText('Publish date')).toBeInTheDocument()
  })

  it('formats the publish date as DD/MM/YYYY and shows the full date in a tooltip on hover', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJobList().slice(0, 1).map((j) => ({ ...j, publishedAt: '2026-09-25' })),
    )
    renderWithQueryClient(<JobListView />)

    const formatted = await screen.findByText('25/09/2026')
    expect(formatted).toBeInTheDocument()
    await user.hover(formatted)
    const tooltips = await screen.findAllByRole('tooltip')
    expect(tooltips.some((el) => el.textContent === 'Friday 25 September 2026')).toBe(true)
  })

  it('falls back to raw text when the date is not parseable', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJobList().slice(0, 1).map((j) => ({ ...j, publishedAt: '3 days ago' })),
    )
    renderWithQueryClient(<JobListView />)
    expect(await screen.findByText('3 days ago')).toBeInTheDocument()
  })

  it('renders a dash when the publish date is empty', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJobList().slice(0, 1).map((j) => ({ ...j, publishedAt: '' })),
    )
    renderWithQueryClient(<JobListView />)
    expect(await screen.findByText('—')).toBeInTheDocument()
  })

  it('filters the list by search query', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    const input = await screen.findByPlaceholderText(/search by title or company/i)
    await user.type(input, 'AI')

    await waitFor(() => {
      expect(screen.getByText('AI Engineer (LLMs, RAG)')).toBeInTheDocument()
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
      expect(screen.queryByText('Full Stack Software Engineer')).not.toBeInTheDocument()
    })
  })

  it('shows the empty state when no jobs match', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    const input = await screen.findByPlaceholderText(/search by title or company/i)
    await user.type(input, 'NoSuchJob')

    await waitFor(() => {
      expect(screen.getByText('No jobs yet')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no jobs at all', async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
    renderWithQueryClient(<JobListView />)

    expect(await screen.findByText('No jobs yet')).toBeInTheDocument()
  })

  it('opens the actions menu and lists the options', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    await screen.findByText('AI Engineer (LLMs, RAG)')
    const firstTrigger = screen.getAllByRole('button', { name: /open menu/i })[0]
    await user.click(firstTrigger)

    expect(await screen.findByText('View source')).toBeInTheDocument()
    expect(screen.getByText('Change status')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('opens the change-status submenu with all five statuses', async () => {
    const user = userEvent.setup()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    await screen.findByText('AI Engineer (LLMs, RAG)')
    const firstTrigger = screen.getAllByRole('button', { name: /open menu/i })[0]
    await user.click(firstTrigger)
    await user.click(await screen.findByText('Change status'))

    const menus = await screen.findAllByRole('menu')
    const submenu = menus[menus.length - 1]
    expect(within(submenu).getByText('Saved')).toBeInTheDocument()
    expect(within(submenu).getByText('Applied')).toBeInTheDocument()
    expect(within(submenu).getByText('Interviewing')).toBeInTheDocument()
    expect(within(submenu).getByText('Rejected')).toBeInTheDocument()
    expect(within(submenu).getByText('Offer')).toBeInTheDocument()
  })

  it('calls the delete mutation when Delete is confirmed in dialog', async () => {
    const user = userEvent.setup()
    ;(apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(makeJobList())
    renderWithQueryClient(<JobListView />)

    await screen.findByText('Backend Developer')
    const firstTrigger = screen.getAllByRole('button', { name: /open menu/i })[0]
    await user.click(firstTrigger)
    await user.click(await screen.findByText('Delete'))
    await user.click(screen.getByTestId('confirm-delete'))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/jobs/j-5')
    })
  })
})
