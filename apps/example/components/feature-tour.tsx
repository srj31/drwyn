'use client'

import { Action } from '@drwyn/react'
import { SurfaceShell } from './surface-shell'

export function FeatureTour() {
  return (
    <Action
      name="tour-dismiss"
      surface={{ defaultVisibility: 'full', hideAfter: 3, collapseUntil: 0, promoteAfter: 999 }}
    >
      {(visibility) => (
        <SurfaceShell
          visibility={visibility}
          collapsed={<Floater compact />}
          full={<Floater />}
        />
      )}
    </Action>
  )
}

function Floater({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${
        compact ? 'max-w-xs' : 'max-w-sm'
      } rounded-xl border border-white/10 bg-surface-1 p-4 shadow-2xl`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 rounded-full bg-accent" />
        <div className="flex-1">
          <p className="text-sm font-semibold">What&apos;s new — surface plugin</p>
          {!compact && (
            <p className="mt-1 text-xs text-fg-muted">
              Adaptive widgets are live. Click around — the pricing CTA promotes
              after 5 uses. Visit <code className="rounded bg-surface-2 px-1">/debug</code> to peek
              at memory.
            </p>
          )}
        </div>
        <button
          type="button"
          className="-mr-1 -mt-1 rounded p-1 text-fg-muted transition hover:bg-white/5 hover:text-fg"
          aria-label="Dismiss"
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
