import { useQuery } from '@tanstack/react-query'
import { fetchOverviewStats, type OverviewStats } from '../api/stats'

/**
 * TanStack Query wrapper around the overview stats endpoint.
 *
 * staleTime: 30s matches the BE's in-memory cache TTL, so repeated
 * navigations between pages stay snappy and we don't hammer the DB
 * with redundant fetches. The BE invalidates its own cache on every
 * write, so when a job is created/updated/deleted, the next refetch
 * (forced via the Overview page becoming active or a manual
 * invalidate) will see the new state.
 */
export function useOverviewStats() {
  return useQuery<OverviewStats>({
    queryKey: ['overview', 'stats'],
    queryFn: fetchOverviewStats,
    staleTime: 30_000,
  })
}
