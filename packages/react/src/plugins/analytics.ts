import { definePlugin } from '../plugin/define'

export type AnalyticsConfig = {
  click?: string
  focus?: string
  blur?: string
  change?: string
  submit?: string
  props?: Record<string, unknown>
}

export const analytics = definePlugin({
  name: 'analytics',
  propKey: 'track',
  config: {} as AnalyticsConfig,
  events: {
    click: (_e, cfg, ctx) => {
      if (cfg.click) ctx.services.sink({ name: cfg.click, props: cfg.props })
    },
    focus: (_e, cfg, ctx) => {
      if (cfg.focus) ctx.services.sink({ name: cfg.focus, props: cfg.props })
    },
    blur: (_e, cfg, ctx) => {
      if (cfg.blur) ctx.services.sink({ name: cfg.blur, props: cfg.props })
    },
    change: (_e, cfg, ctx) => {
      if (cfg.change) ctx.services.sink({ name: cfg.change, props: cfg.props })
    },
    submit: (_e, cfg, ctx) => {
      if (cfg.submit) ctx.services.sink({ name: cfg.submit, props: cfg.props })
    },
  },
})

declare module '../types' {
  interface ActionPluginRegistry {
    analytics: typeof analytics
  }
}
