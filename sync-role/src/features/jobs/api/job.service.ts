import { apiClient } from '@/core/api/client'
import type { JobPosting } from '../types'

export const fetchJobs = async (): Promise<JobPosting[]> => {
  return apiClient.get<JobPosting[]>('/jobs')
}

export const createJob = async (
  job: Omit<JobPosting, 'id' | 'createdAt'>,
): Promise<JobPosting> => {
  return apiClient.post<JobPosting>('/jobs', job)
}

export const updateJobStatus = async (
  id: string,
  status: JobPosting['status'],
): Promise<JobPosting> => {
  return apiClient.patch<JobPosting>(`/jobs/${id}`, { status })
}

export const deleteJob = async (id: string): Promise<void> => {
  return apiClient.delete(`/jobs/${id}`)
}
