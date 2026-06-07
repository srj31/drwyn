import { describe, expect, it, vi } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import { runRender } from '../src/plugin/runtime'
import type { PluginContext } from '../src/types'

const ctx: PluginContext = {
  instanceId: 'i1',
  services: {} as PluginContext['services'],
}

describe('runRender', () => {
  it('returns full when no plugins are provided', () => {
    expect(runRender([], {}, ctx)).toEqual({ visibility: 'full' })
  })

  it('returns full when plugins do not implement render', () => {
    const a = definePlugin({ name: 'a', propKey: 'a' })

    expect(runRender([a], { a: {} }, ctx)).toEqual({ visibility: 'full' })
  })

  it('returns the visibility from a single render plugin', () => {
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      render: () => ({ visibility: 'collapsed' }),
    })

    expect(runRender([a], { a: {} }, ctx)).toEqual({ visibility: 'collapsed' })
  })

  it('skips plugins with no config slice', () => {
    const render = vi.fn(() => ({ visibility: 'collapsed' }) as const)
    const a = definePlugin({ name: 'a', propKey: 'a', render })

    expect(runRender([a], {}, ctx)).toEqual({ visibility: 'full' })
    expect(render).not.toHaveBeenCalled()
  })

  it('selects the strictest visibility across plugins (collapsed beats full)', () => {
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      render: () => ({ visibility: 'full' }),
    })
    const b = definePlugin({
      name: 'b',
      propKey: 'b',
      render: () => ({ visibility: 'collapsed' }),
    })

    expect(runRender([a, b], { a: {}, b: {} }, ctx)).toEqual({ visibility: 'collapsed' })
  })

  it('short-circuits on hidden (hidden is strictest)', () => {
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      render: () => ({ visibility: 'hidden' }),
    })
    const bRender = vi.fn(() => ({ visibility: 'collapsed' }) as const)
    const b = definePlugin({ name: 'b', propKey: 'b', render: bRender })

    expect(runRender([a, b], { a: {}, b: {} }, ctx)).toEqual({ visibility: 'hidden' })
    expect(bRender).not.toHaveBeenCalled()
  })

  it('treats a thrown render as full (fail-open) and calls onError', () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      render: () => {
        throw boom
      },
    })
    const b = definePlugin({
      name: 'b',
      propKey: 'b',
      render: () => ({ visibility: 'collapsed' }),
    })

    const result = runRender([a, b], { a: {}, b: {} }, ctx, onError)

    expect(result).toEqual({ visibility: 'collapsed' })
    expect(onError).toHaveBeenCalledWith(boom, 'a', 'render')
  })
})
