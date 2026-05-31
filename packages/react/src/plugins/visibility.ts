import { definePlugin } from '../plugin/define'

export type VisibilityConfig =
  | {
      event: string
      props?: Record<string, unknown>
      once?: boolean
      threshold?: 0 | 0.25 | 0.5 | 1
    }
  | {
      onVisible?: () => void
      onHidden?: () => void
      once?: boolean
      threshold?: 0 | 0.25 | 0.5 | 1
    }

type FiredState = { fired: boolean }

export const visibility = definePlugin({
  name: 'visibility',
  propKey: 'visibility',
  config: {} as VisibilityConfig,
  visibility: {
    threshold: 0.5,
    onVisible: (cfg, ctx) => {
      const state = ((cfg as VisibilityConfig & { __drwynFired?: FiredState }).__drwynFired ??=
        { fired: false })
      if (cfg.once && state.fired) return
      state.fired = true
      if ('event' in cfg && cfg.event) {
        ctx.services.sink({ name: cfg.event, props: cfg.props })
      } else if ('onVisible' in cfg) {
        cfg.onVisible?.()
      }
    },
    onHidden: (cfg) => {
      if ('event' in cfg) return
      cfg.onHidden?.()
    },
  },
})

declare module '../types' {
  interface ActionPluginRegistry {
    visibility: typeof visibility
  }
}
