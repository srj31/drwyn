import type { GateResult, Plugin, PluginContext, PluginPhase } from '../types'

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
