import { beforeEach, describe, expect, it } from 'vitest'
import { createUserIdSource } from '../src/store/user-id'

class MemStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
}

describe('createUserIdSource', () => {
  it('generates and persists an anon id on first run', () => {
    const storage = new MemStorage()
    let counter = 0
    const src = createUserIdSource({
      storage,
      uuid: () => `anon-${++counter}`,
    })
    expect(src.current()).toBe('anon-1')
    expect(storage.getItem('drwyn:anon-id')).toBe('anon-1')
    expect(src.isAnon()).toBe(true)
  })

  it('re-reads the persisted anon id on subsequent constructions', () => {
    const storage = new MemStorage()
    storage.setItem('drwyn:anon-id', 'persisted-uuid')
    const src = createUserIdSource({
      storage,
      uuid: () => 'should-not-be-called',
    })
    expect(src.current()).toBe('persisted-uuid')
    expect(src.isAnon()).toBe(true)
  })

  it('setUserId overrides the current id but leaves the stored anon id alone', () => {
    const storage = new MemStorage()
    const src = createUserIdSource({
      storage,
      uuid: () => 'anon-x',
    })
    src.setUserId('real-user-7')
    expect(src.current()).toBe('real-user-7')
    expect(src.isAnon()).toBe(false)
    // anon id stays in storage
    expect(storage.getItem('drwyn:anon-id')).toBe('anon-x')
  })

  it('setUserId(null) reverts to the stored anon id', () => {
    const storage = new MemStorage()
    const src = createUserIdSource({
      storage,
      uuid: () => 'anon-y',
    })
    src.setUserId('real-user-8')
    src.setUserId(null)
    expect(src.current()).toBe('anon-y')
    expect(src.isAnon()).toBe(true)
  })

  it('returns the new current id from setUserId', () => {
    const storage = new MemStorage()
    const src = createUserIdSource({
      storage,
      uuid: () => 'anon-z',
    })
    expect(src.setUserId('real')).toBe('real')
    expect(src.setUserId(null)).toBe('anon-z')
  })

  it('honors a custom storageKey', () => {
    const storage = new MemStorage()
    const src = createUserIdSource({
      storage,
      storageKey: 'my-key',
      uuid: () => 'anon-q',
    })
    expect(src.current()).toBe('anon-q')
    expect(storage.getItem('my-key')).toBe('anon-q')
    expect(storage.getItem('drwyn:anon-id')).toBeNull()
  })

  it('falls back to ephemeral in-memory anon when no storage is available', () => {
    // Simulate SSR / private mode: pass no storage and ensure globalThis.localStorage is undefined.
    const originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage
    delete (globalThis as { localStorage?: Storage }).localStorage
    try {
      let calls = 0
      const src = createUserIdSource({ uuid: () => `eph-${++calls}` })
      expect(src.current()).toBe('eph-1')
      // Second instance generates a different ephemeral id (not persisted).
      const src2 = createUserIdSource({ uuid: () => `eph-${++calls}` })
      expect(src2.current()).toBe('eph-2')
    } finally {
      if (originalLocalStorage !== undefined) {
        (globalThis as { localStorage?: Storage }).localStorage = originalLocalStorage
      }
    }
  })

  it('uses globalThis.localStorage by default when no storage opt is passed', () => {
    // happy-dom provides a real localStorage
    const ls = (globalThis as { localStorage: Storage }).localStorage
    ls.removeItem('drwyn:anon-id')
    let calls = 0
    const src = createUserIdSource({ uuid: () => `ls-${++calls}` })
    expect(src.current()).toBe('ls-1')
    expect(ls.getItem('drwyn:anon-id')).toBe('ls-1')
    // cleanup
    ls.removeItem('drwyn:anon-id')
  })
})
