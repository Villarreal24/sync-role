import { useEffect, useState } from 'react'
import { HeadContent, Scripts, createRootRoute, useRouter, useLocation } from '@tanstack/react-router'

import { QueryClientProvider } from '@tanstack/react-query'

import { getQueryClient } from '@/core/api/query-client'
import { fetchSession } from '@/core/api/client'
import { ThemeController } from '@/features/theme/ThemeController'
import { ThemeScript } from '@/features/theme/ThemeScript'
import { CopyProvider } from '@/shared/copy/locale'
import { Splash } from '@/shared/components/brand/Splash'
import { TooltipProvider } from '@/shared/components/ui/tooltip'

import appCss from '../styles.css?url'

const queryClient = getQueryClient()

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <a href="/" className="mt-4 inline-block text-sm text-primary underline">
          Go to Overview
        </a>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Sync Role - Job Tracker',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'manifest', href: '/manifest.json' },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()
  const location = useLocation()

  useEffect(() => {
    fetchSession().then(({ user }) => {
      setSessionChecked(true)
      const isAuthRoute = location.pathname === '/auth'

      if (!user && !isAuthRoute) {
        router.navigate({ to: '/auth', replace: true })
        return
      }

      if (user && isAuthRoute) {
        router.navigate({ to: '/', replace: true })
        return
      }
    }).catch(() => setSessionChecked(true))
  }, [location.pathname, router])

  if (!sessionChecked) {
    return null
  }

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <style>{`
          #app-splash {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: hsl(var(--background));
            z-index: 9999;
            transition: opacity 400ms ease-out;
          }
          #app-splash svg {
            width: 48px;
            height: 48px;
            color: hsl(var(--muted-foreground));
            animation: app-splash-pulse 1.2s ease-in-out infinite;
          }
          #app-splash.app-splash--fading {
            opacity: 0;
          }
          @keyframes app-splash-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
        `}</style>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        <CopyProvider>
          <Splash />
          <ThemeController />
          <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={150}>
              <AuthGuard>{children}</AuthGuard>
            </TooltipProvider>
          </QueryClientProvider>
        </CopyProvider>
        <Scripts />
      </body>
    </html>
  )
}
