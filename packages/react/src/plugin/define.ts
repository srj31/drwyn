import type { Plugin } from '../types'

export function definePlugin<Config, Name extends string, PropKey extends string>(
  spec: Omit<Plugin<Config, Name, PropKey>, never> & {
    name: Name
    propKey: PropKey
    config?: Config
  },
): Plugin<Config, Name, PropKey> {
  const { config: _discard, ...rest } = spec
  return rest as Plugin<Config, Name, PropKey>
}

export type {
  DOMEventName,
  GateResult,
  Plugin,
  PluginContext,
  PluginPhase,
} from '../types'
