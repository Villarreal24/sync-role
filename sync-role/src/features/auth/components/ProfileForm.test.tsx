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

function setAuthState(
  displayName: string,
  avatarUrl: string,
  phone: string | null = null,
  linkedinUrl: string | null = null,
  githubUrl: string | null = null,
  portfolioUrl: string | null = null,
) {
  useAuthStore.setState({
    user: {
      id: 'u-1',
      email: 'a@b.com',
      displayName,
      avatarUrl,
      phone,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
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

  it('renders and prefills the extra profile fields', async () => {
    setAuthState('Luis V.', '', '+54 11 5555-1234', 'https://linkedin.com/in/luis', 'https://github.com/luis', null)
    render(<ProfileForm />, { wrapper: makeWrapper() })
    // Phone is formatted for display; raw is what's stored
    expect((await screen.findByLabelText(/phone/i) as HTMLInputElement).value).toBe('+54 (115)-555-1234')
    expect((screen.getByLabelText(/linkedin/i) as HTMLInputElement).value).toBe('https://linkedin.com/in/luis')
    expect((screen.getByLabelText(/github/i) as HTMLInputElement).value).toBe('https://github.com/luis')
    expect((screen.getByLabelText(/portfolio/i) as HTMLInputElement).value).toBe('')
  })

  it('enables Save when an extra field changes', async () => {
    const user = userEvent.setup()
    setAuthState('Luis V.', '')
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const phoneInput = await screen.findByLabelText(/phone/i)
    await user.type(phoneInput, '+1 555')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })

  it('PATCHes extra fields and updates auth store', async () => {
    const user = userEvent.setup()
    setAuthState('Luis V.', '')
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      id: 'u-1',
      display_name: 'Luis V.',
      avatar_url: '',
      phone: '+1 555 123-4567',
      linkedin_url: null,
      github_url: 'https://github.com/luisv',
      portfolio_url: null,
      created_at: '',
      updated_at: '',
    })

    render(<ProfileForm />, { wrapper: makeWrapper() })
    const phoneInput = await screen.findByLabelText(/phone/i)
    await user.type(phoneInput, '+1 555 123-4567')
    const githubInput = screen.getByLabelText(/github/i)
    await user.type(githubInput, 'https://github.com/luisv')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/profiles/me',
        expect.objectContaining({
          phone: '+15551234567',
          github_url: 'https://github.com/luisv',
        }),
      )
    })
    // Auth store reflects the response from the backend (raw value)
    await waitFor(() => {
      expect(useAuthStore.getState().user?.phone).toBe('+1 555 123-4567')
      expect(useAuthStore.getState().user?.githubUrl).toBe('https://github.com/luisv')
    })
  })

  it('sends null when clearing a URL field', async () => {
    const user = userEvent.setup()
    setAuthState('Luis V.', '', null, 'https://linkedin.com/in/luis', null, null)
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      id: 'u-1',
      display_name: 'Luis V.',
      avatar_url: '',
      phone: null,
      linkedin_url: null,
      github_url: null,
      portfolio_url: null,
      created_at: '',
      updated_at: '',
    })

    render(<ProfileForm />, { wrapper: makeWrapper() })
    const linkedinInput = await screen.findByLabelText(/linkedin/i)
    await user.clear(linkedinInput)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/profiles/me',
        expect.objectContaining({
          linkedin_url: null,
        }),
      )
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
