import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCloudSync, type CloudClient } from '../src/store/cloud-sync'

function makeMockClient() {
  const getMemory = vi.fn<CloudClient['getMemory']>()
  const setMemory = vi.fn<CloudClient['setMemory']>().mockResolvedValue(undefined)
  const client: CloudClient = { getMemory, setMemory }
  return { client, getMemory, setMemory }
}

const snap = (count: number, lastSeenMs: number) => ({ count, lastSeenMs })

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createCloudSync', () => {
  it('schedule + advance timer → setMemory called once with the snapshot', async () => {
    const { client, setMemory } = makeMockClient()
    const sync = createCloudSync({ client, debounceMs: 5000 })
    sync.schedule('user-1', { cta: snap(3, 100) })

    expect(setMemory).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5000)
    expect(setMemory).toHaveBeenCalledTimes(1)
    expect(setMemory).toHaveBeenCalledWith('user-1', 'uses', { cta: snap(3, 100) })
  })

  it('multiple schedules within debounce window collapse into one flush with the LAST snapshot', async () => {
    const { client, setMemory } = makeMockClient()
    const sync = createCloudSync({ client })
    sync.schedule('user-1', { cta: snap(1, 100) })
    await vi.advanceTimersByTimeAsync(1000)
    sync.schedule('user-1', { cta: snap(2, 200) })
    await vi.advanceTimersByTimeAsync(1000)
    sync.schedule('user-1', { cta: snap(3, 300) })

    expect(setMemory).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5000)
    expect(setMemory).toHaveBeenCalledTimes(1)
    expect(setMemory).toHaveBeenCalledWith('user-1', 'uses', { cta: snap(3, 300) })
  })

  it('schedule for a NEW userId flushes the previous userId synchronously', async () => {
    const { client, setMemory } = makeMockClient()
    const sync = createCloudSync({ client })
    sync.schedule('user-A', { cta: snap(1, 10) })
    sync.schedule('user-B', { lp: snap(2, 20) })
    // user-A snapshot should have been flushed BEFORE the new userId's timer starts.
    // It runs synchronously, so by next microtask the call has happened.
    await Promise.resolve()
    expect(setMemory).toHaveBeenCalledWith('user-A', 'uses', { cta: snap(1, 10) })
    // user-B is still pending.
    expect(setMemory).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(setMemory).toHaveBeenCalledWith('user-B', 'uses', { lp: snap(2, 20) })
    expect(setMemory).toHaveBeenCalledTimes(2)
  })

  it('flush() writes pending snapshot immediately and resolves when done', async () => {
    const { client, setMemory } = makeMockClient()
    const sync = createCloudSync({ client })
    sync.schedule('user-1', { cta: snap(1, 10) })
    await sync.flush()
    expect(setMemory).toHaveBeenCalledWith('user-1', 'uses', { cta: snap(1, 10) })
    // Subsequent flush with no pending writes is a no-op.
    setMemory.mockClear()
    await sync.flush()
    expect(setMemory).not.toHaveBeenCalled()
  })

  it('dispose() cancels the pending timer and is idempotent', async () => {
    const { client, setMemory } = makeMockClient()
    const sync = createCloudSync({ client })
    sync.schedule('user-1', { cta: snap(1, 10) })
    sync.dispose()
    sync.dispose() // idempotent
    await vi.advanceTimersByTimeAsync(10000)
    expect(setMemory).not.toHaveBeenCalled()
  })

  it('setMemory rejection goes to onError; subsequent schedules still work', async () => {
    const onError = vi.fn()
    const { client, setMemory } = makeMockClient()
    setMemory.mockRejectedValueOnce(new Error('boom'))
    const sync = createCloudSync({ client, onError })
    sync.schedule('user-1', { cta: snap(1, 10) })
    await vi.advanceTimersByTimeAsync(5000)
    await Promise.resolve() // let the rejection settle
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error)

    sync.schedule('user-1', { cta: snap(2, 20) })
    await vi.advanceTimersByTimeAsync(5000)
    expect(setMemory).toHaveBeenCalledTimes(2)
  })

  it('pull(userId) returns the typed record on success', async () => {
    const { client, getMemory } = makeMockClient()
    getMemory.mockResolvedValueOnce({ cta: { count: 5, lastSeenMs: 999 } })
    const sync = createCloudSync({ client })
    const result = await sync.pull('user-1')
    expect(result).toEqual({ cta: { count: 5, lastSeenMs: 999 } })
    expect(getMemory).toHaveBeenCalledWith('user-1', 'uses')
  })

  it('pull(userId) returns null when getMemory returns null', async () => {
    const { client, getMemory } = makeMockClient()
    getMemory.mockResolvedValueOnce(null)
    const sync = createCloudSync({ client })
    expect(await sync.pull('user-1')).toBeNull()
  })

  it('pull(userId) calls onError and returns null when getMemory throws', async () => {
    const onError = vi.fn()
    const { client, getMemory } = makeMockClient()
    getMemory.mockRejectedValueOnce(new Error('net'))
    const sync = createCloudSync({ client, onError })
    expect(await sync.pull('user-1')).toBeNull()
    expect(onError).toHaveBeenCalled()
  })
})
