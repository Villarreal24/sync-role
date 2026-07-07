import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ProfileForm } from './ProfileForm'
import { useAuthStore } from '../store/auth.store'

vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '@/core/api/client'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function setAuthState(displayName: string, avatarUrl: string) {
  useAuthStore.setState({
    user: {
      id: 'u-1',
      email: 'a@b.com',
      displayName,
      avatarUrl,
    },
    token: 't',
    refreshToken: 'r',
    isAuthenticated: true,
    profileHydrated: true,
  })
}

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    setAuthState('Luis Villarreal', '')
  })

  it('prefills the inputs with the current profile values', async () => {
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const nameInput = (await screen.findByLabelText(/display name/i)) as HTMLInputElement
    expect(nameInput.value).toBe('Luis Villarreal')
  })

  it('shows the Save button as disabled until the form is dirty', async () => {
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const save = await screen.findByRole('button', { name: /save changes/i })
    expect(save).toBeDisabled()
  })

  it('enables Save after the user types a change', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const nameInput = await screen.findByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Luis V')
    const save = screen.getByRole('button', { name: /save changes/i })
    expect(save).toBeEnabled()
  })

  it('PATCHes the profile and updates the auth store on success', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      id: 'u-1',
      display_name: 'Luis V.',
      avatar_url: 'https://example.com/me.png',
      created_at: '',
      updated_at: '',
    })

    render(<ProfileForm />, { wrapper: makeWrapper() })
    const nameInput = await screen.findByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Luis V.')

    const urlInput = screen.getByLabelText(/avatar url/i)
    await user.type(urlInput, 'https://example.com/me.png')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/profiles/me',
        expect.objectContaining({
          display_name: 'Luis V.',
          avatar_url: 'https://example.com/me.png',
        }),
      )
    })
    // Auth store reflects the new values
    await waitFor(() => {
      expect(useAuthStore.getState().user?.displayName).toBe('Luis V.')
      expect(useAuthStore.getState().user?.avatarUrl).toBe('https://example.com/me.png')
    })
  })

  it('shows the error message when the request fails', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('boom'))

    render(<ProfileForm />, { wrapper: makeWrapper() })
    const nameInput = await screen.findByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'X')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('boom')).toBeInTheDocument()
  })
})
