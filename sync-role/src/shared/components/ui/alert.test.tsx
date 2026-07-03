import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from './alert'

describe('Alert', () => {
  it('renders with role="alert"', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something happened.</AlertDescription>
      </Alert>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Heads up')).toBeInTheDocument()
    expect(screen.getByText('Something happened.')).toBeInTheDocument()
  })

  it('destructive variant applies destructive class', () => {
    render(<Alert variant="destructive" data-testid="a">x</Alert>)
    const el = screen.getByTestId('a')
    expect(el.className).toContain('destructive')
  })
})
