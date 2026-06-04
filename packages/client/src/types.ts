export interface DrwynClientOptions {
  projectKey: string
  cloudUrl?: string
}

export interface EventInput {
  userId: string
  name: string
  props?: Record<string, unknown>
  timestamp?: number
}

export type MemoryValue =
  | string
  | number
  | boolean
  | null
  | MemoryValue[]
  | { [key: string]: MemoryValue }
