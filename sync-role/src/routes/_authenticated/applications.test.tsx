import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { Applications, Route as ApplicationsRoute } from './applications'
import { useJobFiltersStore } from '@/features/jobs/store/job.store'

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

function renderApplications(initialEntry: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const applicationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/applications',
    component: Applications,
    validateSearch: ApplicationsRoute.options.validateSearch,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([applicationsRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Applications route smoke test', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
    vi.clearAllMocks()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
  })

  it('mounts without crashing on /applications', () => {
    expect(() => renderApplications('/applications')).not.toThrow()
  })
})
