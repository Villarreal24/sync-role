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

  it('renders only the open button when collapsed', () => {
    useSidebarStore.setState({ collapsed: true })
    renderHeader()
    const brand = screen.queryByText('Sync Role')
    expect(brand).toBeInTheDocument()
    expect(brand?.closest('div')).toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeInTheDocument()
  })

  it('toggles collapsed state when close button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(useSidebarStore.getState().collapsed).toBe(true)
  })
})
