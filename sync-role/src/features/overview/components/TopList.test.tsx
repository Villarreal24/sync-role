import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopList } from './TopList'

describe('TopList', () => {
  it('renders the title and one row per item', () => {
    render(
      <TopList
        title="Top Tecnologías"
        items={[
          { name: 'React', count: 8 },
          { name: 'TypeScript', count: 7 },
        ]}
      />,
    )
    expect(screen.getByText('Top Tecnologías')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows the empty message when there are no items', () => {
    render(<TopList title="Empty" items={[]} emptyMessage="No data yet." />)
    expect(screen.getByText('No data yet.')).toBeInTheDocument()
  })

  it('scales bars relative to the max count', () => {
    const { container } = render(
      <TopList
        title="Tech"
        items={[
          { name: 'A', count: 10 },
          { name: 'B', count: 5 },
        ]}
      />,
    )
    // The 100% bar uses width:100%, the 50% bar uses width:50%.
    const bars = container.querySelectorAll('div.h-full.rounded-full')
    expect(bars[0].getAttribute('style')).toContain('width: 100%')
    expect(bars[1].getAttribute('style')).toContain('width: 50%')
  })
})
