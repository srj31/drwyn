import type { ReactNode } from 'react'
import { definePlugin } from '../plugin/define'

export type FlagConfig =
  | string
  | { key: string; fallback?: ReactNode; defaultWhenUnknown?: boolean }

export const flag = definePlugin({
  name: 'flag',
  propKey: 'flag',
  config: {} as FlagConfig,
  gate: (cfg, ctx) => {
    const key = typeof cfg === 'string' ? cfg : cfg.key
    const fallback = typeof cfg === 'string' ? undefined : cfg.fallback
    const defaultWhenUnknown = typeof cfg === 'string' ? true : (cfg.defaultWhenUnknown ?? true)

    const value = ctx.services.flagSource.isOn(key)
    const on = value === undefined ? defaultWhenUnknown : value

    if (on) return { kind: 'pass' }
    if (fallback !== undefined) return { kind: 'replace', node: fallback }
    return { kind: 'block' }
  },
})

declare module '../types' {
  interface ActionPluginRegistry {
    flag: typeof flag
  }
}
