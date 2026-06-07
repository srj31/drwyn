'use client'

import { Action } from '@drwyn/react'
import { SurfaceShell } from './surface-shell'

export function PricingCta() {
  return (
    <Action
      name="pricing-cta"
      surface={{ defaultVisibility: 'collapsed', promoteAfter: 5, collapseUntil: 0 }}
    >
      {(visibility) => (
        <SurfaceShell
          visibility={visibility}
          collapsed={<CollapsedPill />}
          full={<FullHero />}
        />
      )}
    </Action>
  )
}

function CollapsedPill() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-white/10 hover:text-fg"
    >
      <span className="size-2 rounded-full bg-accent" />
      see pricing →
    </button>
  )
}

function FullHero() {
  return (
    <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/15 via-surface-1 to-surface-1 p-8 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Pro</p>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">most clicked</span>
      </div>
      <h3 className="mt-3 text-3xl font-bold">$29 / month</h3>
      <p className="mt-2 text-sm text-fg-muted">
        Everything in Hobby plus cloud-synced memory + adaptation observatory.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li className="flex items-center gap-2"><Check /> 500k events / month</li>
        <li className="flex items-center gap-2"><Check /> 90-day event retention</li>
        <li className="flex items-center gap-2"><Check /> Unlimited cloud memory</li>
        <li className="flex items-center gap-2"><Check /> Every new adaptive primitive</li>
      </ul>
      <button
        type="button"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow transition hover:opacity-90"
      >
        Start Pro trial
      </button>
    </div>
  )
}

function Check() {
  return (
    <svg className="size-4 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.79-6.79a1 1 0 011.414 0z" />
    </svg>
  )
}
