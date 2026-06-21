import { useActionRuntime } from '@drwyn/react'
import { useEffect, useRef } from 'react'
import { devWarn } from '../dev-warn'
import { getSnapshotsService } from '../snapshots-service'

/**
 * Contribute a value to every snapshot while this component is mounted.
 *
 * `value` may be a raw value or a getter. Either way the latest value is read at
 * action time (the getter is backed by a ref updated on each render), so there's
 * no need to re-register when state changes.
 */
export function useDrwynCapture<T>(key: string, value: T | (() => T)): void {
  const { services } = useActionRuntime()
  const store = getSnapshotsService(services)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!store) {
      devWarn('useDrwynCapture: no `snapshots` service registered on ActionProvider.')
      return
    }
    return store.registerContributor(key, () => {
      const v = valueRef.current
      return typeof v === 'function' ? (v as () => T)() : v
    })
  }, [store, key])
}
