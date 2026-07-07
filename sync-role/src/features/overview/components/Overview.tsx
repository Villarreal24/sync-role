import { Briefcase, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useOverviewStats } from '../hooks/useOverviewStats'
import { ActivityChart } from './ActivityChart'
import { KpiCard } from './KpiCard'
import { OverviewError } from './OverviewError'
import { OverviewSkeleton } from './OverviewSkeleton'
import { TopList } from './TopList'

/**
 * Orchestrator for the Overview page. Owns the query state and
 * picks the right sub-component for loading / error / data. The
 * per-element tone colors match the badge palette used elsewhere
 * (status-applied = blue, status-interviewing = amber,
 * status-rejected = red, etc.) so the dashboard feels consistent.
 */
export function Overview() {
  const { data, isPending, isError, error, refetch } = useOverviewStats()

  if (isPending) return <OverviewSkeleton />

  if (isError) {
    return (
      <OverviewError
        error={error instanceof Error ? error : new Error('Unknown error')}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  const { totals, funnel, top_technologies, top_work_modes, top_seniorities, activity } = data

  return (
    <div className="space-y-6">
      <section
        aria-label="Key performance indicators"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Total Guardadas"
          value={totals.saved}
          icon={Briefcase}
          subtext={
            totals.this_week_added > 0
              ? `+${totals.this_week_added} esta semana`
              : undefined
          }
          subtextTone="info"
        />
        <KpiCard
          label="Aplicaciones"
          value={totals.applied}
          icon={CheckCircle2}
          subtext={`${funnel.saved_to_applied}% de conversión`}
          subtextTone="success"
        />
        <KpiCard
          label="Entrevistas Activas"
          value={totals.interviewing}
          icon={Clock}
          subtext={`${funnel.applied_to_interviewing}% de éxito`}
          subtextTone="warning"
        />
        <KpiCard
          label="Rechazos"
          value={totals.rejected}
          icon={XCircle}
          subtext={totals.rejected === 0 ? 'No te rindas 💪' : undefined}
          subtextTone="muted"
        />
      </section>

      <section
        aria-label="Distributions and activity"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <TopList
          title="Top Tecnologías Solicitadas"
          items={top_technologies}
          barClassName="bg-sky-500"
        />
        <ActivityChart title="Actividad de Aplicaciones" data={activity} />
      </section>

      {top_work_modes.length > 0 || top_seniorities.length > 0 ? (
        <section
          aria-label="Work mode and seniority breakdown"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <TopList
            title="Modalidad"
            items={top_work_modes}
            barClassName="bg-emerald-500"
          />
          <TopList
            title="Seniority"
            items={top_seniorities}
            barClassName="bg-amber-500"
          />
        </section>
      ) : null}
    </div>
  )
}
