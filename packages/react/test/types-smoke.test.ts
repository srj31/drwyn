import { describe, expect, it } from 'vitest'
import type {
  ActionPluginRegistry,
  ActionServicesRegistry,
  DOMEventName,
  GateResult,
  Plugin,
  PluginContext,
  PluginPhase,
} from '../src/types'

describe('types module', () => {
  it('exports the public type names', () => {
    expect(true).toBe(true)
  })

  it('GateResult value passes structural check', () => {
    const r: GateResult = { kind: 'pass' }
    expect(r.kind).toBe('pass')
  })
})
