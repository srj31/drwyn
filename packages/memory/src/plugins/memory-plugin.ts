import { type Plugin, definePlugin } from '@drwyn/react/plugin'
import type { MemoryStore } from '../types'

const warnedInstances = new Set<string>()
let warnedMissingService = false

function devWarnNameMissingOnce(instanceId: string): void {
  if (process.env.NODE_ENV === 'production') return
  if (warnedInstances.has(instanceId)) return
  warnedInstances.add(instanceId)
  if (typeof console !== 'undefined') {
    console.warn(
      `[drwyn] memory plugin: <Action> without a \`name\` prop will not record. Add name="..." to enable adaptive memory.`,
    )
  }
}

function devWarnMissingServiceOnce(): void {
  if (process.env.NODE_ENV === 'production') return
  if (warnedMissingService) return
  warnedMissingService = true
  if (typeof console !== 'undefined') {
    console.warn(
      '[drwyn] memory plugin: no `memory` service registered on ActionProvider; events are not being recorded.',
    )
  }
}

/**
 * Internal: reset the dev-warn dedupe caches. For tests only.
 * @internal
 */
export function __resetMemoryPluginWarnCacheForTests(): void {
  warnedInstances.clear()
  warnedMissingService = false
}

interface MemoryPluginCtx {
  instanceId: string
  actionName?: string | undefined
  services: { memory?: MemoryStore | undefined }
}

function recordOrWarn(ctx: MemoryPluginCtx): void {
  const service = ctx.services.memory
  if (!service) {
    devWarnMissingServiceOnce()
    return
  }
  if (!ctx.actionName) {
    devWarnNameMissingOnce(ctx.instanceId)
    return
  }
  service.record(ctx.actionName)
}

export const memory: Plugin<unknown, 'memory', 'memory'> = definePlugin({
  name: 'memory',
  propKey: 'memory',
  always: true,
  events: {
    click: (_e, _cfg, ctx) => {
      recordOrWarn(ctx as unknown as MemoryPluginCtx)
    },
    submit: (_e, _cfg, ctx) => {
      recordOrWarn(ctx as unknown as MemoryPluginCtx)
    },
  },
})
