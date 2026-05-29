import { describe, expect, it, vi } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import { runGate } from '../src/plugin/runtime'
import type { PluginContext } from '../src/types'

const ctx: PluginContext = {
  instanceId: 'i1',
  services: {} as PluginContext['services'],
}

describe('runGate', () => {
  it('returns pass when all plugins pass', () => {
    const a = definePlugin({ name: 'a', propKey: 'a', gate: () => ({ kind: 'pass' }) })
    const b = definePlugin({ name: 'b', propKey: 'b', gate: () => ({ kind: 'pass' }) })

    const result = runGate([a, b], { a: {}, b: {} }, ctx)

    expect(result).toEqual({ kind: 'pass' })
  })

  it('returns block at the first blocking plugin', () => {
    const a = definePlugin({ name: 'a', propKey: 'a', gate: () => ({ kind: 'pass' }) })
    const b = definePlugin({ name: 'b', propKey: 'b', gate: () => ({ kind: 'block' }) })
    const cGate = vi.fn(() => ({ kind: 'pass' }) as const)
    const c = definePlugin({ name: 'c', propKey: 'c', gate: cGate })

    const result = runGate([a, b, c], { a: {}, b: {}, c: {} }, ctx)

    expect(result).toEqual({ kind: 'block' })
    expect(cGate).not.toHaveBeenCalled()
  })

  it('returns replace at the first replacing plugin and short-circuits subsequent gates', () => {
    const node = 'replacement'
    const a = definePlugin({ name: 'a', propKey: 'a', gate: () => ({ kind: 'pass' }) })
    const b = definePlugin({
      name: 'b',
      propKey: 'b',
      gate: () => ({ kind: 'replace', node }),
    })
    const cGate = vi.fn(() => ({ kind: 'pass' }) as const)
    const c = definePlugin({ name: 'c', propKey: 'c', gate: cGate })

    const result = runGate([a, b, c], { a: {}, b: {}, c: {} }, ctx)

    expect(result).toEqual({ kind: 'replace', node })
    expect(cGate).not.toHaveBeenCalled()
  })

  it('skips plugins with no config slice', () => {
    const gate = vi.fn(() => ({ kind: 'block' }) as const)
    const a = definePlugin({ name: 'a', propKey: 'a', gate })

    const result = runGate([a], {}, ctx)

    expect(result).toEqual({ kind: 'pass' })
    expect(gate).not.toHaveBeenCalled()
  })

  it('treats a thrown gate as pass (fail-open) and calls onError', () => {
    const onError = vi.fn()
    const boom = new Error('boom')
    const a = definePlugin({
      name: 'a',
      propKey: 'a',
      gate: () => {
        throw boom
      },
    })
    const b = definePlugin({ name: 'b', propKey: 'b', gate: () => ({ kind: 'pass' }) })

    const result = runGate([a, b], { a: {}, b: {} }, ctx, onError)

    expect(result).toEqual({ kind: 'pass' })
    expect(onError).toHaveBeenCalledWith(boom, 'a', 'gate')
  })
})
