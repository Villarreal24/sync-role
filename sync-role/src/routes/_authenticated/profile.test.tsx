import { describe, it, expect, vi, beforeEach } from 'vitest'
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
import { ProfileRoute } from '@/features/auth/components/ProfileRoute'

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'luis@gmail.com' },
    loading: false,
  }),
}))

vi.mock('@/features/auth/api/profiles', () => ({
  useProfile: vi.fn(),
  useAuth: undefined,
}))

import { useProfile } from '@/features/auth/api/profiles'

vi.mock('@/core/api/client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
  AuthError: class AuthError extends Error { constructor() { super('auth') } },
  ApiError: class ApiError extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s } },
}))

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
    vi.mocked(useProfile).mockReturnValue({
      data: { id: 'u-1', displayName: 'Luis Villarreal', avatarUrl: '', phone: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '', updatedAt: '' },
      isLoading: false,
      isError: false,
    } as any)
  })

  it('mounts without crashing on /profile', () => {
    expect(() => renderProfile()).not.toThrow()
  })
})
