import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useAuthCopy } from '@/features/auth/copy'
import { useMounted } from '@/shared/hooks/use-mounted'
import { useUpdateProfile } from '@/features/auth/hooks/use-update-profile'
import { formatPhoneDisplay } from '@/shared/lib/format'
import type { ProfileUpdate } from '@/features/auth/api/profiles'
import type { ExtraFieldConfig, ProfileFormState } from '@/features/auth/components/profile-form.types'

export function useProfileForm() {
  const mounted = useMounted()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()
  const copy = useAuthCopy()

  const [form, setForm] = useState<ProfileFormState>({
    displayName: '',
    avatarUrl: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  })
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (user && mounted) {
      setForm({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        phone: user.phone ?? '',
        linkedinUrl: user.linkedinUrl ?? '',
        githubUrl: user.githubUrl ?? '',
        portfolioUrl: user.portfolioUrl ?? '',
      })
    }
  }, [user, mounted])

  const updateField = useCallback(
    <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const extraFields: ExtraFieldConfig[] = useMemo(
    () => [
      {
        key: 'phone',
        label: copy.profile.phoneLabel,
        placeholder: copy.profile.phonePlaceholder,
        type: 'tel',
        autoComplete: 'tel',
        format: formatPhoneDisplay,
        sanitize: (v: string) => v.replace(/[^\d+]/g, ''),
      },
      {
        key: 'linkedinUrl',
        label: copy.profile.linkedinUrlLabel,
        placeholder: copy.profile.linkedinUrlPlaceholder,
        type: 'url',
        autoComplete: 'off',
      },
      {
        key: 'githubUrl',
        label: copy.profile.githubUrlLabel,
        placeholder: copy.profile.githubUrlPlaceholder,
        type: 'url',
        autoComplete: 'off',
      },
      {
        key: 'portfolioUrl',
        label: copy.profile.portfolioUrlLabel,
        placeholder: copy.profile.portfolioUrlPlaceholder,
        type: 'url',
        autoComplete: 'off',
      },
    ],
    [copy],
  )

  const isDirty =
    form.displayName !== user?.displayName ||
    form.avatarUrl !== user?.avatarUrl ||
    form.phone !== (user?.phone ?? '') ||
    form.linkedinUrl !== (user?.linkedinUrl ?? '') ||
    form.githubUrl !== (user?.githubUrl ?? '') ||
    form.portfolioUrl !== (user?.portfolioUrl ?? '')
  const isPending = updateProfile.isPending
  const errorMessage = updateProfile.error?.message

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty || isPending) return
    const payload: ProfileUpdate = {
      displayName: form.displayName.trim(),
      avatarUrl: form.avatarUrl.trim(),
      phone: form.phone.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
      githubUrl: form.githubUrl.trim() || null,
      portfolioUrl: form.portfolioUrl.trim() || null,
    }
    updateProfile.mutate(payload, {
      onSuccess: () => setSavedAt(Date.now()),
    })
  }

  return {
    mounted,
    user,
    form,
    savedAt,
    copy,
    extraFields,
    updateField,
    isDirty,
    isPending,
    errorMessage,
    handleSubmit,
  }
}
