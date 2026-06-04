import { describe, expect, it, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { DrwynClient } from '../src/client'

describe('DrwynClient memory', () => {
  let fetchSpy: MockInstance<typeof fetch>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ value: { visited: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('getMemory builds the right URL and returns the value', async () => {
    const drwyn = new DrwynClient({ projectKey: 'pk_x', cloudUrl: 'https://api.example' })
    const value = await drwyn.getMemory('anon_a', 'last_page')
    const [url] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://api.example/memory/last_page?user_id=anon_a')
    expect(value).toEqual({ visited: true })
  })

  it('getMemory passes namespace as query param', async () => {
    const drwyn = new DrwynClient({ projectKey: 'pk_x', cloudUrl: 'https://api.example' })
    await drwyn.getMemory('anon_a', 'step', { namespace: 'checkout' })
    const [url] = fetchSpy.mock.calls[0]!
    expect(url).toBe(
      'https://api.example/memory/step?user_id=anon_a&namespace=checkout',
    )
  })

  it('getMemory URL-encodes the key', async () => {
    const drwyn = new DrwynClient({ projectKey: 'pk_x', cloudUrl: 'https://api.example' })
    await drwyn.getMemory('anon_a', 'a/b c')
    const [url] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://api.example/memory/a%2Fb%20c?user_id=anon_a')
  })

  it('setMemory POSTs the right body', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    const drwyn = new DrwynClient({ projectKey: 'pk_x', cloudUrl: 'https://api.example' })
    await drwyn.setMemory('anon_a', 'pref', { theme: 'dark' })
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://api.example/memory')
    expect((init as RequestInit).method).toBe('POST')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toEqual({
      user_id: 'anon_a',
      key: 'pref',
      value: { theme: 'dark' },
    })
    // namespace is omitted (not sent as undefined) when not provided
    expect('namespace' in body).toBe(false)
  })

  it('setMemory includes namespace when provided', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    const drwyn = new DrwynClient({ projectKey: 'pk_x', cloudUrl: 'https://api.example' })
    await drwyn.setMemory('anon_a', 'step', 3, { namespace: 'checkout' })
    const [, init] = fetchSpy.mock.calls[0]!
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toEqual({
      user_id: 'anon_a',
      namespace: 'checkout',
      key: 'step',
      value: 3,
    })
  })
})
