import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { AppShell } from './AppShell'
vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
  }),
}))

vi.mock('@/features/auth/api/profiles', () => ({
  useProfile: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  const React = await import('react')
  return {
    ...actual,
    Link: React.forwardRef<HTMLAnchorElement, { to: string; children: React.ReactNode; className?: string | ((opts: { isActive: boolean }) => string); activeOptions?: unknown; 'aria-label'?: string }>(
      function MockLink({ to, children, className, ...rest }, ref) {
        const isActive = false
        const resolved = typeof className === 'function' ? className({ isActive }) : className
        return (
          <a ref={ref} href={to} className={resolved} aria-label={rest['aria-label']}>
            {children}
          </a>
        )
      },
    ),
    useMatchRoute: () => () => false,
  }
})

describe('AppShell', () => {
  it('renders its children inside a main element', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AppShell>
            <p>Hello</p>
          </AppShell>
        </TooltipProvider>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
