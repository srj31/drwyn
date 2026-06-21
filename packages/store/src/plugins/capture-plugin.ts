import { type Plugin, definePlugin } from '@drwyn/react/plugin'
import { devWarn } from '../dev-warn'
import type { CaptureConfig, SnapshotStore } from '../types'

let warnedMissingService = false

function devWarnMissingServiceOnce(): void {
  if (process.env.NODE_ENV === 'production') return
  if (warnedMissingService) return
  warnedMissingService = true
  devWarn(
    'capture plugin: no `snapshots` service registered on ActionProvider; snapshots are not being recorded.',
  )
}

/**
 * Internal: reset the dev-warn dedupe cache. For tests only.
 * @internal
 */
export function __resetCapturePluginWarnCacheForTests(): void {
  warnedMissingService = false
}

interface CapturePluginCtx {
  instanceId: string
  actionName?: string | undefined
  services: { snapshots?: SnapshotStore | undefined }
}

function recordOrWarn(ctx: CapturePluginCtx, cfg: CaptureConfig | undefined): void {
  const store = ctx.services.snapshots
  if (!store) {
    devWarnMissingServiceOnce()
    return
  }
  store.record(ctx, cfg)
}

/**
 * Always-on plugin that records a point-in-time snapshot on click/submit of any
 * `<Action>`. Register it BEFORE `analytics` so the snapshot exists when the
 * analytics plugin enriches its `track` event.
 */
export const capture: Plugin<CaptureConfig, 'capture', 'capture'> = definePlugin({
  name: 'capture',
  propKey: 'capture',
  always: true,
  config: {} as CaptureConfig,
  events: {
    click: (_e, cfg, ctx) =>
      recordOrWarn(ctx as unknown as CapturePluginCtx, cfg as CaptureConfig | undefined),
    submit: (_e, cfg, ctx) =>
      recordOrWarn(ctx as unknown as CapturePluginCtx, cfg as CaptureConfig | undefined),
  },
})
