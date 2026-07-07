import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useOverviewStats } from './useOverviewStats'
import type { OverviewStats } from '../api/stats'

const sampleStats: OverviewStats = {
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
  top_technologies: [{ name: 'React', count: 8 }],
  top_work_modes: [{ name: 'Remote', count: 14 }],
  top_seniorities: [{ name: 'Senior', count: 7 }],
  activity: [
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

describe('useOverviewStats', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('returns the payload from /stats/overview', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(sampleStats)
    const { result } = renderHook(() => useOverviewStats(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toEqual(sampleStats)
    expect(apiClient.get).toHaveBeenCalledWith('/stats/overview')
  })

  it('exposes the error when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useOverviewStats(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('boom')
  })
})
