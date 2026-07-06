import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Separator } from './separator'

describe('Separator', () => {
  it('renders as a separator role', () => {
    render(<Separator data-testid="sep" />)
    expect(screen.getByTestId('sep')).toBeInTheDocument()
  })
})
