import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/components/AuthPage'

export const Route = createFileRoute('/auth')({ component: AuthPage })
