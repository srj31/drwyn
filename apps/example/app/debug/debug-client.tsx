'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getMemoryStore } from '@/lib/drwyn'
import { NAV_ITEMS } from '@/lib/nav-config'
import { DebugTable, type DebugRow } from '@/components/debug-table'

const TOP_LEVEL_ACTIONS = ['pricing-cta', 'tour-dismiss'] as const

function getKnownActionNames(): string[] {
  return [...TOP_LEVEL_ACTIONS, ...NAV_ITEMS.map((item) => `nav-${item.slug}`)]
}

export function DebugClient() {
  const [ready, setReady] = useState(false)
  const [rows, setRows] = useState<DebugRow[]>([])
  const [resetting, setResetting] = useState(false)
  const knownActions = useMemo(() => getKnownActionNames(), [])

  useEffect(() => {
    let cancelled = false
    const store = getMemoryStore()
    store.ready.then(() => {
      if (cancelled) return
      setReady(true)
      setRows(
        knownActions.map((name) => ({
          name,
          uses: store.uses(name),
          lastSeenMs: store.lastSeen(name),
        })),
      )
    })
    return () => {
      cancelled = true
    }
  }, [knownActions])

  const handleReset = async () => {
    setResetting(true)
    try {
      // 1. Clear localStorage anon id so the next session is a fresh user.
      try {
        localStorage.removeItem('drwyn:anon-id')
      } catch {
        // localStorage may be unavailable in private mode; ignore.
      }
      // 2. Delete the IDB database. The MemoryStore may hold an open handle —
      //    deletion fires "blocked" until it's closed. We can't directly close
      //    the singleton's connection from here, so we request the delete and
      //    reload regardless. The reload tears down the singleton + connection.
      await new Promise<void>((resolve) => {
        let resolved = false
        const finish = () => {
          if (resolved) return
          resolved = true
          resolve()
        }
        try {
          const req = indexedDB.deleteDatabase('drwyn-memory')
          req.onsuccess = finish
          req.onerror = finish
          req.onblocked = finish
          // Hard timeout: if neither event fires in 750ms, bail and reload.
          setTimeout(finish, 750)
        } catch {
          finish()
        }
      })
      // 3. Reload — closes the singleton, drops the connection, fresh session.
      window.location.reload()
    } catch (err) {
      // eslint-disable-next-line no-console -- intentional dev visibility on failure
      console.error('[drwyn:debug] reset failed', err)
      setResetting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline">
          ← back home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">memory debug</h1>
        <p className="text-sm text-fg-muted">
          Per-action use counts from the local{' '}
          <code className="rounded bg-surface-2 px-1">MemoryStore</code>. Clicks are recorded
          synchronously to IndexedDB and debounced to cloud after 5s. Adaptation appears on the
          next route mount — try clicking widgets on the home page, then refresh this page.
        </p>
      </header>

      {!ready ? (
        <p className="text-sm text-fg-muted">loading…</p>
      ) : (
        <DebugTable rows={rows} />
      )}

      <section className="rounded-lg border border-white/10 bg-surface-1 p-4">
        <h2 className="text-sm font-semibold">Reset</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Clears the anon id + local memory + reloads. Cloud state (if any) is not touched —
          a fresh anon id sees a fresh cloud row.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {resetting ? 'resetting…' : 'reset memory'}
        </button>
      </section>

      <p className="text-xs text-fg-muted">
        Known limitation: this lists known action names from the widget config. A future{' '}
        <code className="rounded bg-surface-2 px-1">MemoryStore.entries()</code> would enumerate
        everything in IDB.
      </p>
    </main>
  )
}
