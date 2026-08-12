import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ProfileForm } from './ProfileForm'

const mockMutateState = vi.hoisted(() => ({ fn: vi.fn(), error: null as Error | null }))

vi.mock('@/features/auth/hooks/use-update-profile', () => ({
  useUpdateProfile: () => ({
    mutate: mockMutateState.fn,
    isPending: false,
    get error() { return mockMutateState.error },
  }),
}))

const mockUseProfile = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/api/profiles', () => ({
  useProfile: (...args: any[]) => mockUseProfile(...args),
}))

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'a@b.com' },
    loading: false,
  }),
}))

vi.mock('@/core/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

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

function mockProfile(
  displayName: string,
  avatarUrl: string,
  phone: string | null = null,
  linkedinUrl: string | null = null,
  githubUrl: string | null = null,
  portfolioUrl: string | null = null,
) {
  mockUseProfile.mockReturnValue({
    data: {
      id: 'u-1',
      displayName,
      avatarUrl,
      phone,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
    },
    isLoading: false,
  })
}

describe('ProfileForm', () => {
  beforeEach(() => {
    mockMutateState.fn.mockReset()
    mockMutateState.error = null
    mockUseProfile.mockReset()
    mockProfile('Luis Villarreal', '')
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

  it('calls mutate when Save is clicked', async () => {
    const user = userEvent.setup()
    mockMutateState.fn.mockImplementation((_payload, { onSuccess }: any) => {
      onSuccess?.()
    })
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const nameInput = await screen.findByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Luis V.')

    const urlInput = screen.getByLabelText(/avatar url/i)
    await user.type(urlInput, 'https://example.com/me.png')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockMutateState.fn).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Luis V.',
          avatarUrl: 'https://example.com/me.png',
        }),
        expect.any(Object),
      )
    })
  })

  it('renders and prefills the extra profile fields', async () => {
    mockProfile('Luis V.', '', '+54 11 5555-1234', 'https://linkedin.com/in/luis', 'https://github.com/luis', null)
    render(<ProfileForm />, { wrapper: makeWrapper() })
    expect((await screen.findByLabelText(/phone/i) as HTMLInputElement).value).toBe('+54 (115)-555-1234')
    expect((screen.getByLabelText(/linkedin/i) as HTMLInputElement).value).toBe('https://linkedin.com/in/luis')
    expect((screen.getByLabelText(/github/i) as HTMLInputElement).value).toBe('https://github.com/luis')
    expect((screen.getByLabelText(/portfolio/i) as HTMLInputElement).value).toBe('')
  })

  it('enables Save when an extra field changes', async () => {
    const user = userEvent.setup()
    mockProfile('Luis V.', '')
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const phoneInput = await screen.findByLabelText(/phone/i)
    await user.type(phoneInput, '+1 555')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })

  it('sends null when clearing a URL field', async () => {
    const user = userEvent.setup()
    mockProfile('Luis V.', '', null, 'https://linkedin.com/in/luis', null, null)
    mockMutateState.fn.mockImplementation((_payload, { onSuccess }: any) => {
      onSuccess?.()
    })
    render(<ProfileForm />, { wrapper: makeWrapper() })
    const linkedinInput = await screen.findByLabelText(/linkedin/i)
    await user.clear(linkedinInput)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockMutateState.fn).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedinUrl: null,
        }),
        expect.any(Object),
      )
    })
  })

  it('shows the error message when mutation has an error', async () => {
    // Render with error set in the mutation result
    mockMutateState.error = new Error('boom')
    render(<ProfileForm />, { wrapper: makeWrapper() })
    expect(await screen.findByText('boom')).toBeInTheDocument()
  })
})
