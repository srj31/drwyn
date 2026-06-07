import { DrwynClient } from '@drwyn/client'
import { createMemoryStore, type MemoryStore } from '@drwyn/memory'

const DEFAULT_API_URL = 'http://localhost:8000'

interface DrwynGlobals {
  __drwynClient?: DrwynClient
  __drwynMemory?: MemoryStore
  __drwynProjectKey?: string
}

const globalScope = globalThis as unknown as DrwynGlobals

function readProjectKey(): string {
  const key = process.env.NEXT_PUBLIC_DRWYN_PROJECT_KEY
  if (!key) {
    throw new Error(
      '[drwyn] NEXT_PUBLIC_DRWYN_PROJECT_KEY is not set. Copy apps/example/.env.example → .env.local and seed the project (apps/cloud/scripts/seed_example_project.py).',
    )
  }
  return key
}

/**
 * Lazily construct (and cache on globalThis) the singleton DrwynClient.
 *
 * Why a function instead of a module-level `const`: module-level construction
 * would throw at module-load time if env is missing, breaking `next build` in
 * CI. Lazy functions only throw at first call (after env is correctly inlined
 * for the runtime that called them).
 *
 * Why globalThis: Next 15 Fast Refresh / HMR re-evaluates modules in dev. A
 * file-scope `let` would be reset on each HMR cycle, multiplying clients and
 * memory listeners. globalThis is preserved across module re-evaluation.
 */
export function getDrwynClient(): DrwynClient {
  if (!globalScope.__drwynClient) {
    const projectKey = readProjectKey()
    const cloudUrl = process.env.NEXT_PUBLIC_DRWYN_API_URL || DEFAULT_API_URL
    globalScope.__drwynClient = new DrwynClient({ projectKey, cloudUrl })
    globalScope.__drwynProjectKey = projectKey
  }
  return globalScope.__drwynClient
}

/**
 * No-op MemoryStore used during SSR. The real store opens IndexedDB on
 * construction; calling it server-side raises `ReferenceError: indexedDB is
 * not defined`. Components that use memory only read it after hydration, so a
 * stub is safe for the initial server render — the real store replaces it on
 * the client.
 */
function createNoopMemoryStore(): MemoryStore {
  return {
    uses: () => 0,
    lastSeen: () => null,
    record: () => {},
    setUserId: () => {},
    ready: Promise.resolve(),
    flush: () => Promise.resolve(),
  }
}

export function getMemoryStore(): MemoryStore {
  // Server: return a no-op so SSR doesn't open IndexedDB. The provider
  // re-renders on the client and gets the real store.
  if (typeof window === 'undefined') {
    return createNoopMemoryStore()
  }
  if (!globalScope.__drwynMemory) {
    const client = getDrwynClient()
    globalScope.__drwynMemory = createMemoryStore({ cloud: client })
  }
  return globalScope.__drwynMemory
}
