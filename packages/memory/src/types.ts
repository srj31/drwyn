import type { SurfaceVisibility } from '@drwyn/react'

export interface MemoryStore {
  uses(actionName: string): number
  lastSeen(actionName: string): number | null
  record(actionName: string): void
  setUserId(userId: string | null): void
  ready: Promise<void>
  /**
   * Force any pending cloud writes to flush immediately.
   * No-op when the store was constructed without a `cloud` client.
   */
  flush(): Promise<void>
}

/**
 * Per-surface configuration for the `surface` plugin (P3.14–P3.16).
 *
 * Defaults: `promoteAfter: 5`, `collapseUntil: 3`. `hideAfter` is opt-in only.
 */
export interface SurfaceConfig {
  defaultVisibility: SurfaceVisibility
  promoteAfter?: number
  collapseUntil?: number
  hideAfter?: number
}
