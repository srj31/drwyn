import { describe, expect, it, vi } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import { buildHandlers } from '../src/plugin/runtime'
import type { PluginContext } from '../src/types'

const ctx: PluginContext = {
  instanceId: 'i1',
  services: {} as PluginContext['services'],
}

const fakeEvent = (): any => ({
  type: 'click',
  defaultPrevented: false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
})

describe('buildHandlers', () => {
  it('returns a map of merged handlers per event name', () => {
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      events: { click: vi.fn() },
    })

    const handlers = buildHandlers([a], { a: {} }, ctx)

    expect(handlers.click).toBeTypeOf('function')
  })

  it('invokes each plugin handler in registration order', () => {
    const order: string[] = []
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      events: {
        click: () => {
          order.push('a')
        },
      },
    })
    const b = definePlugin({
      name: 'b',
      propKey: 'b',
      events: {
        click: () => {
          order.push('b')
        },
      },
    })

    const handlers = buildHandlers([a, b], { a: {}, b: {} }, ctx)
    handlers.click?.(fakeEvent())

    expect(order).toEqual(['a', 'b'])
  })

  it('runs subsequent handlers even after one calls preventDefault', () => {
    const b = vi.fn()
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      events: {
        click: (e) => {
          e.preventDefault()
        },
      },
    })
    const bp = definePlugin({ name: 'b', propKey: 'b', events: { click: b } })

    const handlers = buildHandlers([a, bp], { a: {}, b: {} }, ctx)
    handlers.click?.(fakeEvent())

    expect(b).toHaveBeenCalledTimes(1)
  })

  it('isolates a throwing handler and reports to onError', () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const b = vi.fn()
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      events: {
        click: () => {
          throw boom
        },
      },
    })
    const bp = definePlugin({ name: 'b', propKey: 'b', events: { click: b } })

    const handlers = buildHandlers([a, bp], { a: {}, b: {} }, ctx, onError)
    handlers.click?.(fakeEvent())

    expect(b).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(boom, 'a', 'event')
  })

  it('omits handlers for events no plugin claims', () => {
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      events: { click: vi.fn() },
    })

    const handlers = buildHandlers([a], { a: {} }, ctx)

    expect(handlers.click).toBeTypeOf('function')
    expect(handlers.focus).toBeUndefined()
  })

  it('skips a plugin with no config slice', () => {
    const click = vi.fn()
    const a = definePlugin({ name: 'a', propKey: 'a', events: { click } })

    const handlers = buildHandlers([a], {}, ctx)

    expect(handlers.click).toBeUndefined()
    expect(click).not.toHaveBeenCalled()
  })
})
