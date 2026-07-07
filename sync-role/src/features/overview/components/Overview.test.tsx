import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Overview } from './Overview'
import type { OverviewStats } from '../api/stats'

const zeroStats: OverviewStats = {
  totals: {
    saved: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    offer: 0,
    companies: 0,
    this_week_added: 0,
  },
  funnel: {
    saved_to_applied: 0,
    applied_to_interviewing: 0,
    interviewing_to_offer: 0,
  },
  top_technologies: [],
  top_work_modes: [],
  top_seniorities: [],
  activity: [
    { week_start: '2026-06-22', count: 0 },
    { week_start: '2026-06-29', count: 0 },
    { week_start: '2026-07-06', count: 0 },
  ],
  generated_at: '',
}

const fullStats: OverviewStats = {
  totals: {
    saved: 2,
    applied: 15,
    interviewing: 2,
    rejected: 0,
    offer: 0,
    companies: 19,
    this_week_added: 13,
  },
  funnel: {
    saved_to_applied: 89.5,
    applied_to_interviewing: 11.8,
    interviewing_to_offer: 0,
  },
  top_technologies: [
    { name: 'React', count: 8 },
    { name: 'TypeScript', count: 7 },
    { name: 'Python', count: 6 },
  ],
  top_work_modes: [{ name: 'Remote', count: 14 }],
  top_seniorities: [{ name: 'Senior', count: 7 }],
  activity: [
    { week_start: '2026-06-08', count: 0 },
    { week_start: '2026-06-15', count: 0 },
    { week_start: '2026-06-22', count: 0 },
    { week_start: '2026-06-29', count: 17 },
    { week_start: '2026-07-06', count: 2 },
  ],
  generated_at: '2026-07-07T03:35:52Z',
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/core/api/client'

describe('Overview', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('renders the skeleton while the data is loading', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(<Overview />, { wrapper: makeWrapper() })
    // Skeletons render as <Skeleton/> divs with animate-pulse
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0)
  })

  it('renders the error state with a retry button when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('boom'))
    render(<Overview />, { wrapper: makeWrapper() })
    expect(await screen.findByText(/couldn't load your stats/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders KPIs and top lists from the payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(fullStats)
    render(<Overview />, { wrapper: makeWrapper() })
    expect(await screen.findByText('Total Guardadas')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument() // applied (unique value)
    expect(screen.getByText('+13 esta semana')).toBeInTheDocument()
    expect(screen.getByText('89.5% de conversión')).toBeInTheDocument()
    expect(screen.getByText('Top Tecnologías Solicitadas')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Actividad de Aplicaciones')).toBeInTheDocument()
  })

  it('renders zeros for a user with no jobs (no empty-state CTA)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(zeroStats)
    render(<Overview />, { wrapper: makeWrapper() })
    // All four KPIs are present, each with value 0
    expect(await screen.findByText('Total Guardadas')).toBeInTheDocument()
    // TopList renders the heading + an "empty" message when there
    // are no items, so the heading is still there.
    expect(screen.getByText('Top Tecnologías Solicitadas')).toBeInTheDocument()
    expect(screen.getAllByText('No data yet.').length).toBeGreaterThanOrEqual(1)
    // No subtext "+N esta semana" for any of the KPIs
    expect(screen.queryByText(/esta semana/)).not.toBeInTheDocument()
  })

  it('retry button refetches the data', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(fullStats)
    const user = (await import('@testing-library/user-event')).default
    const u = user.setup()
    render(<Overview />, { wrapper: makeWrapper() })
    expect(await screen.findByText(/couldn't load your stats/i)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByText('React')).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })
})
