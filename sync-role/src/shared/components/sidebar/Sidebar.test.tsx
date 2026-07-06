import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { Sidebar } from './Sidebar'
import { useSidebarStore } from '@/shared/store/sidebar.store'
import { useAuthStore } from '@/features/auth/store/auth.store'

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
  return render(
    <TooltipProvider>
      <Sidebar />
    </TooltipProvider>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    useSidebarStore.setState({ collapsed: false })
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        avatarUrl: '',
      },
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    })
  })

  it('renders expanded with the brand, nav items, and footer by default', () => {
    renderSidebar()
    expect(screen.getByText('Sync Role')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders collapsed with nav items but no brand name', () => {
    useSidebarStore.setState({ collapsed: true })
    renderSidebar()
    const brand = screen.queryByText('Sync Role')
    expect(brand).toBeInTheDocument()
    expect(brand?.closest('div')).toHaveClass('hidden')
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
