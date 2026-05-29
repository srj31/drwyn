import { describe, expect, it, vi } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import { runMount } from '../src/plugin/runtime'
import type { PluginContext } from '../src/types'

const ctx: PluginContext = {
  instanceId: 'i1',
  services: {} as PluginContext['services'],
}

describe('runMount', () => {
  it('calls mount for plugins with a config slice and collects cleanups', () => {
    const cleanA = vi.fn()
    const mountA = vi.fn(() => cleanA)
    const a = definePlugin({ name: 'a', propKey: 'a', mount: mountA })

    const dispose = runMount([a], { a: { foo: 1 } }, ctx)

    expect(mountA).toHaveBeenCalledWith({ foo: 1 }, ctx)
    expect(cleanA).not.toHaveBeenCalled()

    dispose()
    expect(cleanA).toHaveBeenCalledTimes(1)
  })

  it('skips plugins with no config slice', () => {
    const mountA = vi.fn()
    const a = definePlugin({ name: 'a', propKey: 'a', mount: mountA })

    runMount([a], {}, ctx)

    expect(mountA).not.toHaveBeenCalled()
  })

  it('runs cleanups in reverse registration order', () => {
    const order: string[] = []
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      mount: () => () => {
        order.push('a')
      },
    })
    const b = definePlugin({
      name: 'b',
      propKey: 'b',
      mount: () => () => {
        order.push('b')
      },
    })

    const dispose = runMount([a, b], { a: {}, b: {} }, ctx)
    dispose()

    expect(order).toEqual(['b', 'a'])
  })

  it('isolates throwing mount and continues with the rest, reporting to onError', () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const mountA = vi.fn(() => {
      throw boom
    })
    const mountB = vi.fn()
    const a = definePlugin({ name: 'a', propKey: 'a', mount: mountA })
    const b = definePlugin({ name: 'b', propKey: 'b', mount: mountB })

    runMount([a, b], { a: {}, b: {} }, ctx, onError)

    expect(mountB).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(boom, 'a', 'mount')
  })

  it('isolates throwing cleanup and runs the rest', () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const cleanA = vi.fn(() => {
      throw boom
    })
    const cleanB = vi.fn()
    const a = definePlugin({ name: 'a', propKey: 'a', mount: () => cleanA })
    const b = definePlugin({ name: 'b', propKey: 'b', mount: () => cleanB })

    const dispose = runMount([a, b], { a: {}, b: {} }, ctx, onError)
    dispose()

    expect(cleanA).toHaveBeenCalled()
    expect(cleanB).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(boom, 'a', 'mount')
  })
})
