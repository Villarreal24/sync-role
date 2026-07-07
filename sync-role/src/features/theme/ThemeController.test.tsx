import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { ThemeController } from './ThemeController'
import { useThemeStore } from './theme.store'

describe('ThemeController', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    useThemeStore.setState({ theme: 'system', resolvedTheme: null })
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('renders nothing', () => {
    const { container } = render(<ThemeController />)
    expect(container.firstChild).toBeNull()
  })

  it('applies the .dark class when theme is "dark"', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeController />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the .dark class when theme is "light"', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeController />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      useThemeStore.setState({ theme: 'light' })
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('follows the system preference when theme is "system"', () => {
    useThemeStore.setState({ theme: 'system' })
    render(<ThemeController />)
    // In test setup, prefers-color-scheme is 'light' (default)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
