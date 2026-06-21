import { devWarn } from '../dev-warn'
import type {
  CaptureConfig,
  CreateSnapshotStoreOptions,
  RecordContext,
  Snapshot,
  SnapshotStore,
} from '../types'

const DEFAULT_MAX_PER_ACTION = 25

function resolvePerAction(cfg: CaptureConfig | undefined): Snapshot {
  if (cfg === undefined) return {}
  if (typeof cfg === 'function') {
    try {
      return cfg() ?? {}
    } catch (err) {
      devWarn(`capture: per-action capture function threw; skipped. ${String(err)}`)
      return {}
    }
  }
  return cfg
}

function readGetters(entries: ReadonlyArray<[string, () => unknown]>): Snapshot {
  const out: Snapshot = {}
  for (const [key, getter] of entries) {
    try {
      out[key] = getter()
    } catch (err) {
      devWarn(`capture: getter for "${key}" threw; skipped. ${String(err)}`)
    }
  }
  return out
}

/**
 * Clone so the stored snapshot reflects values *as they were* and is immune to
 * later mutation of the source. Non-serializable values are dropped (dev warn).
 */
function safeClone(value: Snapshot): Snapshot {
  try {
    return structuredClone(value)
  } catch {
    // Fall back to per-key best-effort below.
  }
  const out: Snapshot = {}
  for (const key of Object.keys(value)) {
    try {
      out[key] = structuredClone(value[key])
    } catch {
      devWarn(`capture: value for "${key}" is not serializable; dropped from snapshot.`)
    }
  }
  return out
}

export function createSnapshotStore(options: CreateSnapshotStoreOptions = {}): SnapshotStore {
  const central = options.capture ?? {}
  const maxPerAction = options.maxPerAction ?? DEFAULT_MAX_PER_ACTION

  let contributorId = 0
  const contributors = new Map<number, { key: string; getter: () => unknown }>()
  const history = new Map<string, Snapshot[]>()
  const current = new Map<string, Snapshot>()
  const listeners = new Map<string, Set<() => void>>()

  function record(ctx: RecordContext, perActionCapture?: CaptureConfig): Snapshot {
    const centralValues = readGetters(Object.entries(central))
    const contributorValues = readGetters(
      [...contributors.values()].map((c) => [c.key, c.getter] as [string, () => unknown]),
    )
    const perAction = resolvePerAction(perActionCapture)

    // Precedence: central < contributor < per-action (most specific wins).
    const merged: Snapshot = { ...centralValues, ...contributorValues, ...perAction }
    const snapshot = safeClone(merged)

    current.set(ctx.instanceId, snapshot)

    if (ctx.actionName) {
      const arr = history.get(ctx.actionName) ?? []
      arr.push(snapshot)
      if (arr.length > maxPerAction) arr.splice(0, arr.length - maxPerAction)
      history.set(ctx.actionName, arr)

      const subs = listeners.get(ctx.actionName)
      if (subs) for (const fn of subs) fn()
    }

    return snapshot
  }

  return {
    record,
    peek: (instanceId) => current.get(instanceId),
    last: (actionName) => {
      const arr = history.get(actionName)
      return arr && arr.length > 0 ? arr[arr.length - 1] : undefined
    },
    history: (actionName) => {
      const arr = history.get(actionName)
      return arr ? [...arr] : []
    },
    subscribe: (actionName, listener) => {
      const subs = listeners.get(actionName) ?? new Set<() => void>()
      subs.add(listener)
      listeners.set(actionName, subs)
      return () => {
        subs.delete(listener)
      }
    },
    registerContributor: (key, getter) => {
      const id = contributorId++
      contributors.set(id, { key, getter })
      return () => {
        contributors.delete(id)
      }
    },
  }
}
