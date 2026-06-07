'use client'

import type { ReactNode } from 'react'
import { ActionProvider } from '@drwyn/react'
// `analytics` is exported from the `./plugins` subpath barrel (not the main
// entry — main entry only side-effect imports it to install the registry type
// augmentation). `memory` and `surface` come from `@drwyn/memory`.
import { analytics } from '@drwyn/react/plugins'
import { memory, surface } from '@drwyn/memory'

import { analyticsSink } from '@/lib/analytics-sink'
import { getMemoryStore } from '@/lib/drwyn'

const flagSource = { isOn: () => undefined }

export function Providers({ children }: { children: ReactNode }) {
  const memoryStore = getMemoryStore()

  return (
    <ActionProvider
      plugins={[memory, surface, analytics]}
      services={{
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
