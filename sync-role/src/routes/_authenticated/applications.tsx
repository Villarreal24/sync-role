import { createFileRoute } from '@tanstack/react-router'
import { Applications } from '@/features/jobs/components/Applications'
import type { JobView } from '@/features/jobs/components/ViewSwitcher'

type ApplicationsSearch = { view?: JobView }

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: (search: Record<string, unknown>): ApplicationsSearch => {
    const view = search.view
    return { view: view === 'list' ? 'list' : 'board' }
  },
  component: Applications,
})
