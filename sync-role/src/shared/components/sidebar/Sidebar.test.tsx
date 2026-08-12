import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { Sidebar } from './Sidebar'
import { useSidebarStore } from '@/shared/store/sidebar.store'
vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { email: 'jane.smith@example.com' },
  }),
}))

vi.mock('@/features/auth/api/profiles', () => ({
  useProfile: vi.fn(() => ({
    data: { id: 'u1', displayName: 'Jane Smith', avatarUrl: '', phone: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, createdAt: '', updatedAt: '' },
    isLoading: false,
    isError: false,
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

function renderSidebar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <Sidebar />
      </TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    useSidebarStore.setState({ collapsed: false })
  })

  it('renders expanded with the brand, nav items, and footer by default', () => {
    renderSidebar()
    expect(screen.getByText('Sync Role')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders collapsed with nav items and the brand logo in the header', () => {
    useSidebarStore.setState({ collapsed: true })
    renderSidebar()
    expect(screen.queryByText('Sync Role')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Sync Role' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
  })

  it('toggles collapsed state when the close button is clicked', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(useSidebarStore.getState().collapsed).toBe(true)
  })

  it('toggles back to expanded when the open button is clicked while collapsed', async () => {
    useSidebarStore.setState({ collapsed: true })
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Open sidebar' }))
    expect(useSidebarStore.getState().collapsed).toBe(false)
  })
})
