export function ThemeScript() {
  return (
    <>
      {/* Blocking script: applies the .dark class before first paint
          to prevent the white flash in dark mode. Must NOT be deferred.
          The splash itself is managed by the <Splash/> React component
          so it stays in sync with the React tree (no hydration mismatch). */}
      <script src="/theme-class.js" />
    </>
  )
}
