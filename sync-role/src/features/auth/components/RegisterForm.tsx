import { useActionState } from 'react'
import { spacing, fontSize } from '#/shared/design-tokens'
import { SubmitButton } from '#/shared/components/SubmitButton'

type FormState = { error?: string } | null

interface RegisterFormProps {
  onRegister: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function RegisterForm({ onRegister, onToggleMode }: RegisterFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get('email'))
      const password = String(formData.get('password'))
      const confirm = String(formData.get('confirm'))

      if (password !== confirm) {
        return { error: 'Passwords do not match' }
      }
      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
      }

      try {
        await onRegister(email, password)
        return null
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Registration failed' }
      }
    },
    null,
  )

  return (
    <form action={formAction} className={spacing.field}>
      <h2 className={`${fontSize.title} text-zinc-100`}>Create Account</h2>

      <div>
        <label
          htmlFor="reg-email"
          className={`block ${fontSize.label} text-zinc-400 ${spacing.fieldLabel}`}
        >
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          className={`w-full ${spacing.inputPad} bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="reg-password"
          className={`block ${fontSize.label} text-zinc-400 ${spacing.fieldLabel}`}
        >
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          className={`w-full ${spacing.inputPad} bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="reg-confirm"
          className={`block ${fontSize.label} text-zinc-400 ${spacing.fieldLabel}`}
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          required
          className={`w-full ${spacing.inputPad} bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Repeat your password"
        />
      </div>

      {state?.error && (
        <p className={`${fontSize.error} text-red-400`}>{state.error}</p>
      )}

      <SubmitButton pendingLabel="Creating account...">Create Account</SubmitButton>

      <p className={`${fontSize.muted} text-zinc-500 text-center`}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggleMode}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Sign In
        </button>
      </p>
    </form>
  )
}
