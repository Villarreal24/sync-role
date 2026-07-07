import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute, useRouter, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'

import { getQueryClient } from '@/core/api/query-client'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ThemeScript } from '@/features/theme/ThemeScript'
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const location = useLocation()

  useEffect(() => {
    // Only run client-side — SSR renders the page without auth check
    const isAuthRoute = location.pathname === '/auth'

    if (!isAuthenticated && !isAuthRoute) {
      router.navigate({ to: '/auth', replace: true })
      return
    }

    if (isAuthenticated && isAuthRoute) {
      router.navigate({ to: '/', replace: true })
      return
    }

    // Hydrate profile (displayName + avatarUrl) once on first authenticated render
    if (isAuthenticated && user && user.displayName === '' && user.avatarUrl === '') {
      void useAuthStore.getState().hydrateProfile()
    }
  }, [isAuthenticated, user, location.pathname, router])

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
        <Splash />
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={150}>
            <AuthGuard>{children}</AuthGuard>
          </TooltipProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
