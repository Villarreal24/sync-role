import { create } from 'zustand'
import type { JobStatus } from '../types'

interface JobFiltersState {
  searchQuery: string
  statusFilter: JobStatus | 'all'
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: JobStatus | 'all') => void
}

export const useJobFiltersStore = create<JobFiltersState>((set) => ({
  searchQuery: '',
  statusFilter: 'all',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}))
