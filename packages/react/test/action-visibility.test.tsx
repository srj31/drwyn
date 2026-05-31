import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import {
  __resetPoolForTests,
  __setObserverFactoryForTests,
} from '../src/plugin/intersection'
import { ActionProvider } from '../src/provider'

declare module '../src/types' {
  interface ActionPluginRegistry {
    vis: ReturnType<typeof visPlugin>
  }
}

let observers: Array<{
  cb: IntersectionObserverCallback
  observed: Set<Element>
  emit: (target: Element, visible: boolean) => void
}> = []

function setupFakeIO() {
  observers = []
  __setObserverFactoryForTests((cb) => {
    const observed = new Set<Element>()
    const fake = {
      cb,
      observed,
      observe: (el: Element) => observed.add(el),
      unobserve: (el: Element) => observed.delete(el),
      disconnect: () => observed.clear(),
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
      emit: (target: Element, visible: boolean) =>
        cb(
          [
            {
              target,
              isIntersecting: visible,
              intersectionRatio: visible ? 1 : 0,
            } as IntersectionObserverEntry,
          ],
          fake as unknown as IntersectionObserver,
        ),
    }
    observers.push(fake)
    return fake as unknown as IntersectionObserver
  })
}

function visPlugin(onVisible: () => void) {
  return definePlugin({
    name: 'vis',
    propKey: 'vis',
    config: {} as boolean,
    visibility: {
      onVisible,
      threshold: 0.5,
    },
  })
}

describe('<Action> visibility', () => {
  beforeEach(() => {
    __resetPoolForTests()
    setupFakeIO()
  })

  it('fires onVisible when the observer reports visibility', () => {
    const onVisible = vi.fn()
    const p = visPlugin(onVisible)

    render(
      <ActionProvider plugins={[p]}>
        <Action vis>
          <span data-testid="t">x</span>
        </Action>
      </ActionProvider>,
    )

    const node = screen.getByTestId('t').parentElement!
    observers[0]!.emit(node, true)
    expect(onVisible).toHaveBeenCalledTimes(1)

    observers[0]!.emit(node, true)
    expect(onVisible).toHaveBeenCalledTimes(2)
  })
})
