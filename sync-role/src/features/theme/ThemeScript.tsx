export function ThemeScript() {
  return (
    <>
      {/* Blocking script: applies the .dark class before first paint
          to prevent the white flash in dark mode. Must NOT be deferred. */}
      <script src="/theme-class.js" />
      {/* Deferred script: removes the splash once the body is parsed
          and React is about to take over. */}
      <script src="/theme-splash.js" defer />
    </>
  )
}
