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
