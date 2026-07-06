import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobCard } from './JobCard'
import { useJobFiltersStore } from '../store/job.store'
import { makeJob } from '../__fixtures__/jobs'

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
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('JobCard', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
    vi.clearAllMocks()
  })

  it('renders the title, company and status label', () => {
    renderWithQueryClient(
      <JobCard
        job={makeJob({
          title: 'Staff Engineer',
          company: 'Bigco',
          status: 'applied',
          location: 'Guadalajara',
          salary: '$27,000',
        })}
      />,
    )
    const savedBadges = screen.getAllByText('Applied')
    expect(savedBadges.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument()
    expect(screen.getByText('Bigco')).toBeInTheDocument()
  })

  it('renders the work mode, employment type and seniority tags', () => {
    renderWithQueryClient(
      <JobCard
        job={makeJob({
          workMode: 'Hybrid',
          employmentType: 'Contract',
          seniority: 'Principal',
          location: 'Guadalajara',
        })}
      />,
    )
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('Contract')).toBeInTheDocument()
    expect(screen.getByText('Principal')).toBeInTheDocument()
  })

  it('renders the technologies', () => {
    renderWithQueryClient(<JobCard job={makeJob({ technologies: ['Python', 'PyTorch'] })} />)
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
  })

  it('toggles description visibility', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<JobCard job={makeJob({ description: 'A great description.' })} />)
    expect(screen.queryByText('A great description.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show description/i }))
    expect(screen.getByText('A great description.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /hide description/i }))
    expect(screen.queryByText('A great description.')).not.toBeInTheDocument()
  })

  it('does not render description toggle if no description', () => {
    renderWithQueryClient(<JobCard job={makeJob({ description: '' })} />)
    expect(screen.queryByRole('button', { name: /show description/i })).not.toBeInTheDocument()
  })

  it('calls the update mutation when status changes', async () => {
    const user = userEvent.setup()
    ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({})
    renderWithQueryClient(<JobCard job={makeJob({ id: 'job-1' })} />)

    const statusSelect = screen.getByRole('combobox')
    await user.click(statusSelect)
    const appliedOption = await screen.findByRole('option', { name: 'Applied' })
    await user.click(appliedOption)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/jobs/job-1', { status: 'applied' })
    })
  })

  it('calls the delete mutation when delete button is clicked', async () => {
    const user = userEvent.setup()
    ;(apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    renderWithQueryClient(<JobCard job={makeJob({ id: 'job-1' })} />)

    await user.click(screen.getByRole('button', { name: /delete job/i }))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/jobs/job-1')
    })
  })

  it('links the external button to the sourceUrl', () => {
    renderWithQueryClient(
      <JobCard job={makeJob({ sourceUrl: 'https://example.com/post' })} />,
    )
    const link = screen.getByRole('link', { name: /open source/i })
    expect(link).toHaveAttribute('href', 'https://example.com/post')
  })

  it('uses the compact h-5 size for the action buttons and the select trigger', () => {
    renderWithQueryClient(<JobCard job={makeJob()} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger.className).toContain('h-5')
    expect(trigger.className).not.toContain('h-10')
    const openSource = screen.getByRole('link', { name: /open source/i })
    expect(openSource.className).toContain('h-5')
    expect(openSource.className).not.toContain('h-10')
    const deleteBtn = screen.getByRole('button', { name: /delete job/i })
    expect(deleteBtn.className).toContain('h-5')
    expect(deleteBtn.className).not.toContain('h-10')
  })
})
