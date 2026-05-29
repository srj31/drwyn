import type { MutableRefObject, Ref, RefCallback } from 'react'

type AnyRef<T> = Ref<T> | undefined

export function composeRefs<T>(...refs: Array<AnyRef<T>>): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (ref == null) continue
      if (typeof ref === 'function') {
        ;(ref as RefCallback<T>)(node)
      } else {
        ;(ref as MutableRefObject<T | null>).current = node
      }
    }
  }
}
