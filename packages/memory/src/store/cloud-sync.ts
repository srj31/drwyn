/**
 * Debounced cloud syncer for MemoryStore.
 *
 * Semantics:
 * - schedule(userId, snapshot) stores the latest snapshot keyed by userId and
 *   (re)sets a debounce timer. Multiple schedules within the window collapse.
 * - schedule for a NEW userId flushes the previous userId's pending snapshot
 *   synchronously before starting the new debounce — prevents userId A writes
 *   from leaking to userId B's cloud key during identity transitions.
 * - flush() forces an immediate write of any pending snapshots.
 * - setMemory failures are non-fatal; onError gets the err. Local map is the
 *   source of truth.
 */

const DEFAULT_DEBOUNCE_MS = 5000
const MEMORY_KEY = 'uses'

export interface CloudClient {
  getMemory(userId: string, key: string): Promise<unknown>
  setMemory(userId: string, key: string, value: unknown): Promise<void>
}

export type UsesMap = Record<string, { count: number; lastSeenMs: number }>

export interface CloudSync {
  pull(userId: string): Promise<UsesMap | null>
  schedule(userId: string, snapshot: UsesMap): void
  flush(): Promise<void>
  dispose(): void
}

export interface CreateCloudSyncOptions {
  client: CloudClient
  debounceMs?: number
  setTimeoutFn?: typeof setTimeout
  clearTimeoutFn?: typeof clearTimeout
  onError?: (err: unknown) => void
}

export function createCloudSync(opts: CreateCloudSyncOptions): CloudSync {
  const client = opts.client
  const debounceMs = opts.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const setTimeoutFn = opts.setTimeoutFn ?? setTimeout
  const clearTimeoutFn = opts.clearTimeoutFn ?? clearTimeout
  const onError = opts.onError ?? (() => {})

  // Pending write state.
  let pendingUserId: string | null = null
  let pendingSnapshot: UsesMap | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeoutFn(timer)
      timer = null
    }
  }

  function writeNow(userId: string, snapshot: UsesMap): Promise<void> {
    return client.setMemory(userId, MEMORY_KEY, snapshot).catch((err) => {
      onError(err)
    })
  }

  function flushPending(): Promise<void> {
    clearTimer()
    if (pendingUserId === null || pendingSnapshot === null) {
      return Promise.resolve()
    }
    const userId = pendingUserId
    const snapshot = pendingSnapshot
    pendingUserId = null
    pendingSnapshot = null
    return writeNow(userId, snapshot)
  }

  return {
    async pull(userId) {
      try {
        const v = await client.getMemory(userId, MEMORY_KEY)
        return (v as UsesMap | null) ?? null
      } catch (err) {
        onError(err)
        return null
      }
    },

    schedule(userId, snapshot) {
      if (disposed) return
      // If switching userId mid-debounce, flush the previous user's pending write first
      // (fire-and-forget — onError catches; we don't await here).
      if (pendingUserId !== null && pendingUserId !== userId && pendingSnapshot !== null) {
        const prevUser = pendingUserId
        const prevSnap = pendingSnapshot
        pendingUserId = null
        pendingSnapshot = null
        clearTimer()
        void writeNow(prevUser, prevSnap)
      }
      pendingUserId = userId
      pendingSnapshot = snapshot
      clearTimer()
      timer = setTimeoutFn(() => {
        timer = null
        void flushPending()
      }, debounceMs)
    },

    flush() {
      return flushPending()
    },

    dispose() {
      disposed = true
      clearTimer()
      pendingUserId = null
      pendingSnapshot = null
    },
  }
}
