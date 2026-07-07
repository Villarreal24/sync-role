import { Briefcase, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useOverviewStats } from '../hooks/useOverviewStats'
import { useOverviewCopy } from '../copy'
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
  const copy = useOverviewCopy()
  const { data, isPending, isError, error, refetch } = useOverviewStats()

  if (isPending) return <OverviewSkeleton />

  if (isError) {
    return (
      <OverviewError
        error={error instanceof Error ? error : new Error(copy.error.fallback)}
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
        aria-label={copy.page.title}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label={copy.kpis.saved}
          value={totals.saved}
          icon={Briefcase}
          subtext={
            totals.this_week_added > 0
              ? copy.kpiSubtext.addedThisWeek(totals.this_week_added)
              : undefined
          }
          subtextTone="info"
        />
        <KpiCard
          label={copy.kpis.applied}
          value={totals.applied}
          icon={CheckCircle2}
          subtext={copy.kpiSubtext.savedConversion(funnel.saved_to_applied)}
          subtextTone="success"
        />
        <KpiCard
          label={copy.kpis.interviewing}
          value={totals.interviewing}
          icon={Clock}
          subtext={copy.kpiSubtext.interviewSuccess(funnel.applied_to_interviewing)}
          subtextTone="warning"
        />
        <KpiCard
          label={copy.kpis.rejected}
          value={totals.rejected}
          icon={XCircle}
          subtext={totals.rejected === 0 ? copy.kpiSubtext.rejectedEncouragement : undefined}
          subtextTone="muted"
        />
      </section>

      <section
        aria-label={copy.topLists.technologies}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <TopList
          title={copy.topLists.technologies}
          items={top_technologies}
          barClassName="bg-sky-500"
        />
        <ActivityChart title={copy.topLists.activity} data={activity} />
      </section>

      {top_work_modes.length > 0 || top_seniorities.length > 0 ? (
        <section
          aria-label={`${copy.topLists.workMode} & ${copy.topLists.seniority}`}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <TopList
            title={copy.topLists.workMode}
            items={top_work_modes}
            barClassName="bg-emerald-500"
          />
          <TopList
            title={copy.topLists.seniority}
            items={top_seniorities}
            barClassName="bg-amber-500"
          />
        </section>
      ) : null}
    </div>
  )
}
