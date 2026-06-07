import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryStore } from '../src/store/memory-store'
import { createUserIdSource } from '../src/store/user-id'

class MemStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
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

describe('createMemoryStore (IDB-only)', () => {
  it('uses(name) returns 0 for unknown actions', async () => {
    const store = createMemoryStore({
      dbName,
      userId: createUserIdSource({ storage, uuid: () => 'u1' }),
    })
    await store.ready
    expect(store.uses('never-recorded')).toBe(0)
    expect(store.lastSeen('never-recorded')).toBeNull()
  })

  it('record(name) increments uses synchronously', async () => {
    const store = createMemoryStore({
      dbName,
      userId: createUserIdSource({ storage, uuid: () => 'u1' }),
      now: () => 1000,
    })
    await store.ready
    store.record('cta')
    expect(store.uses('cta')).toBe(1)
    expect(store.lastSeen('cta')).toBe(1000)
    store.record('cta')
    expect(store.uses('cta')).toBe(2)
  })

  it('persists across store instances (same userId, same dbName)', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'u-persist' })

    const s1 = createMemoryStore({ dbName, userId, now: () => 1234 })
    await s1.ready
    s1.record('a')
    s1.record('a')
    s1.record('b')
    // Give the fire-and-forget writes a tick to flush.
    await new Promise((r) => setTimeout(r, 50))

    const s2 = createMemoryStore({ dbName, userId, now: () => 9999 })
    await s2.ready
    expect(s2.uses('a')).toBe(2)
    expect(s2.uses('b')).toBe(1)
    expect(s2.lastSeen('a')).toBe(1234)
  })

  it('isolates data per userId via composite keys', async () => {
    // User u1 records 3 uses of "cta"
    const u1 = createUserIdSource({ storage, uuid: () => 'u1' })
    const s1 = createMemoryStore({ dbName, userId: u1, now: () => 100 })
    await s1.ready
    s1.record('cta')
    s1.record('cta')
    s1.record('cta')
    await new Promise((r) => setTimeout(r, 50))

    // User u2: a fresh store with a different user id should see 0 uses.
    const storage2 = new MemStorage()
    const u2 = createUserIdSource({ storage: storage2, uuid: () => 'u2' })
    const s2 = createMemoryStore({ dbName, userId: u2, now: () => 100 })
    await s2.ready
    expect(s2.uses('cta')).toBe(0)
  })

  it('ready resolves before any reads need to return persisted data', async () => {
    // Seed IDB directly via a previous store, then construct anew and assert ready resolves before reads.
    const userId = createUserIdSource({ storage, uuid: () => 'u-ready' })
    const s1 = createMemoryStore({ dbName, userId })
    await s1.ready
    s1.record('seeded')
    await new Promise((r) => setTimeout(r, 50))

    const s2 = createMemoryStore({ dbName, userId })
    // Before await — reads may be 0 (we don't guarantee this, only that ready resolves correctly).
    await s2.ready
    expect(s2.uses('seeded')).toBe(1)
  })

  it('setUserId delegates to the user-id source', async () => {
    const userId = createUserIdSource({ storage, uuid: () => 'anon' })
    const store = createMemoryStore({ dbName, userId })
    await store.ready
    store.setUserId('real-user')
    expect(userId.current()).toBe('real-user')
  })
})
