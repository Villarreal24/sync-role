import { useActionState } from 'react'
import { spacing, fontSize } from '#/shared/design-tokens'
import { SubmitButton } from '#/shared/components/SubmitButton'

type FormState = { error?: string } | null

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function LoginForm({ onLogin, onToggleMode }: LoginFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        await onLogin(
          String(formData.get('email')),
          String(formData.get('password')),
        )
        return null
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Login failed' }
      }
    },
    null,
  )

  return (
    <form action={formAction} className={spacing.field}>
      <h2 className={`${fontSize.title} text-zinc-100`}>Sign In</h2>

      <div>
        <label
          htmlFor="login-email"
          className={`block ${fontSize.label} text-zinc-400 ${spacing.fieldLabel}`}
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className={`w-full ${spacing.inputPad} bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className={`block ${fontSize.label} text-zinc-400 ${spacing.fieldLabel}`}
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          className={`w-full ${spacing.inputPad} bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Enter your password"
        />
      </div>

      {state?.error && (
        <p className={`${fontSize.error} text-red-400`}>{state.error}</p>
      )}

      <SubmitButton pendingLabel="Signing in...">Sign In</SubmitButton>

      <p className={`${fontSize.muted} text-zinc-500 text-center`}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Register
        </button>
      </p>
    </form>
  )
}
