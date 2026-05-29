import type { ReactNode, SyntheticEvent } from 'react'

export type DOMEventName =
  | 'click'
  | 'focus'
  | 'blur'
  | 'change'
  | 'submit'
  | 'mouseenter'
  | 'mouseleave'

export type PluginPhase = 'gate' | 'mount' | 'event' | 'visibility'

export type GateResult =
  | { kind: 'pass' }
  | { kind: 'block' }
  | { kind: 'replace'; node: ReactNode }

export interface ActionServicesRegistry {
  sink: (event: { name: string; props?: Record<string, unknown> }) => void
  flagSource: {
    isOn: (key: string) => boolean | undefined
  }
  logger: {
    warn: (msg: string) => void
    error: (msg: string, err?: unknown) => void
  }
}

export interface PluginContext {
  instanceId: string
  services: ActionServicesRegistry
}

export interface Plugin<
  Config = unknown,
  Name extends string = string,
  PropKey extends string = string,
> {
  name: Name
  propKey: PropKey
  gate?: (cfg: Config, ctx: PluginContext) => GateResult
  mount?: (cfg: Config, ctx: PluginContext) => void | (() => void)
  events?: Partial<
    Record<DOMEventName, (e: SyntheticEvent, cfg: Config, ctx: PluginContext) => void>
  >
  visibility?: {
    onVisible?: (cfg: Config, ctx: PluginContext) => void
    onHidden?: (cfg: Config, ctx: PluginContext) => void
    threshold?: 0 | 0.25 | 0.5 | 1
  }
}

export interface ActionPluginRegistry {}
