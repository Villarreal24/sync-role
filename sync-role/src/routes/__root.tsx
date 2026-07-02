import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute, useRouter, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'

import { getQueryClient } from '@/core/api/query-client'
import { useAuthStore } from '@/features/auth/store/auth.store'

import appCss from '../styles.css?url'

const queryClient = getQueryClient()

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
        title: 'ApplySync - Job Tracker',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()
  const location = useLocation()

  useEffect(() => {
    // Only run client-side — SSR renders the page without auth check
    const isAuthRoute = location.pathname === '/auth'

    if (!isAuthenticated && !isAuthRoute) {
      router.navigate({ to: '/auth', replace: true })
    }

    if (isAuthenticated && isAuthRoute) {
      router.navigate({ to: '/', replace: true })
    }
  }, [isAuthenticated, location.pathname, router])

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <QueryClientProvider client={queryClient}>
          <AuthGuard>{children}</AuthGuard>
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
