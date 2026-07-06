import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label', () => {
  it('renders text and is associated via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    )
    const label = screen.getByText('Email')
    expect(label).toBeInTheDocument()
    expect(label.tagName).toBe('LABEL')
  })
})
