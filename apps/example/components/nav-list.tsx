'use client'

import { Action } from '@drwyn/react'
import { NAV_ITEMS } from '@/lib/nav-config'
import { SurfaceShell } from './surface-shell'

export function NavList() {
  return (
    <nav aria-label="Demo navigation">
      <ul className="flex flex-wrap items-stretch gap-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.slug}>
            <Action name={`nav-${item.slug}`} surface={item.surface}>
              {(visibility) => (
                <SurfaceShell
                  visibility={visibility}
                  collapsed={<ChipCollapsed emoji={item.emoji} label={item.label} />}
                  full={<ChipFull emoji={item.emoji} label={item.label} description={item.description} />}
                />
              )}
            </Action>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ChipCollapsed({ emoji, label }: { emoji: string; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:border-white/20 hover:text-fg"
      title={label}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

function ChipFull({ emoji, label, description }: { emoji: string; label: string; description: string }) {
  return (
    <button
      type="button"
      className="flex max-w-xs flex-col items-start gap-1 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-left transition hover:bg-accent/10"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>{emoji}</span>
        <span>{label}</span>
      </div>
      <p className="text-xs text-fg-muted">{description}</p>
    </button>
  )
}
