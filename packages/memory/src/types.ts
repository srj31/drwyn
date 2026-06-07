export interface MemoryStore {
  uses(actionName: string): number
  lastSeen(actionName: string): number | null
  record(actionName: string): void
  setUserId(userId: string | null): void
  ready: Promise<void>
}
