'use client'

import { memory, surface } from '@drwyn/memory'
import { ActionProvider } from '@drwyn/react'
// `analytics` is exported from the `./plugins` subpath barrel (not the main
// entry — main entry only side-effect imports it to install the registry type
// augmentation). `memory` and `surface` come from `@drwyn/memory`.
import { analytics } from '@drwyn/react/plugins'
// `capture` records a snapshot of surrounding values when an action fires. It
// must be registered BEFORE `analytics` so the snapshot exists when analytics
// enriches its track event.
import { capture } from '@drwyn/store'
import type { ReactNode } from 'react'

import { analyticsSink } from '@/lib/analytics-sink'
import { getMemoryStore, getSnapshotStore } from '@/lib/drwyn'

const flagSource = { isOn: () => undefined }

export function Providers({ children }: { children: ReactNode }) {
  const memoryStore = getMemoryStore()
  const snapshots = getSnapshotStore()

  return (
    <ActionProvider
      plugins={[capture, memory, surface, analytics]}
      services={{
        snapshots,
        memory: memoryStore,
        sink: analyticsSink,
        flagSource,
        logger: console,
      }}
    >
      {children}
    </ActionProvider>
  )
}
