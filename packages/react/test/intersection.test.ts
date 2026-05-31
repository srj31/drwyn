import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetPoolForTests,
  __setObserverFactoryForTests,
  observe,
  unobserve,
} from '../src/plugin/intersection'

class FakeIO {
  callback: IntersectionObserverCallback
  options: IntersectionObserverInit
  observed = new Set<Element>()
  constructor(cb: IntersectionObserverCallback, opts: IntersectionObserverInit) {
    this.callback = cb
    this.options = opts
  }
  observe(el: Element) {
    this.observed.add(el)
  }
  unobserve(el: Element) {
    this.observed.delete(el)
  }
  disconnect() {
    this.observed.clear()
  }
  takeRecords() {
    return []
  }
  emit(entries: Array<{ target: Element; isIntersecting: boolean }>) {
    this.callback(
      entries.map(
        (e) =>
          ({
            ...e,
            intersectionRatio: e.isIntersecting ? 1 : 0,
          }) as any,
      ),
      this as unknown as IntersectionObserver,
    )
  }
}

describe('intersection pool', () => {
  let created: FakeIO[]

  beforeEach(() => {
    created = []
    __resetPoolForTests()
    __setObserverFactoryForTests((cb, opts) => {
      const io = new FakeIO(cb, opts)
      created.push(io)
      return io as unknown as IntersectionObserver
    })
  })

  it('shares one observer per threshold across observe() calls', () => {
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    observe(el1, 0.5, () => {})
    observe(el2, 0.5, () => {})
    expect(created.length).toBe(1)
    expect(created[0]!.observed.size).toBe(2)
  })

  it('creates separate observers for different thresholds', () => {
    observe(document.createElement('div'), 0.5, () => {})
    observe(document.createElement('div'), 0.25, () => {})
    expect(created.length).toBe(2)
  })

  it('dispatches callbacks with visibility flag', () => {
    const cb = vi.fn()
    const el = document.createElement('div')
    observe(el, 0.5, cb)
    created[0]!.emit([{ target: el, isIntersecting: true }])
    created[0]!.emit([{ target: el, isIntersecting: false }])
    expect(cb).toHaveBeenNthCalledWith(1, true)
    expect(cb).toHaveBeenNthCalledWith(2, false)
  })

  it('unobserve removes the element from the underlying observer', () => {
    const el = document.createElement('div')
    observe(el, 0.5, () => {})
    expect(created[0]!.observed.has(el)).toBe(true)
    unobserve(el, 0.5)
    expect(created[0]!.observed.has(el)).toBe(false)
  })
})
