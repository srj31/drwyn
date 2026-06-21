/** A point-in-time snapshot of captured values. */
export type Snapshot = Record<string, unknown>

/**
 * Per-`<Action>` capture config. Either an object of values, or a function that
 * returns them when the action fires (preferred — reads fresh state).
 */
export type CaptureConfig = Snapshot | (() => Snapshot)

/** The slice of plugin context the store needs to record a snapshot. */
export interface RecordContext {
  instanceId: string
  actionName?: string | undefined
}

export interface SnapshotStore {
  /**
   * Merge central getters + live contributors + the per-action config into one
   * point-in-time snapshot, store it, and return it. Called by the `capture`
   * plugin on click/submit.
   */
  record(ctx: RecordContext, perActionCapture?: CaptureConfig): Snapshot
  /** The snapshot most recently recorded for a given `<Action>` instance. */
  peek(instanceId: string): Snapshot | undefined
  /** The most recent snapshot recorded for a named action. */
  last(actionName: string): Snapshot | undefined
  /** Recent snapshots for a named action (oldest → newest), capped by `maxPerAction`. */
  history(actionName: string): readonly Snapshot[]
  /** Subscribe to new snapshots for a named action. Returns an unsubscribe fn. */
  subscribe(actionName: string, listener: () => void): () => void
  /** Register a live value contributor. Returns an unregister fn. */
  registerContributor(key: string, getter: () => unknown): () => void
}

export interface CreateSnapshotStoreOptions {
  /** Ambient getters read on every action, e.g. `{ route: () => location.pathname }`. */
  capture?: Record<string, () => unknown>
  /** Max snapshots retained per action name (ring buffer). Default 25. */
  maxPerAction?: number
}
