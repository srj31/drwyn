/**
 * Tests for createMemoryStore wired to a CloudClient.
 *
 * Strategy: real timers throughout, with a tiny `cloudDebounceMs` (e.g. 10ms) so
 * debounced flushes are observable without fake timers. Fake timers interact badly
 * with IndexedDB transactions (transactions stall waiting for microtask + macrotask
 * progression). For tests that need to assert exact timing relative to record(),
 * we call `await store.flush()` to force a flush instead of relying on the debounce.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStore } from '../src/store/memory-store'
import { createUserIdSource } from '../src/store/user-id'
import type { CloudClient } from '../src/store/cloud-sync'

class MemStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
}

function makeMockCloud(initialData: Record<string, Record<string, { count: number; lastSeenMs: number }> | null> = {}) {
  const store: Record<string, Record<string, { count: number; lastSeenMs: number }> | null> = { ...initialData }
  const getMemory = vi.fn<CloudClient['getMemory']>(async (userId, _key) => {
    return store[userId] ?? null
  })
  const setMemory = vi.fn<CloudClient['setMemory']>(async (userId, _key, value) => {
    store[userId] = value as Record<string, { count: number; lastSeenMs: number }>
  })
  return { client: { getMemory, setMemory } satisfies CloudClient, getMemory, setMemory, store }
}

let dbName: string
let storage: MemStorage

beforeEach(() => {
  dbName = `drwyn-test-${Math.random().toString(36).slice(2)}`
  storage = new MemStorage()
})

afterEach(async () => {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(dbName)
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('createMemoryStore (with cloud)', () => {
  it('initial pull merges cloud + local by max(count) and max(lastSeenMs)', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u1' })

    // Step 1: seed local IDB with cta count=3, lastSeenMs=50
    const s1 = createMemoryStore({ dbName, userId, now: () => 50 })
    await s1.ready
    s1.record('cta')
    s1.record('cta')
    s1.record('cta')
    await new Promise((r) => setTimeout(r, 50))
    expect(s1.uses('cta')).toBe(3)

    // Step 2: build a cloud with cta count=10, lastSeenMs=999 under same userId
    const { client } = makeMockCloud({
      u1: { cta: { count: 10, lastSeenMs: 999 } },
    })

    // Step 3: new store with cloud should merge by max
    const s2 = createMemoryStore({ dbName, userId, cloud: client, now: () => 200, pagehideTarget: null })
    await s2.ready
    expect(s2.uses('cta')).toBe(10)
    expect(s2.lastSeen('cta')).toBe(999)
  })

  it('initial pull also accepts cloud-only entries (no local row)', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-only-cloud' })
    const { client } = makeMockCloud({
      'u-only-cloud': { newAction: { count: 7, lastSeenMs: 42 } },
    })

    const s = createMemoryStore({ dbName, userId, cloud: client, pagehideTarget: null })
    await s.ready
    expect(s.uses('newAction')).toBe(7)
    expect(s.lastSeen('newAction')).toBe(42)
  })

  it('cloud-merged rows are persisted back to IDB under the composite key', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-persist-cloud' })
    const { client } = makeMockCloud({
      'u-persist-cloud': { cta: { count: 5, lastSeenMs: 500 } },
    })

    const s1 = createMemoryStore({ dbName, userId, cloud: client, pagehideTarget: null })
    await s1.ready
    expect(s1.uses('cta')).toBe(5)

    // Second store with NO cloud — should still see cta=5 from IDB.
    const s2 = createMemoryStore({ dbName, userId })
    await s2.ready
    expect(s2.uses('cta')).toBe(5)
    expect(s2.lastSeen('cta')).toBe(500)
  })

  it('record() schedules a cloud sync that flushes after the debounce window', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-record' })
    const { client, setMemory } = makeMockCloud()

    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 10,
      now: () => 1234,
      pagehideTarget: null,
    })
    await s.ready

    s.record('cta')
    expect(setMemory).not.toHaveBeenCalled()

    // Wait past the debounce window for the timer to flush.
    await new Promise((r) => setTimeout(r, 30))

    expect(setMemory).toHaveBeenCalledTimes(1)
    expect(setMemory).toHaveBeenCalledWith('u-record', 'uses', {
      cta: { count: 1, lastSeenMs: 1234 },
    })
  })

  it('record() then flush() pushes the latest snapshot immediately', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-flush' })
    const { client, setMemory } = makeMockCloud()

    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 5000, // long, to prove flush short-circuits it
      now: () => 9000,
      pagehideTarget: null,
    })
    await s.ready

    s.record('a')
    s.record('b')
    expect(setMemory).not.toHaveBeenCalled()

    await s.flush()

    expect(setMemory).toHaveBeenCalledTimes(1)
    expect(setMemory).toHaveBeenCalledWith('u-flush', 'uses', {
      a: { count: 1, lastSeenMs: 9000 },
      b: { count: 1, lastSeenMs: 9000 },
    })
  })

  it('flush() with no pending writes is a safe no-op', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-noflush' })
    const { client, setMemory } = makeMockCloud()
    const s = createMemoryStore({ dbName, userId, cloud: client, pagehideTarget: null })
    await s.ready
    await s.flush()
    expect(setMemory).not.toHaveBeenCalled()
  })

  it('setUserId(newId) pushes the anon snapshot up under newId (anon→authed migration)', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'anon-1' })
    const { client, setMemory } = makeMockCloud()

    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 5000,
      now: () => 1000,
      pagehideTarget: null,
    })
    await s.ready

    // Anon records some uses.
    s.record('cta')
    s.record('cta')
    s.record('lp')

    setMemory.mockClear()

    // Migrate to a real user.
    s.setUserId('real-user')

    // Force the migration push to land.
    await s.flush()

    // setMemory should have been called with the REAL user's id and the anon snapshot.
    const realUserCalls = setMemory.mock.calls.filter((c) => c[0] === 'real-user')
    expect(realUserCalls.length).toBeGreaterThanOrEqual(1)
    const lastCall = realUserCalls[realUserCalls.length - 1]!
    expect(lastCall[1]).toBe('uses')
    expect(lastCall[2]).toEqual({
      cta: { count: 2, lastSeenMs: 1000 },
      lp: { count: 1, lastSeenMs: 1000 },
    })
  })

  it('setUserId(newId) pulls the new userId\'s prior cloud state and merges into the local map', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'anon-2' })
    const { client } = makeMockCloud({
      // real-user has prior cloud state from another device
      'real-user': { cta: { count: 50, lastSeenMs: 5000 } },
    })

    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 5000,
      now: () => 100,
      pagehideTarget: null,
    })
    await s.ready

    // anon has cta=1 locally
    s.record('cta')
    expect(s.uses('cta')).toBe(1)

    // Migrate
    s.setUserId('real-user')

    // The pull+merge happens asynchronously. Flush the push, then wait for pull to settle.
    await s.flush()
    // Allow async pullAndMerge after setUserId to settle.
    await new Promise((r) => setTimeout(r, 50))

    // Now local should reflect max(local=1, cloud=50) = 50
    expect(s.uses('cta')).toBe(50)
    expect(s.lastSeen('cta')).toBe(5000)
  })

  it('setUserId(sameId) is a no-op (does not schedule a cloud push)', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'stable-id' })
    const { client, setMemory } = makeMockCloud()
    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 5000,
      pagehideTarget: null,
    })
    await s.ready
    setMemory.mockClear()

    // Setting userId to null keeps current() === 'stable-id'.
    s.setUserId(null)
    await s.flush()
    expect(setMemory).not.toHaveBeenCalled()
  })

  it('pagehide event triggers a cloud flush', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-pagehide' })
    const { client, setMemory } = makeMockCloud()

    const listeners = new Map<string, EventListener[]>()
    const addEventListener = vi.fn((type: string, listener: EventListener) => {
      const arr = listeners.get(type) ?? []
      arr.push(listener)
      listeners.set(type, arr)
    })
    const removeEventListener = vi.fn()
    const target = {
      addEventListener,
      removeEventListener,
    } as unknown as {
      addEventListener: typeof globalThis.addEventListener
      removeEventListener: typeof globalThis.removeEventListener
    }

    const s = createMemoryStore({
      dbName,
      userId,
      cloud: client,
      cloudDebounceMs: 5000,
      now: () => 1,
      pagehideTarget: target,
    })
    await s.ready

    expect(addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function))
    expect(addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

    s.record('cta')
    expect(setMemory).not.toHaveBeenCalled()

    // Fire pagehide listeners.
    for (const l of listeners.get('pagehide') ?? []) {
      l(new Event('pagehide'))
    }
    // Allow the flush microtasks to settle.
    await new Promise((r) => setTimeout(r, 10))

    expect(setMemory).toHaveBeenCalledTimes(1)
    expect(setMemory).toHaveBeenCalledWith('u-pagehide', 'uses', {
      cta: { count: 1, lastSeenMs: 1 },
    })
  })

  it('does not register lifecycle listeners when pagehideTarget is null', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-no-lifecycle' })
    const { client } = makeMockCloud()
    // Should not throw, even without lifecycle target.
    const s = createMemoryStore({ dbName, userId, cloud: client, pagehideTarget: null })
    await s.ready
    expect(s.uses('whatever')).toBe(0)
  })

  it('no-cloud path: flush() exists and resolves immediately', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-no-cloud' })
    const s = createMemoryStore({ dbName, userId })
    await s.ready
    await s.flush() // should not throw
    expect(s.uses('x')).toBe(0)
  })
})
