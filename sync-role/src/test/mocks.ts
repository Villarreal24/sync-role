import { vi } from 'vitest'

export function mockFetchResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  const { status = 200 } = init
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function installFetchMock() {
  const fetchMock = vi.fn()
  ;(globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}
