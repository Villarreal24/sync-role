import { describe, it, expect, beforeEach } from 'vitest'
import { useJobFiltersStore } from './job.store'

describe('useJobFiltersStore', () => {
  beforeEach(() => {
    useJobFiltersStore.setState({
      searchQuery: '',
      statusFilter: 'all',
    })
  })

  it('starts with empty search and "all" status filter', () => {
    const state = useJobFiltersStore.getState()
    expect(state.searchQuery).toBe('')
    expect(state.statusFilter).toBe('all')
  })

  it('setSearchQuery updates the search query', () => {
    useJobFiltersStore.getState().setSearchQuery('react')
    expect(useJobFiltersStore.getState().searchQuery).toBe('react')
  })

  it('setStatusFilter updates the status filter', () => {
    useJobFiltersStore.getState().setStatusFilter('applied')
    expect(useJobFiltersStore.getState().statusFilter).toBe('applied')
  })

  it('setStatusFilter accepts "all" as a valid value', () => {
    useJobFiltersStore.getState().setStatusFilter('offer')
    useJobFiltersStore.getState().setStatusFilter('all')
    expect(useJobFiltersStore.getState().statusFilter).toBe('all')
  })
})
