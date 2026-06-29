export function getEmploymentTypeColor(employmentType: string): string {
  const colors: Record<string, string> = {
    Remoto: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200',
    'Remote': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200',
    Híbrido: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
    'Hybrid': 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
    Presencial: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    'On-site': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    'Full-time': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    'Part-time': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
    Contract: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  }
  return colors[employmentType] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
}
