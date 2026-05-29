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
