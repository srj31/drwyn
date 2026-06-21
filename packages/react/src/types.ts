import type { ReactNode, SyntheticEvent } from 'react'

export type DOMEventName =
  | 'click'
  | 'focus'
  | 'blur'
  | 'change'
  | 'submit'
  | 'mouseenter'
  | 'mouseleave'

export type PluginPhase = 'gate' | 'mount' | 'event' | 'visibility' | 'render'

export type GateResult = { kind: 'pass' } | { kind: 'block' } | { kind: 'replace'; node: ReactNode }

export type SurfaceVisibility = 'full' | 'collapsed' | 'hidden'

export interface RenderResult {
  visibility: SurfaceVisibility
}

export interface ActionServicesRegistry {
  sink: (event: { name: string; props?: Record<string, unknown> | undefined }) => void
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
  actionName?: string
  services: ActionServicesRegistry
}

export interface Plugin<
  Config = unknown,
  Name extends string = string,
  PropKey extends string = string,
> {
  name: Name
  propKey: PropKey
  always?: boolean
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
  render?: (cfg: Config, ctx: PluginContext) => RenderResult
}

/**
 * Maps a plugin's `propKey` to its config type, driving `<Action>`'s props.
 *
 * The built-in plugins (shipped in this package) are registered here directly so
 * their propKeys reach external consumers through the normal exported type —
 * module augmentation from within a package can't survive its own d.ts bundle.
 * External plugins (e.g. @drwyn/memory, @drwyn/store) augment this interface via
 * `declare module '@drwyn/react'`.
 */
export interface ActionPluginRegistry {
  analytics: typeof import('./plugins/analytics').analytics
  flag: typeof import('./plugins/flag').flag
  mount: typeof import('./plugins/mount').mount
  visibility: typeof import('./plugins/visibility').visibility
}
