import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncRoleLogo } from './SyncRoleLogo'

describe('SyncRoleLogo', () => {
  it('renders the logo with the default size', () => {
    render(<SyncRoleLogo />)
    const logo = screen.getByRole('img', { name: 'Sync Role' })
    expect(logo).toBeInTheDocument()
    expect(logo.classList.contains('h-6')).toBe(true)
    expect(logo.classList.contains('w-6')).toBe(true)
  })

  it('renders the medium size when specified', () => {
    render(<SyncRoleLogo size="md" />)
    const logo = screen.getByRole('img', { name: 'Sync Role' })
    expect(logo.classList.contains('h-8')).toBe(true)
    expect(logo.classList.contains('w-8')).toBe(true)
  })

  it('renders the hexagon shape and the central node', () => {
    const { container } = render(<SyncRoleLogo />)
    expect(container.querySelector('path[d^="M12 2 L20 7"]')).toBeInTheDocument()
    expect(container.querySelector('circle[cx="12"][cy="12"][r="2"]')).toBeInTheDocument()
  })

  it('renders a background container when withBackground is true', () => {
    const { container } = render(<SyncRoleLogo withBackground />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('bg-primary')
    expect(wrapper).toHaveClass('rounded-xl')
  })

  it('uses a custom aria label when provided', () => {
    render(<SyncRoleLogo ariaLabel="Custom Label" />)
    expect(screen.getByRole('img', { name: 'Custom Label' })).toBeInTheDocument()
  })

  it('forwards className to the svg', () => {
    render(<SyncRoleLogo className="text-blue-500" />)
    const logo = screen.getByRole('img', { name: 'Sync Role' })
    expect(logo).toHaveClass('text-blue-500')
  })
})
