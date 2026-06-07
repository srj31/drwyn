/**
 * Anonymous-by-default user-id source with override.
 *
 * - Generates a stable UUID on first call; persists in localStorage.
 * - Returns the persisted UUID on subsequent calls (across sessions on the same device).
 * - setUserId(realId) overrides the current id without touching the stored anon.
 * - setUserId(null) reverts to the persisted anon id.
 * - SSR-safe: when localStorage is unavailable, generates an ephemeral in-memory id.
 *
 * Storage and uuid are injectable for testability.
 */

const DEFAULT_STORAGE_KEY = 'drwyn:anon-id'

export interface UserIdSource {
  current(): string
  setUserId(newId: string | null): string
  isAnon(): boolean
}

type MinStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface CreateUserIdSourceOptions {
  storage?: MinStorage
  storageKey?: string
  uuid?: () => string
}

function defaultUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: not cryptographically strong, but our anon id doesn't need to be.
  return `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

function resolveStorage(opt: MinStorage | undefined): MinStorage | null {
  if (opt) return opt
  if (typeof globalThis === 'undefined') return null
  const ls = (globalThis as { localStorage?: Storage }).localStorage
  return ls ?? null
}

export function createUserIdSource(opts: CreateUserIdSourceOptions = {}): UserIdSource {
  const storage = resolveStorage(opts.storage)
  const storageKey = opts.storageKey ?? DEFAULT_STORAGE_KEY
  const uuid = opts.uuid ?? defaultUuid

  let anonId: string
  if (storage) {
    const persisted = storage.getItem(storageKey)
    if (persisted) {
      anonId = persisted
    } else {
      anonId = uuid()
      storage.setItem(storageKey, anonId)
    }
  } else {
    // No storage available — ephemeral in-memory anon for this session only.
    anonId = uuid()
  }

  let override: string | null = null

  return {
    current() {
      return override ?? anonId
    },
    setUserId(newId) {
      override = newId
      return override ?? anonId
    },
    isAnon() {
      return override === null
    },
  }
}
