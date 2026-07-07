import { useActionState } from 'react'
import { spacing, fontSize } from '#/shared/design-tokens'
import { SubmitButton } from '#/shared/components/SubmitButton'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useAuthCopy } from '@/features/auth/copy'
import { cn } from '@/shared/lib/utils'

type FormState = { error?: string } | null

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function LoginForm({ onLogin, onToggleMode }: LoginFormProps) {
  const copy = useAuthCopy()
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
      <h2 className={cn('text-foreground', fontSize.title)}>{copy.login.title}</h2>

      <div>
        <Label
          htmlFor="login-email"
          className={cn('block text-muted-foreground', fontSize.label, spacing.fieldLabel)}
        >
          {copy.common.email}
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          placeholder={copy.login.emailPlaceholder}
        />
      </div>

      <div>
        <Label
          htmlFor="login-password"
          className={cn('block text-muted-foreground', fontSize.label, spacing.fieldLabel)}
        >
          {copy.common.password}
        </Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          required
          placeholder={copy.login.passwordPlaceholder}
        />
      </div>

      {state?.error && (
        <p className={cn('text-destructive', fontSize.error)}>{state.error}</p>
      )}

      <SubmitButton pendingLabel={copy.login.pendingLabel}>{copy.login.title}</SubmitButton>

      <p className={cn('text-muted-foreground text-center', fontSize.muted)}>
        {copy.login.noAccount}{' '}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onToggleMode}
          className="h-auto p-0"
        >
          {copy.login.registerCta}
        </Button>
      </p>
    </form>
  )
}
