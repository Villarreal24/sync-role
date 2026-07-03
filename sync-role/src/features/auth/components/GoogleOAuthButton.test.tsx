import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleOAuthButton } from './GoogleOAuthButton'
import { installFetchMock, mockFetchResponse } from '@/test/mocks'

describe('GoogleOAuthButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the button with the default label', () => {
    render(<GoogleOAuthButton />)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('fetches the Google OAuth URL on click', async () => {
    const fetchMock = installFetchMock()
    fetchMock.mockResolvedValue(mockFetchResponse({ url: 'https://google.com/oauth' }))
    const user = userEvent.setup()

    render(<GoogleOAuthButton />)
    await user.click(screen.getByRole('button', { name: /sign in with google/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    const calledUrl = (fetchMock.mock.calls[0] as unknown as [string])[0]
    expect(calledUrl).toContain('/auth/google')
  })

  it('switches to the pending label while loading', async () => {
    const fetchMock = installFetchMock()
    let resolveFetch!: (v: Response) => void
    fetchMock.mockReturnValue(new Promise((res) => { resolveFetch = res }))
    const user = userEvent.setup()

    render(<GoogleOAuthButton />)
    await user.click(screen.getByRole('button', { name: /sign in with google/i }))

    expect(await screen.findByRole('button', { name: /redirecting/i })).toBeDisabled()
    resolveFetch(mockFetchResponse({ url: 'https://google.com/oauth' }))
  })

  it('logs the error and resets the button if fetch fails', async () => {
    const fetchMock = installFetchMock()
    fetchMock.mockRejectedValue(new Error('network down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(<GoogleOAuthButton />)
    await user.click(screen.getByRole('button', { name: /sign in with google/i }))

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled()
    })
    expect(await screen.findByRole('button', { name: /sign in with google/i })).toBeEnabled()
  })
})
