import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { AppShell } from './AppShell'

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
    render(
      <TooltipProvider>
        <AppShell>
          <p>Hello</p>
        </AppShell>
      </TooltipProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
