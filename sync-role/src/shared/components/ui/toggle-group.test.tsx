import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

describe('ToggleGroup', () => {
  it('renders items in a group', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" aria-label="A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    )
    expect(screen.getByRole('radio', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B' })).toBeInTheDocument()
  })

  it('calls onValueChange when an item is selected', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="x" aria-label="X">
          X
        </ToggleGroupItem>
        <ToggleGroupItem value="y" aria-label="Y">
          Y
        </ToggleGroupItem>
      </ToggleGroup>,
    )
    await user.click(screen.getByRole('radio', { name: 'Y' }))
    expect(onValueChange).toHaveBeenCalledWith('y')
  })
})
