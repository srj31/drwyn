import { definePlugin } from '../plugin/define'
import type { PluginContext } from '../types'

export type AnalyticsConfig = {
  click?: string
  focus?: string
  blur?: string
  change?: string
  submit?: string
  props?: Record<string, unknown>
}

/**
 * Merge the current snapshot (recorded by `@drwyn/store`'s `capture` plugin
 * earlier in the same event) into the track props. Read loosely so this package
 * has no dependency on `@drwyn/store`; a no-op when no `snapshots` service is
 * registered. Only used for action events (click/submit), never focus/blur/change
 * — those would read a stale snapshot.
 */
function enrichProps(
  ctx: PluginContext,
  cfg: AnalyticsConfig,
): Record<string, unknown> | undefined {
  const snapshots = (
    ctx.services as {
      snapshots?: { peek(instanceId: string): Record<string, unknown> | undefined }
    }
  ).snapshots
  const snap = snapshots?.peek(ctx.instanceId)
  if (!snap) return cfg.props
  return { ...snap, ...(cfg.props ?? {}) }
}

export const analytics = definePlugin({
  name: 'analytics',
  propKey: 'track',
  config: {} as AnalyticsConfig,
  events: {
    click: (_e, cfg, ctx) => {
      if (cfg.click) ctx.services.sink({ name: cfg.click, props: enrichProps(ctx, cfg) })
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
      if (cfg.submit) ctx.services.sink({ name: cfg.submit, props: enrichProps(ctx, cfg) })
    },
  },
})
