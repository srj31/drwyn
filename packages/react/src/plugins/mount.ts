import { definePlugin } from '../plugin/define'

export type MountConfig =
  | { event: string; props?: Record<string, unknown> }
  | { onMount?: () => void; onUnmount?: () => void }

export const mount = definePlugin({
  name: 'mount',
  propKey: 'mount',
  config: {} as MountConfig,
  mount: (cfg, ctx) => {
    if ('event' in cfg) {
      ctx.services.sink({ name: cfg.event, props: cfg.props })
      return undefined
    }
    cfg.onMount?.()
    return () => cfg.onUnmount?.()
  },
})
