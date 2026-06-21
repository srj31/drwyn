'use client'

import { Action } from '@drwyn/react'
import { useDrwynCapture, useDrwynSnapshot } from '@drwyn/store'
import { useState } from 'react'

/**
 * Demonstrates all three capture surfaces feeding one snapshot:
 *  - central getter `route` (set on the store in lib/drwyn.ts)
 *  - `useDrwynCapture('qty', …)` — this component's local state
 *  - per-`<Action>` `capture` prop — `sku`
 *
 * The snapshot is both queryable (useDrwynSnapshot) and merged into the
 * `add_to_cart` track event sent to the analytics sink.
 */
export function CaptureDemo() {
  const [qty, setQty] = useState(1)

  // Contribute component-local state to every snapshot while mounted.
  useDrwynCapture('qty', () => qty)

  // Reactively read the latest snapshot recorded for this action.
  const last = useDrwynSnapshot('add-to-cart')

  return (
    <div className="rounded-xl border border-white/10 bg-surface-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-fg-muted">Quantity</span>
        <div className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
          <button
            type="button"
            aria-label="decrease"
            className="text-fg-muted hover:text-fg"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            aria-label="increase"
            className="text-fg-muted hover:text-fg"
            onClick={() => setQty((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      <Action
        name="add-to-cart"
        track={{ click: 'add_to_cart' }}
        capture={() => ({ sku: 'TSHIRT-01' })}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow transition hover:opacity-90"
        >
          Add {qty} to cart
        </button>
      </Action>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Last captured snapshot
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-fg-muted">
          {last ? JSON.stringify(last, null, 2) : 'Click "Add to cart" to capture a snapshot.'}
        </pre>
      </div>
    </div>
  )
}
