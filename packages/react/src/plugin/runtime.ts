import type { SyntheticEvent } from 'react'
import type {
  DOMEventName,
  GateResult,
  Plugin,
  PluginContext,
  PluginPhase,
  RenderResult,
  SurfaceVisibility,
} from '../types'

export type OnError = (err: unknown, pluginName: string, phase: PluginPhase) => void

export function runGate(
  plugins: ReadonlyArray<Plugin<any, string, string>>,
  configs: Record<string, unknown>,
  ctx: PluginContext,
  onError?: OnError,
): GateResult {
  for (const plugin of plugins) {
    if (!plugin.gate) continue
    if (!Object.prototype.hasOwnProperty.call(configs, plugin.propKey)) continue
    const cfg = configs[plugin.propKey]
    let result: GateResult
    try {
      result = plugin.gate(cfg, ctx)
    } catch (err) {
      onError?.(err, plugin.name, 'gate')
      continue
    }
    if (result.kind === 'block' || result.kind === 'replace') return result
  }
  return { kind: 'pass' }
}

export function runMount(
  plugins: ReadonlyArray<Plugin<any, string, string>>,
  configs: Record<string, unknown>,
  ctx: PluginContext,
  onError?: OnError,
): () => void {
  const cleanups: Array<{ name: string; fn: () => void }> = []

  for (const plugin of plugins) {
    if (!plugin.mount) continue
    if (!Object.prototype.hasOwnProperty.call(configs, plugin.propKey)) continue
    try {
      const result = plugin.mount(configs[plugin.propKey], ctx)
      if (typeof result === 'function') {
        cleanups.push({ name: plugin.name, fn: result })
      }
    } catch (err) {
      onError?.(err, plugin.name, 'mount')
    }
  }

  return () => {
    for (let i = cleanups.length - 1; i >= 0; i--) {
      const entry = cleanups[i]
      if (!entry) continue
      try {
        entry.fn()
      } catch (err) {
        onError?.(err, entry.name, 'mount')
      }
    }
  }
}

export function runRender(
  plugins: ReadonlyArray<Plugin<any, string, string>>,
  configs: Record<string, unknown>,
  ctx: PluginContext,
  onError?: OnError,
): RenderResult {
  // Strictest wins: hidden > collapsed > full
  let strictest: SurfaceVisibility = 'full'
  for (const plugin of plugins) {
    if (!plugin.render) continue
    if (!Object.prototype.hasOwnProperty.call(configs, plugin.propKey)) continue
    try {
      const result = plugin.render(configs[plugin.propKey], ctx)
      if (result.visibility === 'hidden') return { visibility: 'hidden' }
      if (result.visibility === 'collapsed') strictest = 'collapsed'
    } catch (err) {
      onError?.(err, plugin.name, 'render')
    }
  }
  return { visibility: strictest }
}

type HandlerMap = Partial<Record<DOMEventName, (e: SyntheticEvent) => void>>

export function buildHandlers(
  plugins: ReadonlyArray<Plugin<any, string, string>>,
  configs: Record<string, unknown>,
  ctx: PluginContext,
  onError?: OnError,
): HandlerMap {
  const byEvent = new Map<
    DOMEventName,
    Array<{
      name: string
      fn: (e: SyntheticEvent, cfg: unknown, ctx: PluginContext) => void
      cfg: unknown
    }>
  >()

  for (const plugin of plugins) {
    if (!plugin.events) continue
    if (!Object.prototype.hasOwnProperty.call(configs, plugin.propKey)) continue
    const cfg = configs[plugin.propKey]
    for (const eventName of Object.keys(plugin.events) as DOMEventName[]) {
      const handler = plugin.events[eventName]
      if (!handler) continue
      const arr = byEvent.get(eventName) ?? []
      arr.push({ name: plugin.name, fn: handler as never, cfg })
      byEvent.set(eventName, arr)
    }
  }

  const out: HandlerMap = {}
  for (const [eventName, list] of byEvent) {
    out[eventName] = (e: SyntheticEvent) => {
      for (const { name, fn, cfg } of list) {
        try {
          fn(e, cfg, ctx)
        } catch (err) {
          onError?.(err, name, 'event')
        }
      }
    }
  }
  return out
}
