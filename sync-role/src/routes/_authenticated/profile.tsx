import { createFileRoute } from '@tanstack/react-router'
import { ProfileRoute } from '@/features/auth/components/ProfileRoute'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfileRoute,
})
