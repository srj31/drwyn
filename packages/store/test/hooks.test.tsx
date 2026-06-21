import { ActionProvider } from '@drwyn/react'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useDrwynCapture } from '../src/hooks/use-capture'
import { useDrwynSnapshot } from '../src/hooks/use-snapshot'
import { createSnapshotStore } from '../src/store/snapshot-store'
import type { SnapshotStore } from '../src/types'

declare module '@drwyn/react' {
  interface ActionServicesRegistry {
    snapshots: SnapshotStore
  }
}

function wrapper(store: SnapshotStore) {
  return ({ children }: { children: ReactNode }) => (
    <ActionProvider
      plugins={[]}
      services={
        {
          snapshots: store,
          sink: () => {},
          flagSource: { isOn: () => undefined },
          logger: { warn: () => {}, error: () => {} },
        } as never
      }
    >
      {children}
    </ActionProvider>
  )
}

describe('useDrwynCapture', () => {
  it('contributes a value while mounted and stops after unmount', () => {
    const store = createSnapshotStore()
    const { unmount } = renderHook(() => useDrwynCapture('qty', () => 7), {
      wrapper: wrapper(store),
    })
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBe(7)
    unmount()
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBeUndefined()
  })

  it('reads the latest value at record time (raw value form)', () => {
    const store = createSnapshotStore()
    const { rerender } = renderHook(({ q }) => useDrwynCapture('qty', q), {
      wrapper: wrapper(store),
      initialProps: { q: 1 },
    })
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBe(1)
    rerender({ q: 42 })
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBe(42)
  })
})

describe('useDrwynSnapshot', () => {
  it('returns the last snapshot and re-renders on new records', () => {
    const store = createSnapshotStore()
    const { result } = renderHook(() => useDrwynSnapshot('a'), { wrapper: wrapper(store) })
    expect(result.current).toBeUndefined()

    act(() => {
      store.record({ instanceId: 'i', actionName: 'a' }, { n: 1 })
    })
    expect(result.current?.n).toBe(1)

    act(() => {
      store.record({ instanceId: 'i', actionName: 'a' }, { n: 2 })
    })
    expect(result.current?.n).toBe(2)
  })

  it('does not update for records of a different action', () => {
    const store = createSnapshotStore()
    const { result } = renderHook(() => useDrwynSnapshot('a'), { wrapper: wrapper(store) })
    act(() => {
      store.record({ instanceId: 'i', actionName: 'b' }, { n: 1 })
    })
    expect(result.current).toBeUndefined()
  })
})
