import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { SidebarHeader } from './SidebarHeader'
import { useSidebarStore } from '@/shared/store/sidebar.store'

function renderHeader() {
  return render(
    <TooltipProvider>
      <SidebarHeader />
    </TooltipProvider>,
  )
}

describe('SidebarHeader', () => {
  beforeEach(() => {
    useSidebarStore.setState({ collapsed: false })
  })

  it('renders the brand and the close button when expanded', () => {
    renderHeader()
    expect(screen.getByText('Sync Role')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close sidebar' })).toBeInTheDocument()
  })

  it('renders the brand logo and a hover-swap open button when collapsed', () => {
    useSidebarStore.setState({ collapsed: true })
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'Open sidebar' })
    expect(trigger).toBeInTheDocument()
    // The brand logo and the open icon both live inside the trigger
    expect(trigger.querySelector('svg[aria-label="Sync Role"]')).toBeInTheDocument()
    expect(trigger.querySelector('svg.lucide-panel-left-open')).toBeInTheDocument()
  })

  it('shows the logo by default and the chevron on hover when collapsed', () => {
    useSidebarStore.setState({ collapsed: true })
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'Open sidebar' })
    // SVG elements expose className as an SVGAnimatedString; use
    // getAttribute('class') to get a plain string for assertions.
    const logo = trigger.querySelector('svg[aria-label="Sync Role"]')!
    const chevron = trigger.querySelector('svg.lucide-panel-left-open')!

    // Default: logo visible, chevron hidden via Tailwind group-hover swap
    expect(logo.getAttribute('class')).toContain('group-hover:hidden')
    expect(chevron.getAttribute('class')).toContain('hidden')
    expect(chevron.getAttribute('class')).toContain('group-hover:block')
  })

  it('toggles collapsed state when the close button is clicked (expanded)', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(useSidebarStore.getState().collapsed).toBe(true)
  })

  it('toggles back to expanded when the open button is clicked while collapsed', async () => {
    useSidebarStore.setState({ collapsed: true })
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'Open sidebar' }))
    expect(useSidebarStore.getState().collapsed).toBe(false)
  })
})
