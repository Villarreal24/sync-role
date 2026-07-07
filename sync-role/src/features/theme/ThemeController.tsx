import { useTheme } from './use-theme'

/**
 * Renders nothing. Exists solely to mount the useTheme() effect at the
 * top of the React tree: any component reading `theme` from the store
 * (e.g. the ProfileMenu checkmark) updates immediately, but the
 * DOM side-effect (toggling the .dark class on <html>, listening to
 * prefers-color-scheme) only runs if this component is mounted.
 */
export function ThemeController() {
  useTheme()
  return null
}
