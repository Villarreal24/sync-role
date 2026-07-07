import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/shared/components/ui/card'
import type { OverviewActivityWeek } from '../api/stats'

interface ActivityChartProps {
  title: string
  data: OverviewActivityWeek[]
}

interface ChartDatum {
  label: string  // short label for the X axis (e.g. "Jun 29")
  week_start: string
  count: number
}

/**
 * Format a YYYY-MM-DD string as a short "MMM DD" label. We parse
 * the parts manually to avoid loading a date library for a 4-line
 * helper.
 */
function shortLabel(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const idx = Number(m) - 1
  return `${months[idx] ?? '?'} ${Number(d)}`
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        Events: <span className="font-semibold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  )
}

export function ActivityChart({ title, data }: ActivityChartProps) {
  const chartData: ChartDatum[] = data.map((w) => ({
    label: shortLabel(w.week_start),
    week_start: w.week_start,
    count: w.count,
  }))

  return (
    <Card className="h-full p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as unknown as Array<{ value: number }> | undefined}
                  label={props.label as string | undefined}
                />
              )}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
