import { describe, expect, expectTypeOf, it } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import type { Plugin } from '../src/types'

describe('definePlugin', () => {
  it('returns a plugin object without the config field', () => {
    const p = definePlugin({
      name: 'analytics',
      propKey: 'track',
      config: {} as { click?: string },
      events: { click: () => {} },
    })

    expect(p.name).toBe('analytics')
    expect(p.propKey).toBe('track')
    expect('config' in p).toBe(false)
  })

  it('infers Config, Name, and PropKey generics', () => {
    const p = definePlugin({
      name: 'flag',
      propKey: 'flag',
      config: {} as { key: string },
      gate: () => ({ kind: 'pass' }),
    })

    expectTypeOf(p).toMatchTypeOf<Plugin<{ key: string }, 'flag', 'flag'>>()
  })
})
