import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { closeDB, deleteRecord, getAll, getRecord, openDB, putRecord } from '../src/store/idb'

// Each test uses a unique DB name to keep tests isolated.
let dbName: string

beforeEach(() => {
  dbName = `drwyn-test-${Math.random().toString(36).slice(2)}`
})

afterEach(async () => {
  // Cleanup: close any open handles and delete the DB.
  // (Implementation detail — the wrapper should expose closeDB.)
  // Use indexedDB.deleteDatabase directly here if simpler:
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(dbName)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
})

describe('idb wrapper', () => {
  it('opens a DB and creates action_uses and meta stores on first open', async () => {
    const db = await openDB(dbName, 1)
    expect(Array.from(db.objectStoreNames)).toEqual(
      expect.arrayContaining(['action_uses', 'meta']),
    )
    closeDB(db)
  })

  it('puts and gets records from action_uses', async () => {
    const db = await openDB(dbName, 1)
    await putRecord(db, 'action_uses', 'cta-primary', { count: 3, lastSeenMs: 1234 })
    const got = await getRecord<{ count: number; lastSeenMs: number }>(
      db,
      'action_uses',
      'cta-primary',
    )
    expect(got).toEqual({ count: 3, lastSeenMs: 1234 })
    closeDB(db)
  })

  it('returns undefined for missing keys', async () => {
    const db = await openDB(dbName, 1)
    const got = await getRecord(db, 'action_uses', 'never-set')
    expect(got).toBeUndefined()
    closeDB(db)
  })

  it('getAll returns every record in a store as [key, value] tuples', async () => {
    const db = await openDB(dbName, 1)
    await putRecord(db, 'action_uses', 'a', { count: 1, lastSeenMs: 1 })
    await putRecord(db, 'action_uses', 'b', { count: 2, lastSeenMs: 2 })
    const all = await getAll<{ count: number; lastSeenMs: number }>(db, 'action_uses')
    // Sort to make assertion stable.
    expect(all.sort(([a], [b]) => a.localeCompare(b))).toEqual([
      ['a', { count: 1, lastSeenMs: 1 }],
      ['b', { count: 2, lastSeenMs: 2 }],
    ])
    closeDB(db)
  })

  it('deleteRecord removes a record', async () => {
    const db = await openDB(dbName, 1)
    await putRecord(db, 'action_uses', 'gone', { count: 1, lastSeenMs: 1 })
    await deleteRecord(db, 'action_uses', 'gone')
    const got = await getRecord(db, 'action_uses', 'gone')
    expect(got).toBeUndefined()
    closeDB(db)
  })

  it('meta store supports arbitrary value types', async () => {
    const db = await openDB(dbName, 1)
    await putRecord(db, 'meta', 'anonUserId', { value: 'abc-123' })
    await putRecord(db, 'meta', 'migrated', { value: true })
    expect(await getRecord(db, 'meta', 'anonUserId')).toEqual({ value: 'abc-123' })
    expect(await getRecord(db, 'meta', 'migrated')).toEqual({ value: true })
    closeDB(db)
  })

  it('reopening the same DB preserves data across opens', async () => {
    let db = await openDB(dbName, 1)
    await putRecord(db, 'action_uses', 'persistent', { count: 7, lastSeenMs: 99 })
    closeDB(db)
    db = await openDB(dbName, 1)
    expect(await getRecord(db, 'action_uses', 'persistent')).toEqual({
      count: 7,
      lastSeenMs: 99,
    })
    closeDB(db)
  })
})
