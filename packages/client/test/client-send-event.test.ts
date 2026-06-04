import { describe, expect, it, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { DrwynClient } from '../src/client'

describe('DrwynClient.sendEvent', () => {
  let fetchSpy: MockInstance<typeof fetch>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('POSTs the event with bearer auth', async () => {
    const drwyn = new DrwynClient({ projectKey: 'pk_test', cloudUrl: 'https://api.example' })
    await drwyn.sendEvent({ userId: 'anon_abc', name: 'cta_clicked', props: { plan: 'pro' } })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('https://api.example/events')
    expect((init as RequestInit).method).toBe('POST')
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer pk_test')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      user_id: 'anon_abc',
      name: 'cta_clicked',
      props: { plan: 'pro' },
    })
  })

  it('throws on non-2xx', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('unauthorized', { status: 401 }),
    )
    const drwyn = new DrwynClient({ projectKey: 'pk_test' })
    await expect(
      drwyn.sendEvent({ userId: 'u', name: 'x' }),
    ).rejects.toThrow(/401/)
  })
})
