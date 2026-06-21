import type { SnapshotStore } from './types'

/**
 * Read the optional `snapshots` service from a services registry, loosely typed
 * so consumers (and the analytics plugin) need not depend on this package.
 */
export function getSnapshotsService(services: unknown): SnapshotStore | undefined {
  return (services as { snapshots?: SnapshotStore | undefined }).snapshots
}
