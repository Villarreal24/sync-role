import type { Locale } from '@/shared/copy/locale'
import { useLocale } from '@/shared/copy/locale'
import { COMMON_COPY_EN, COMMON_COPY_ES, type CommonCopy } from '@/shared/copy/common'

export interface OverviewCopy {
  page: {
    title: string
    subtitle: string
  }
  kpis: {
    saved: string
    applied: string
    interviewing: string
    rejected: string
  }
  kpiSubtext: {
    addedThisWeek: (n: number) => string
    savedConversion: (pct: number) => string
    interviewSuccess: (pct: number) => string
    rejectedEncouragement: string
  }
  topLists: {
    technologies: string
    activity: string
    workMode: string
    seniority: string
  }
  activity: {
    tooltipEventLabel: string
  }
  empty: { noData: string }
  error: {
    title: string
    fallback: string
    retry: string
  }
}

function makeOverviewCopy(common: CommonCopy): OverviewCopy {
  return {
    page: {
      title: 'Overview',
      subtitle: 'A summary of your job applications and activity.',
    },
    kpis: {
      saved: 'Total Saved',
      applied: 'Applications',
      interviewing: 'Active Interviews',
      rejected: 'Rejections',
    },
    kpiSubtext: {
      addedThisWeek: (n) => `+${n} this week`,
      savedConversion: (pct) => `${pct}% conversion`,
      interviewSuccess: (pct) => `${pct}% success`,
      rejectedEncouragement: "Don't give up 💪",
    },
    topLists: {
      technologies: 'Top Requested Technologies',
      activity: 'Applications Activity',
      workMode: 'Work Mode',
      seniority: 'Seniority',
    },
    activity: {
      tooltipEventLabel: 'Events',
    },
    empty: { noData: common.empty.noData },
    error: {
      title: "Couldn't load your stats",
      fallback: common.error.default,
      retry: common.retry,
    },
  }
}

function makeOverviewCopyEs(common: CommonCopy): OverviewCopy {
  return {
    page: {
      title: 'Resumen',
      subtitle: 'Un resumen de tus postulaciones y actividad.',
    },
    kpis: {
      saved: 'Total guardadas',
      applied: 'Postulaciones',
      interviewing: 'Entrevistas activas',
      rejected: 'Rechazos',
    },
    kpiSubtext: {
      addedThisWeek: (n) => `+${n} esta semana`,
      savedConversion: (pct) => `${pct}% de conversión`,
      interviewSuccess: (pct) => `${pct}% de éxito`,
      rejectedEncouragement: 'No te rindas 💪',
    },
    topLists: {
      technologies: 'Tecnologías más solicitadas',
      activity: 'Actividad de postulaciones',
      workMode: 'Modalidad',
      seniority: 'Senioridad',
    },
    activity: {
      tooltipEventLabel: 'Eventos',
    },
    empty: { noData: common.empty.noData },
    error: {
      title: 'No se pudieron cargar tus estadísticas',
      fallback: common.error.default,
      retry: common.retry,
    },
  }
}

const TABLE: Record<Locale, OverviewCopy> = {
  en: makeOverviewCopy(COMMON_COPY_EN),
  es: makeOverviewCopyEs(COMMON_COPY_ES),
}

export function useOverviewCopy(): OverviewCopy {
  const { locale } = useLocale()
  return TABLE[locale]
}
