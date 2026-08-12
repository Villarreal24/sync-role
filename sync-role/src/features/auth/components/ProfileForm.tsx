import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { UserAvatar } from '@/shared/components/sidebar/UserAvatar'
import { useProfileForm } from '@/features/auth/hooks/use-profile-form'
import { cn } from '@/shared/lib/utils'

export function ProfileForm() {
  const {
    mounted,
    form,
    savedAt,
    copy,
    extraFields,
    updateField,
    isDirty,
    isPending,
    errorMessage,
    handleSubmit,
  } = useProfileForm()

  if (!mounted) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <UserAvatar size="lg" />
          <div className="flex-1 space-y-1">
            <p className="text-base font-semibold">{copy.profile.sectionTitle}</p>
            <p className="text-sm text-muted-foreground">
              {copy.profile.sectionDescription}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">{copy.profile.displayNameLabel}</Label>
          <Input
            id="displayName"
            type="text"
            value={form.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            placeholder={copy.profile.displayNamePlaceholder}
            maxLength={120}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">{copy.profile.avatarUrlLabel}</Label>
          <div className="flex items-center gap-3">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={copy.profile.avatarAlt}
                className={cn(
                  'h-10 w-10 rounded-full object-cover bg-muted',
                  'border border-border',
                )}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full border border-dashed border-border bg-muted" />
            )}
            <Input
              id="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={(e) => updateField('avatarUrl', e.target.value)}
              placeholder={copy.profile.avatarUrlPlaceholder}
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">{copy.profile.avatarUrlHint}</p>
        </div>

        {extraFields.map((field) => {
          const raw = form[field.key]
          const displayValue = field.format ? field.format(raw) : raw

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = field.sanitize ? field.sanitize(e.target.value) : e.target.value
            updateField(field.key, value)
          }

          return (
            <div className="space-y-2" key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                value={displayValue}
                onChange={handleChange}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
              />
            </div>
          )
        })}

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {savedAt && !errorMessage && !isDirty ? (
          <p
            className="flex items-center gap-2 text-sm text-emerald-500"
            data-testid="profile-saved"
          >
            <CheckCircle2 className="h-4 w-4" />
            {copy.profile.saved}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            disabled={!isDirty || isPending}
            className="min-w-32"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.profile.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {copy.profile.save}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
