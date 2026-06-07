// Side-effect: augments @drwyn/react module declarations
// (ActionPluginRegistry + ActionServicesRegistry).
import './registry'

export { memory } from './plugins/memory-plugin'
export { surface } from './plugins/surface-plugin'
export { createMemoryStore } from './store/memory-store'

export type { CreateMemoryStoreOptions } from './store/memory-store'
export type { CloudClient } from './store/cloud-sync'
export type { UserIdSource } from './store/user-id'
export type { MemoryStore, SurfaceConfig } from './types'

// Re-export for convenience (defined in @drwyn/react).
export type { SurfaceVisibility } from '@drwyn/react'
