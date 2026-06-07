/**
 * MemoryStore factory — IndexedDB-backed local memory with an in-memory mirror.
 *
 * Reads (uses, lastSeen) are synchronous against the in-memory map.
 * record() is sync-void: it mutates the map immediately and fires an
 * unawaited IDB put. Persistence failures are non-fatal — the in-memory
 * mirror remains authoritative for the current session.
 *
 * Per-user isolation is achieved with composite keys: `${userId}::${actionName}`.
 *
 * Note: `record()` calls issued BEFORE `ready` resolves will mutate the
 * in-memory map but will NOT persist (db is still null). Callers should
 * await `ready` before recording. P2.12 will revisit setUserId to add the
 * reload + cloud migration; for P2.10 it only delegates to the userId source.
 */

import { getAll, openDB, putRecord, type StoreName } from './idb'
import { createUserIdSource, type UserIdSource } from './user-id'
import type { MemoryStore } from '../types'

const ACTION_USES: StoreName = 'action_uses'

interface ActionUseRow {
  count: number
  lastSeenMs: number
}

export interface CreateMemoryStoreOptions {
  dbName?: string
  userId?: UserIdSource
  now?: () => number
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

export function createMemoryStore(opts: CreateMemoryStoreOptions = {}): MemoryStore {
  const userIdSource = opts.userId ?? createUserIdSource()
  const now = opts.now ?? Date.now
  const map = new Map<string, ActionUseRow>()
  let db: IDBDatabase | null = null

  const ready = (async () => {
    db = await openDB(opts.dbName)
    const all = await getAll<ActionUseRow>(db, ACTION_USES)
    const currentUser = userIdSource.current()
    for (const [key, value] of all) {
      const parsed = parseKey(key)
      if (parsed && parsed.userId === currentUser) {
        map.set(parsed.actionName, value)
      }
    }
  })()

  function record(actionName: string): void {
    const existing = map.get(actionName)
    const next: ActionUseRow = existing
      ? { count: existing.count + 1, lastSeenMs: now() }
      : { count: 1, lastSeenMs: now() }
    map.set(actionName, next)
    // Fire-and-forget IDB write under the composite key. If `db` hasn't
    // resolved yet (record called before `ready`), the write is skipped —
    // documented contract.
    if (db) {
      const userId = userIdSource.current()
      void putRecord(db, ACTION_USES, compositeKey(userId, actionName), next).catch(() => {
        // Persistence failure is non-fatal for v1.
      })
    }
  }

  return {
    uses: (name) => map.get(name)?.count ?? 0,
    lastSeen: (name) => map.get(name)?.lastSeenMs ?? null,
    record,
    setUserId: (newId) => {
      userIdSource.setUserId(newId)
      // Full migration / reload is P2.12; no-op on local map for now.
    },
    ready,
  }
}
