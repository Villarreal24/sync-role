import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, updateJobStatus, deleteJob } from '../api/job.service'
import type { JobPosting } from '../types'

const JOBS_KEY = ['jobs'] as const

export function useJobsQuery() {
  return useQuery<JobPosting[], Error>({
    queryKey: JOBS_KEY,
    queryFn: fetchJobs,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobPosting['status'] }) =>
      updateJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })
}
