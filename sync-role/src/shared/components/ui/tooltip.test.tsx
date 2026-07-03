import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'

describe('Tooltip', () => {
  it('shows the tooltip content on hover', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    await user.hover(screen.getByText('Hover me'))
    const tooltips = await screen.findAllByRole('tooltip')
    expect(tooltips.some((el) => el.textContent === 'Tooltip text')).toBe(true)
  })
})
