import { createFileRoute } from '@tanstack/react-router'
import { JobBoard } from '@/features/jobs/components/JobBoard'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ApplySync</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track and manage your job applications
        </p>
      </header>
      <JobBoard />
    </div>
  )
}
