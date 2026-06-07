import { describe, expect, it } from 'vitest'
import {
  createMemoryStore,
  memory,
  surface,
  type MemoryStore,
  type SurfaceConfig,
  type SurfaceVisibility,
  type CloudClient,
  type UserIdSource,
  type CreateMemoryStoreOptions,
} from '@drwyn/memory'

describe('@drwyn/memory public exports', () => {
  it('createMemoryStore is a function', () => {
    expect(typeof createMemoryStore).toBe('function')
  })

  it('memory plugin has name and propKey', () => {
    expect(memory.name).toBe('memory')
    expect(memory.propKey).toBe('memory')
    expect(memory.always).toBe(true)
  })

  it('surface plugin has name and propKey', () => {
    expect(surface.name).toBe('surface')
    expect(surface.propKey).toBe('surface')
  })

  it('type imports are usable in this file (compile-time only)', () => {
    // No runtime assertion; if this test compiles, types are exported.
    const _typeCheck: {
      store?: MemoryStore
      cfg?: SurfaceConfig
      vis?: SurfaceVisibility
      cloud?: CloudClient
      uid?: UserIdSource
      opts?: CreateMemoryStoreOptions
    } = {}
    expect(_typeCheck).toBeDefined()
  })
})
