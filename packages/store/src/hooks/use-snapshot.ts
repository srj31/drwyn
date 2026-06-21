import { useActionRuntime } from '@drwyn/react'
import { useCallback, useSyncExternalStore } from 'react'
import { getSnapshotsService } from '../snapshots-service'
import type { Snapshot } from '../types'

const EMPTY_UNSUBSCRIBE = () => {}
const SERVER_SNAPSHOT = () => undefined

/**
 * Reactively read the most recent snapshot recorded for `actionName`.
 * Re-renders when a new snapshot for that action is recorded.
 */
export function useDrwynSnapshot(actionName: string): Snapshot | undefined {
  const { services } = useActionRuntime()
  const store = getSnapshotsService(services)

  const subscribe = useCallback(
    (onChange: () => void) => store?.subscribe(actionName, onChange) ?? EMPTY_UNSUBSCRIBE,
    [store, actionName],
  )
  const getSnapshot = useCallback(() => store?.last(actionName), [store, actionName])

  return useSyncExternalStore(subscribe, getSnapshot, SERVER_SNAPSHOT)
}
