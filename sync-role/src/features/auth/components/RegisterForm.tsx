import { useActionState } from 'react'
import { spacing, fontSize } from '#/shared/design-tokens'
import { SubmitButton } from '#/shared/components/SubmitButton'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useAuthCopy } from '@/features/auth/copy'
import { cn } from '@/shared/lib/utils'

type FormState = { error?: string } | null

interface RegisterFormProps {
  onRegister: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function RegisterForm({ onRegister, onToggleMode }: RegisterFormProps) {
  const copy = useAuthCopy()
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
      <h2 className={cn('text-foreground', fontSize.title)}>{copy.register.title}</h2>

      <div>
        <Label
          htmlFor="reg-email"
          className={cn('block text-muted-foreground', fontSize.label, spacing.fieldLabel)}
        >
          {copy.common.email}
        </Label>
        <Input
          id="reg-email"
          name="email"
          type="email"
          required
          placeholder={copy.register.emailPlaceholder}
        />
      </div>

      <div>
        <Label
          htmlFor="reg-password"
          className={cn('block text-muted-foreground', fontSize.label, spacing.fieldLabel)}
        >
          {copy.common.password}
        </Label>
        <Input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder={copy.register.passwordPlaceholder}
        />
      </div>

      <div>
        <Label
          htmlFor="reg-confirm"
          className={cn('block text-muted-foreground', fontSize.label, spacing.fieldLabel)}
        >
          {copy.register.confirmPassword}
        </Label>
        <Input
          id="reg-confirm"
          name="confirm"
          type="password"
          required
          placeholder={copy.register.confirmPlaceholder}
        />
      </div>

      {state?.error && (
        <p className={cn('text-destructive', fontSize.error)}>{state.error}</p>
      )}

      <SubmitButton pendingLabel={copy.register.pendingLabel}>{copy.register.title}</SubmitButton>

      <p className={cn('text-muted-foreground text-center', fontSize.muted)}>
        {copy.register.haveAccount}{' '}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onToggleMode}
          className="h-auto p-0"
        >
          {copy.register.signInCta}
        </Button>
      </p>
    </form>
  )
}
