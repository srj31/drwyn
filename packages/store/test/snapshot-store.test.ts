import { describe, expect, it } from 'vitest'
import { createSnapshotStore } from '../src/store/snapshot-store'

describe('createSnapshotStore — merge precedence', () => {
  it('merges central < contributor < per-action (most specific wins)', () => {
    const store = createSnapshotStore({
      capture: { a: () => 'central-a', b: () => 'central-b' },
    })
    store.registerContributor('b', () => 'contrib-b')
    store.registerContributor('c', () => 'contrib-c')

    const snap = store.record({ instanceId: 'i1', actionName: 'act' }, { c: 'pa-c', d: 'pa-d' })

    expect(snap).toEqual({ a: 'central-a', b: 'contrib-b', c: 'pa-c', d: 'pa-d' })
  })

  it('accepts a per-action capture function', () => {
    const store = createSnapshotStore()
    const snap = store.record({ instanceId: 'i', actionName: 'act' }, () => ({ e: 1 }))
    expect(snap.e).toBe(1)
  })

  it('records the ambient context with no per-action config', () => {
    const store = createSnapshotStore({ capture: { route: () => '/home' } })
    const snap = store.record({ instanceId: 'i', actionName: 'act' })
    expect(snap).toEqual({ route: '/home' })
  })
})

describe('createSnapshotStore — point-in-time clone', () => {
  it('freezes nested values at record time (later mutation does not leak)', () => {
    const obj = { nested: { count: 1 } }
    const store = createSnapshotStore()
    store.registerContributor('data', () => obj)

    const snap = store.record({ instanceId: 'i', actionName: 'a' })
    obj.nested.count = 99

    expect((snap.data as { nested: { count: number } }).nested.count).toBe(1)
    expect((store.last('a') as { data: { nested: { count: number } } }).data.nested.count).toBe(1)
  })
})

describe('createSnapshotStore — ring buffer', () => {
  it('keeps only the most recent maxPerAction snapshots per action', () => {
    const store = createSnapshotStore({ maxPerAction: 2 })
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 1 })
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 2 })
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 3 })

    expect(store.history('a').map((s) => s.n)).toEqual([2, 3])
    expect(store.last('a')?.n).toBe(3)
  })

  it('history is isolated from external mutation', () => {
    const store = createSnapshotStore()
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 1 })
    const h = store.history('a') as unknown as unknown[]
    h.push({ n: 999 })
    expect(store.history('a').length).toBe(1)
  })
})

describe('createSnapshotStore — peek + named/unnamed', () => {
  it('peek returns the current snapshot keyed by instanceId', () => {
    const store = createSnapshotStore()
    store.record({ instanceId: 'inst-1', actionName: 'a' }, { n: 1 })
    expect(store.peek('inst-1')?.n).toBe(1)
    expect(store.peek('nope')).toBeUndefined()
  })

  it('unnamed actions enrich (peek) but are not stored in history', () => {
    const store = createSnapshotStore()
    store.record({ instanceId: 'x', actionName: undefined }, { n: 5 })
    expect(store.peek('x')?.n).toBe(5)
    expect(store.history('a')).toEqual([])
    expect(store.last('a')).toBeUndefined()
  })

  it('last returns a stable reference between records', () => {
    const store = createSnapshotStore()
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 1 })
    expect(store.last('a')).toBe(store.last('a'))
  })
})

describe('createSnapshotStore — subscribe', () => {
  it('notifies subscribers of the matching action only', () => {
    const store = createSnapshotStore()
    let calls = 0
    const unsub = store.subscribe('a', () => {
      calls++
    })

    store.record({ instanceId: 'i', actionName: 'a' }, { n: 1 })
    expect(calls).toBe(1)

    store.record({ instanceId: 'i', actionName: 'b' }, { n: 1 })
    expect(calls).toBe(1)

    unsub()
    store.record({ instanceId: 'i', actionName: 'a' }, { n: 2 })
    expect(calls).toBe(1)
  })
})

describe('createSnapshotStore — contributor lifecycle', () => {
  it('stops including a contributor after it unregisters', () => {
    const store = createSnapshotStore()
    const unregister = store.registerContributor('qty', () => 7)
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBe(7)
    unregister()
    expect(store.record({ instanceId: 'i', actionName: 'a' }).qty).toBeUndefined()
  })
})
