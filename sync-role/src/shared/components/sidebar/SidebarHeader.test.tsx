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

  it('renders the brand logo by default when collapsed', () => {
    useSidebarStore.setState({ collapsed: true })
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'Open sidebar' })
    // Logo visible, chevron not rendered
    expect(trigger.querySelector('svg[aria-label="Sync Role"]')).toBeInTheDocument()
    expect(trigger.querySelector('svg.lucide-panel-left-open')).not.toBeInTheDocument()
  })

  it('swaps the brand logo for the open chevron on hover when collapsed', async () => {
    useSidebarStore.setState({ collapsed: true })
    const user = userEvent.setup()
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'Open sidebar' })

    // Before hover: logo
    expect(trigger.querySelector('svg[aria-label="Sync Role"]')).toBeInTheDocument()
    expect(trigger.querySelector('svg.lucide-panel-left-open')).not.toBeInTheDocument()

    // After hover: chevron, logo gone (whole node, not just SVG)
    await user.hover(trigger)
    expect(trigger.querySelector('svg[aria-label="Sync Role"]')).not.toBeInTheDocument()
    expect(trigger.querySelector('svg.lucide-panel-left-open')).toBeInTheDocument()

    // After un-hover: back to logo
    await user.unhover(trigger)
    expect(trigger.querySelector('svg[aria-label="Sync Role"]')).toBeInTheDocument()
    expect(trigger.querySelector('svg.lucide-panel-left-open')).not.toBeInTheDocument()
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
