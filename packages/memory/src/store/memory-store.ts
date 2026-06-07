/**
 * MemoryStore factory — IndexedDB-backed local memory with an in-memory mirror
 * and an optional debounced cloud syncer.
 *
 * Reads (uses, lastSeen) are synchronous against the in-memory map.
 * record() is sync-void: it mutates the map immediately and fires an
 * unawaited IDB put. Persistence failures are non-fatal — the in-memory
 * mirror remains authoritative for the current session.
 *
 * Per-user isolation is achieved with composite keys: `${userId}::${actionName}`.
 *
 * Cloud sync (when a `cloud` client is provided):
 * - On construction, after the IDB load, we `pull(userId)` from the cloud and merge
 *   per action via max(count) and max(lastSeenMs). Merged rows are persisted back to
 *   IDB so cloud-only entries land locally. `ready` resolves AFTER this completes.
 * - Each `record()` schedules a debounced cloud push of the current snapshot.
 * - `setUserId(newId)` runs the anon→authed migration:
 *     1) snapshots the current (old-userId) local map,
 *     2) updates the user-id source,
 *     3) schedules a cloud push of the snapshot under the NEW userId,
 *     4) pulls and merges the new userId's cloud state into the local map.
 * - On `pagehide` / `visibilitychange === 'hidden'` (browser only), we force-flush.
 *
 * Note: `record()` calls issued BEFORE `ready` resolves will mutate the
 * in-memory map but will NOT persist (db is still null). Callers should
 * await `ready` before recording.
 */

import { getAll, openDB, putRecord, type StoreName } from './idb'
import { createUserIdSource, type UserIdSource } from './user-id'
import {
  createCloudSync,
  type CloudClient,
  type CloudSync,
  type UsesMap,
} from './cloud-sync'
import type { MemoryStore } from '../types'

const ACTION_USES: StoreName = 'action_uses'

interface ActionUseRow {
  count: number
  lastSeenMs: number
}

type LifecycleTarget = {
  addEventListener: typeof addEventListener
  removeEventListener: typeof removeEventListener
}

export interface CreateMemoryStoreOptions {
  dbName?: string
  userId?: UserIdSource
  now?: () => number
  /**
   * Optional cloud client. When provided, the store pulls on construction,
   * schedules debounced pushes on each `record()`, and runs the anon→authed
   * migration on `setUserId(newId)`.
   */
  cloud?: CloudClient
  /** Debounce window for cloud pushes, ms. Default 5000. */
  cloudDebounceMs?: number
  // Test injection seams (intentionally undocumented for end-users):
  setTimeoutFn?: typeof setTimeout
  clearTimeoutFn?: typeof clearTimeout
  /**
   * Target for pagehide / visibilitychange listeners. Defaults to globalThis
   * when it exposes addEventListener. Pass `null` to disable.
   */
  pagehideTarget?: LifecycleTarget | null
}

function compositeKey(userId: string, actionName: string): string {
  return `${userId}::${actionName}`
}

function parseKey(key: string): { userId: string; actionName: string } | null {
  // Use indexOf rather than split so actionName may contain '::'.
  const sep = key.indexOf('::')
  if (sep === -1) return null
  return {
    userId: key.slice(0, sep),
    actionName: key.slice(sep + 2),
  }
}

function mapToObject(map: Map<string, ActionUseRow>): UsesMap {
  const out: UsesMap = {}
  for (const [k, v] of map) out[k] = v
  return out
}

function resolveLifecycleTarget(
  opt: LifecycleTarget | null | undefined,
): LifecycleTarget | null {
  if (opt === null) return null
  if (opt) return opt
  if (typeof globalThis === 'undefined') return null
  const g = globalThis as unknown as Partial<LifecycleTarget>
  if (typeof g.addEventListener !== 'function' || typeof g.removeEventListener !== 'function') {
    return null
  }
  return g as LifecycleTarget
}

export function createMemoryStore(opts: CreateMemoryStoreOptions = {}): MemoryStore {
  const userIdSource = opts.userId ?? createUserIdSource()
  const now = opts.now ?? Date.now
  const map = new Map<string, ActionUseRow>()
  let db: IDBDatabase | null = null

  const cloudSync: CloudSync | null = (() => {
    if (!opts.cloud) return null
    // With exactOptionalPropertyTypes, we cannot pass `undefined` for optional
    // properties — build the options object conditionally.
    const cloudOpts: import('./cloud-sync').CreateCloudSyncOptions = { client: opts.cloud }
    if (opts.cloudDebounceMs !== undefined) cloudOpts.debounceMs = opts.cloudDebounceMs
    if (opts.setTimeoutFn !== undefined) cloudOpts.setTimeoutFn = opts.setTimeoutFn
    if (opts.clearTimeoutFn !== undefined) cloudOpts.clearTimeoutFn = opts.clearTimeoutFn
    return createCloudSync(cloudOpts)
  })()

  // Lifecycle listeners: flush pending cloud writes on pagehide / hidden visibility.
  const lifecycleTarget = cloudSync ? resolveLifecycleTarget(opts.pagehideTarget) : null

  const onPagehide = (): void => {
    if (cloudSync) void cloudSync.flush()
  }
  const onVisibility = (): void => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden' &&
      cloudSync
    ) {
      void cloudSync.flush()
    }
  }

  if (cloudSync && lifecycleTarget) {
    lifecycleTarget.addEventListener('pagehide', onPagehide)
    lifecycleTarget.addEventListener('visibilitychange', onVisibility)
  }

  async function loadLocal(): Promise<void> {
    if (!db) return
    const all = await getAll<ActionUseRow>(db, ACTION_USES)
    const currentUser = userIdSource.current()
    for (const [key, value] of all) {
      const parsed = parseKey(key)
      if (parsed && parsed.userId === currentUser) {
        map.set(parsed.actionName, value)
      }
    }
  }

  async function pullAndMerge(userId: string): Promise<void> {
    if (!cloudSync) return
    const cloud = await cloudSync.pull(userId)
    if (!cloud) return
    for (const [name, cloudRow] of Object.entries(cloud)) {
      const localRow = map.get(name)
      const merged: ActionUseRow = {
        count: Math.max(localRow?.count ?? 0, cloudRow.count),
        lastSeenMs: Math.max(localRow?.lastSeenMs ?? 0, cloudRow.lastSeenMs),
      }
      map.set(name, merged)
      if (db) {
        try {
          await putRecord(db, ACTION_USES, compositeKey(userId, name), merged)
        } catch {
          // Persistence failure is non-fatal — in-memory map remains authoritative.
        }
      }
    }
  }

  const ready = (async () => {
    db = await openDB(opts.dbName)
    await loadLocal()
    await pullAndMerge(userIdSource.current())
  })()

  function record(actionName: string): void {
    const existing = map.get(actionName)
    const next: ActionUseRow = existing
      ? { count: existing.count + 1, lastSeenMs: now() }
      : { count: 1, lastSeenMs: now() }
    map.set(actionName, next)

    const userId = userIdSource.current()
    // Fire-and-forget IDB write under the composite key. If `db` hasn't
    // resolved yet (record called before `ready`), the write is skipped —
    // documented contract.
    if (db) {
      void putRecord(db, ACTION_USES, compositeKey(userId, actionName), next).catch(() => {
        // Persistence failure is non-fatal for v1.
      })
    }
    // Schedule a debounced cloud push of the full snapshot.
    if (cloudSync) {
      cloudSync.schedule(userId, mapToObject(map))
    }
  }

  function setUserId(newId: string | null): void {
    const prevId = userIdSource.current()
    const snapshot = mapToObject(map)
    userIdSource.setUserId(newId)
    const nextId = userIdSource.current()
    if (nextId === prevId) return // no identity change → no migration

    if (cloudSync) {
      // 1) Push the previous user's snapshot up under the NEW userId
      //    (anon → authed migration). Fire-and-forget; the debounced syncer
      //    will flush it (or a manual flush() will).
      cloudSync.schedule(nextId, snapshot)
      // 2) Pull and merge the new userId's prior cloud state into the local map.
      //    Persisted rows land under the NEW composite key.
      void pullAndMerge(nextId).catch(() => {
        // Non-fatal; in-memory map remains authoritative.
      })
    }
  }

  return {
    uses: (name) => map.get(name)?.count ?? 0,
    lastSeen: (name) => map.get(name)?.lastSeenMs ?? null,
    record,
    setUserId,
    ready,
    flush: async () => {
      if (cloudSync) await cloudSync.flush()
    },
  }
}
