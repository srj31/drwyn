export type VisibilityThreshold = 0 | 0.25 | 0.5 | 1
type Callback = (visible: boolean) => void

type ObserverFactory = (
  cb: IntersectionObserverCallback,
  opts: IntersectionObserverInit,
) => IntersectionObserver

let factory: ObserverFactory = (cb, opts) => new IntersectionObserver(cb, opts)

const pools = new Map<
  VisibilityThreshold,
  { observer: IntersectionObserver; callbacks: WeakMap<Element, Callback> }
>()

function getPool(threshold: VisibilityThreshold) {
  let pool = pools.get(threshold)
  if (pool) return pool

  const callbacks = new WeakMap<Element, Callback>()
  const observer = factory(
    (entries) => {
      for (const entry of entries) {
        const cb = callbacks.get(entry.target)
        if (cb) cb(entry.isIntersecting)
      }
    },
    { threshold },
  )
  pool = { observer, callbacks }
  pools.set(threshold, pool)
  return pool
}

export function observe(el: Element, threshold: VisibilityThreshold, cb: Callback): void {
  const pool = getPool(threshold)
  pool.callbacks.set(el, cb)
  pool.observer.observe(el)
}

export function unobserve(el: Element, threshold: VisibilityThreshold): void {
  const pool = pools.get(threshold)
  if (!pool) return
  pool.callbacks.delete(el)
  pool.observer.unobserve(el)
}

export function __setObserverFactoryForTests(f: ObserverFactory): void {
  factory = f
}

export function __resetPoolForTests(): void {
  for (const pool of pools.values()) pool.observer.disconnect()
  pools.clear()
}
