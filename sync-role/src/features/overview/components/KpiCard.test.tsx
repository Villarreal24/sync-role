import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Briefcase, CheckCircle2 } from 'lucide-react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('renders label, value and icon', () => {
    render(
      <KpiCard
        label="Total Guardadas"
        value={42}
        icon={Briefcase}
        subtext="+5 esta semana"
        subtextTone="info"
      />,
    )
    expect(screen.getByText('Total Guardadas')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('+5 esta semana')).toBeInTheDocument()
    // Icon is aria-hidden, query by class
    expect(document.querySelector('svg.lucide-briefcase')).toBeInTheDocument()
  })

  it('renders string values', () => {
    render(<KpiCard label="Companies" value="19+" icon={CheckCircle2} />)
    expect(screen.getByText('19+')).toBeInTheDocument()
  })

  it('omits the subtext when not provided', () => {
    render(<KpiCard label="X" value={1} icon={Briefcase} />)
    expect(screen.queryByText(/esta semana/)).not.toBeInTheDocument()
  })

  it('applies the success tone class to the subtext', () => {
    render(
      <KpiCard
        label="Aplicaciones"
        value={18}
        icon={Briefcase}
        subtext="42% de conversión"
        subtextTone="success"
      />,
    )
    const subtext = screen.getByText('42% de conversión')
    expect(subtext.className).toContain('text-emerald-500')
  })
})
