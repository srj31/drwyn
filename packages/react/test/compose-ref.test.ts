import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { composeRefs } from '../src/plugin/compose-ref'

describe('composeRefs', () => {
  it('writes to every ref-object passed in', () => {
    const r1 = createRef<HTMLDivElement>()
    const r2 = createRef<HTMLDivElement>()
    const node = document.createElement('div')

    composeRefs(r1, r2)(node)

    expect(r1.current).toBe(node)
    expect(r2.current).toBe(node)
  })

  it('calls every ref-callback passed in', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const node = document.createElement('span')

    composeRefs(cb1, cb2)(node)

    expect(cb1).toHaveBeenCalledWith(node)
    expect(cb2).toHaveBeenCalledWith(node)
  })

  it('ignores null and undefined refs', () => {
    const r = createRef<HTMLDivElement>()
    const node = document.createElement('div')

    composeRefs(r, null, undefined)(node)

    expect(r.current).toBe(node)
  })

  it('writes null on unmount to ref-objects and ref-callbacks', () => {
    const r = createRef<HTMLDivElement>()
    const cb = vi.fn()
    const node = document.createElement('div')

    const composed = composeRefs(r, cb)
    composed(node)
    composed(null)

    expect(r.current).toBeNull()
    expect(cb).toHaveBeenLastCalledWith(null)
  })
})
