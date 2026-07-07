import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './theme.store'

describe('ThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolvedTheme: null })
  })

  it('defaults to system', () => {
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme updates the theme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('setResolvedTheme updates the resolved theme', () => {
    useThemeStore.getState().setResolvedTheme('dark')
    expect(useThemeStore.getState().resolvedTheme).toBe('dark')
  })
})
