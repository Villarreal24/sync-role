import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMounted } from '@/shared/hooks/use-mounted'
import { UserAvatar } from '@/shared/components/sidebar/UserAvatar'
import { useUpdateProfile } from '@/features/auth/hooks/use-update-profile'
import { cn } from '@/shared/lib/utils'

export function ProfileForm() {
  const mounted = useMounted()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()

  // Local form state mirrors the auth store but is editable. We seed
  // it from the store on mount, then let the user type freely. On
  // save we PATCH the BE and the store updates from the response.
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (user && mounted) {
      setDisplayName(user.displayName)
      setAvatarUrl(user.avatarUrl)
    }
  }, [user, mounted])

  if (!mounted || !user) {
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

  const isDirty =
    displayName !== user.displayName || avatarUrl !== user.avatarUrl
  const isPending = updateProfile.isPending
  const errorMessage = updateProfile.error?.message

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty || isPending) return
    updateProfile.mutate(
      { displayName: displayName.trim(), avatarUrl: avatarUrl.trim() },
      {
        onSuccess: () => {
          setSavedAt(Date.now())
        },
      },
    )
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <UserAvatar size="lg" />
          <div className="flex-1 space-y-1">
            <p className="text-base font-semibold">Profile picture</p>
            <p className="text-sm text-muted-foreground">
              Paste an image URL below. The avatar is shown in the sidebar and
              next to your name.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={120}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className={cn(
                  'h-10 w-10 rounded-full object-cover bg-muted',
                  // Hide the preview if the URL is broken
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
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to show your initials instead.
          </p>
        </div>

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
            Profile updated
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
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
