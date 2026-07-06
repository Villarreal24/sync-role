import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { Home, Route as HomeRoute } from './index'
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

function renderHome(initialEntry: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
    validateSearch: HomeRoute.options.validateSearch,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...utils, router }
}

describe('Home route', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({ searchQuery: '', statusFilter: 'all' })
    vi.clearAllMocks()
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([])
  })

  it('renders the board view by default (no ?view= param)', async () => {
    renderHome('/')
    expect(await screen.findByRole('heading', { name: 'ApplySync' })).toBeInTheDocument()
    expect(
      await screen.findByPlaceholderText(/search by title or company/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /board view/i })).toHaveAttribute(
      'data-state',
      'on',
    )
  })

  it('renders the list view when ?view=list', async () => {
    renderHome('/?view=list')
    expect(await screen.findByRole('heading', { name: 'ApplySync' })).toBeInTheDocument()
    expect(await screen.findByText('Vacancy / Company')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /list view/i })).toHaveAttribute(
      'data-state',
      'on',
    )
  })

  it('falls back to the board view when ?view= is set to an unknown value', async () => {
    renderHome('/?view=analytics')
    expect(await screen.findByRole('heading', { name: 'ApplySync' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /board view/i })).toHaveAttribute(
      'data-state',
      'on',
    )
  })

  it('switches the URL search param when the user clicks the List toggle', async () => {
    const user = userEvent.setup()
    const { router } = renderHome('/')

    await user.click(await screen.findByRole('radio', { name: /list view/i }))

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ view: 'list' })
    })
    expect(screen.getByRole('radio', { name: /list view/i })).toHaveAttribute(
      'data-state',
      'on',
    )
  })

  it('switches back to the board view when the Board toggle is clicked from /?view=list', async () => {
    const user = userEvent.setup()
    const { router } = renderHome('/?view=list')

    await user.click(await screen.findByRole('radio', { name: /board view/i }))

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ view: 'board' })
    })
  })
})
