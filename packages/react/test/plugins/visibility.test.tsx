import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../../src/action'
import { __resetPoolForTests, __setObserverFactoryForTests } from '../../src/plugin/intersection'
import { visibility } from '../../src/plugins/visibility'
import { ActionProvider } from '../../src/provider'

let emit: (target: Element, visible: boolean) => void

beforeEach(() => {
  __resetPoolForTests()
  __setObserverFactoryForTests((cb) => {
    const observed = new Set<Element>()
    const fake = {
      observe: (el: Element) => observed.add(el),
      unobserve: (el: Element) => observed.delete(el),
      disconnect: () => observed.clear(),
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
    }
    emit = (target, visible) =>
      cb(
        [
          {
            target,
            isIntersecting: visible,
            intersectionRatio: visible ? 1 : 0,
          } as IntersectionObserverEntry,
        ],
        fake as unknown as IntersectionObserver,
      )
    return fake as unknown as IntersectionObserver
  })
})

describe('visibility plugin', () => {
  it('fires the configured event through the sink when visible', () => {
    const sink = vi.fn()
    render(
      <ActionProvider plugins={[visibility]} services={{ sink }}>
        <Action visibility={{ event: 'card_viewed' }}>
          <span data-testid="t">x</span>
        </Action>
      </ActionProvider>,
    )
    const wrap = screen.getByTestId('t').parentElement!
    emit(wrap, true)
    expect(sink).toHaveBeenCalledWith({ name: 'card_viewed', props: undefined })
  })

  it('with once: true, fires only the first time', () => {
    const sink = vi.fn()
    render(
      <ActionProvider plugins={[visibility]} services={{ sink }}>
        <Action visibility={{ event: 'card_viewed', once: true }}>
          <span data-testid="t">x</span>
        </Action>
      </ActionProvider>,
    )
    const wrap = screen.getByTestId('t').parentElement!
    emit(wrap, true)
    emit(wrap, false)
    emit(wrap, true)
    expect(sink).toHaveBeenCalledTimes(1)
  })

  it('callback form fires onVisible/onHidden', () => {
    const onVisible = vi.fn()
    const onHidden = vi.fn()
    render(
      <ActionProvider plugins={[visibility]}>
        <Action visibility={{ onVisible, onHidden }}>
          <span data-testid="t">x</span>
        </Action>
      </ActionProvider>,
    )
    const wrap = screen.getByTestId('t').parentElement!
    emit(wrap, true)
    emit(wrap, false)
    expect(onVisible).toHaveBeenCalledTimes(1)
    expect(onHidden).toHaveBeenCalledTimes(1)
  })
})
