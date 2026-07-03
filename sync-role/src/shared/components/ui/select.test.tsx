import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select', () => {
  it('renders a trigger and allows selecting an option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Bravo</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
    await user.click(trigger)

    const bravo = await screen.findByRole('option', { name: 'Bravo' })
    await user.click(bravo)
    expect(onValueChange).toHaveBeenCalledWith('b')
  })
})
