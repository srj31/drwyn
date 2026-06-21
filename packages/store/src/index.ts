// Side-effect: augments @drwyn/react module declarations
// (ActionPluginRegistry + ActionServicesRegistry).
import './registry'

export { capture } from './plugins/capture-plugin'
export { createSnapshotStore } from './store/snapshot-store'
export { useDrwynCapture } from './hooks/use-capture'
export { useDrwynSnapshot } from './hooks/use-snapshot'

export type {
  CaptureConfig,
  CreateSnapshotStoreOptions,
  RecordContext,
  Snapshot,
  SnapshotStore,
} from './types'
