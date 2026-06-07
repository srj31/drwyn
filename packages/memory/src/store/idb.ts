/**
 * Minimal Promise-wrapped IndexedDB helper.
 *
 * Scope: only what MemoryStore needs — open with schema, put/get/getAll/delete on
 * named stores. ~60 LOC, zero runtime deps. If we ever need transactions across
 * multiple stores or migrations beyond v1, swap in `idb` (the package) — every
 * caller goes through this module's exports.
 */

export const DB_NAME = 'drwyn-memory'
export const DB_VERSION = 1

export type StoreName = 'action_uses' | 'meta'

export function openDB(name: string = DB_NAME, version: number = DB_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('action_uses')) {
        db.createObjectStore('action_uses')
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function closeDB(db: IDBDatabase): void {
  db.close()
}

export function putRecord<T>(
  db: IDBDatabase,
  store: StoreName,
  key: string,
  value: T,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function getRecord<T>(
  db: IDBDatabase,
  store: StoreName,
  key: string,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? undefined)
    req.onerror = () => reject(req.error)
  })
}

export function getAll<T>(db: IDBDatabase, store: StoreName): Promise<Array<[string, T]>> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const objStore = tx.objectStore(store)
    const out: Array<[string, T]> = []
    const cursorReq = objStore.openCursor()
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        out.push([cursor.key as string, cursor.value as T])
        cursor.continue()
      } else {
        resolve(out)
      }
    }
    cursorReq.onerror = () => reject(cursorReq.error)
  })
}

export function deleteRecord(db: IDBDatabase, store: StoreName, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
