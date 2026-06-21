/**
 * Canonical module augmentation for `@drwyn/react`'s plugin and services registries.
 *
 * Importing this module (as a side-effect from `index.ts`) registers the
 * `capture` plugin's `capture` prop on `<Action>` and registers `SnapshotStore`
 * as the type of `services.snapshots` on the `ActionServicesRegistry`.
 *
 * Consumers do not need to import this file directly — `import '@drwyn/store'`
 * is sufficient to pick up the augmentation.
 */

import type { capture } from './plugins/capture-plugin'
import type { SnapshotStore } from './types'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    capture: typeof capture
  }
  interface ActionServicesRegistry {
    snapshots: SnapshotStore
  }
}
