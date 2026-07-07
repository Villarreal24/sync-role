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
import { ProfileRoute } from './profile'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/core/api/client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '@/core/api/client'

function renderProfile() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: ProfileRoute,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([profileRoute]),
    history: createMemoryHistory({ initialEntries: ['/profile'] }),
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

describe('Profile route smoke test', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'luis@gmail.com',
        displayName: 'Luis Villarreal',
        avatarUrl: '',
      },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
      profileHydrated: true,
    })
    vi.mocked(apiClient.patch).mockReset()
  })

  it('mounts without crashing on /profile', () => {
    expect(() => renderProfile()).not.toThrow()
  })
})
