/**
 * Canonical module augmentation for `@drwyn/react`'s plugin and services registries.
 *
 * Importing this module (as a side-effect from `index.ts`) registers the
 * `memory` and `surface` plugins on the `ActionPluginRegistry` and registers
 * `MemoryStore` as the type of `services.memory` on the `ActionServicesRegistry`.
 *
 * Consumers do not need to import this file directly — `import '@drwyn/memory'`
 * is sufficient to pick up the augmentation.
 */

import type { MemoryStore } from './types'
import type { memory } from './plugins/memory-plugin'
import type { surface } from './plugins/surface-plugin'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    memory: typeof memory
    surface: typeof surface
  }
  interface ActionServicesRegistry {
    memory: MemoryStore
  }
}
