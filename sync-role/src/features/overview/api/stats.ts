import { apiClient } from '@/core/api/client'

export interface OverviewTopItem {
  name: string
  count: number
}

export interface OverviewTotals {
  saved: number
  applied: number
  interviewing: number
  rejected: number
  offer: number
  companies: number
  this_week_added: number
}

export interface OverviewFunnel {
  saved_to_applied: number
  applied_to_interviewing: number
  interviewing_to_offer: number
}

export interface OverviewActivityWeek {
  week_start: string
  count: number
}

export interface OverviewStats {
  totals: OverviewTotals
  funnel: OverviewFunnel
  top_technologies: OverviewTopItem[]
  top_work_modes: OverviewTopItem[]
  top_seniorities: OverviewTopItem[]
  activity: OverviewActivityWeek[]
  generated_at: string
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  return apiClient.get<OverviewStats>('/stats/overview')
}
