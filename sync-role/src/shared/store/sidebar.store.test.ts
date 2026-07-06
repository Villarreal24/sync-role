import { describe, it, expect, beforeEach } from 'vitest'
import { useSidebarStore } from './sidebar.store'

describe('SidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ collapsed: false })
  })

  it('defaults to expanded (collapsed=false)', () => {
    expect(useSidebarStore.getState().collapsed).toBe(false)
  })

  it('toggle flips the collapsed state', () => {
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().collapsed).toBe(true)
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().collapsed).toBe(false)
  })

  it('set assigns a specific value', () => {
    useSidebarStore.getState().set(true)
    expect(useSidebarStore.getState().collapsed).toBe(true)
    useSidebarStore.getState().set(false)
    expect(useSidebarStore.getState().collapsed).toBe(false)
  })
})
