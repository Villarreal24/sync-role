import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSwitcher } from './ViewSwitcher'

describe('ViewSwitcher', () => {
  it('renders Board and List options', () => {
    render(<ViewSwitcher value="board" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: /board view/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /list view/i })).toBeInTheDocument()
  })

  it('marks the active value as pressed', () => {
    render(<ViewSwitcher value="list" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: /list view/i })).toHaveAttribute('data-state', 'on')
    expect(screen.getByRole('radio', { name: /board view/i })).toHaveAttribute('data-state', 'off')
  })

  it('calls onChange with "list" when List is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewSwitcher value="board" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: /list view/i }))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('calls onChange with "board" when Board is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewSwitcher value="list" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: /board view/i }))
    expect(onChange).toHaveBeenCalledWith('board')
  })
})
