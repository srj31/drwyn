import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { __resetDevWarnCacheForTests } from '../src/plugin/dev-warn'
import { ActionProvider } from '../src/provider'
import type { SurfaceVisibility } from '../src/types'

const inlineCollapsedPlugin = definePlugin({
  name: 'inline-rp-collapser',
  propKey: 'inlineRpCollapser',
  config: {} as Record<string, unknown>,
  render: () => ({ visibility: 'collapsed' as SurfaceVisibility }),
})

const inlineClickHandler = vi.fn()
const inlineClickerPlugin = definePlugin({
  name: 'inline-rp-clicker',
  propKey: 'inlineRpClicker',
  config: {} as Record<string, unknown>,
  events: { click: () => inlineClickHandler() },
})

declare module '../src/types' {
  interface ActionPluginRegistry {
    inlineRpCollapser: typeof inlineCollapsedPlugin
    inlineRpClicker: typeof inlineClickerPlugin
  }
}

describe('<Action mode="inline"> + render-prop child', () => {
  beforeEach(() => {
    inlineClickHandler.mockClear()
  })

  it('calls the function with visibility and clones the returned single element', () => {
    const { container } = render(
      <ActionProvider plugins={[inlineCollapsedPlugin]}>
        <Action mode="inline" inlineRpCollapser={{}}>
          {(v) => (
            <button type="button" data-testid="btn">
              {v}
            </button>
          )}
        </Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('collapsed')
    expect(btn.getAttribute('data-drwyn-visibility')).toBe('collapsed')
    // inline mode: cloned child should NOT be wrapped in a region element.
    expect(btn.parentElement?.getAttribute('data-drwyn-action')).toBeNull()
  })

  it('merges plugin click handlers onto the cloned child returned from the function', () => {
    const childClickHandler = vi.fn()
    const { container } = render(
      <ActionProvider plugins={[inlineClickerPlugin]}>
        <Action mode="inline" inlineRpClicker={{}}>
          {(_v) => (
            <button type="button" onClick={childClickHandler}>
              x
            </button>
          )}
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(childClickHandler).toHaveBeenCalledTimes(1)
    expect(inlineClickHandler).toHaveBeenCalledTimes(1)
  })

  it('renders visibility="full" by default when no render plugin votes', () => {
    const { container } = render(
      <ActionProvider plugins={[]}>
        <Action mode="inline">{(v) => <button type="button">{v}</button>}</Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('full')
    expect(btn.getAttribute('data-drwyn-visibility')).toBe('full')
  })
})

describe('<Action mode="inline"> + render-prop child multi-element', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetDevWarnCacheForTests()
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('does not crash when the function returns a fragment of multiple elements', () => {
    // KNOWN ISSUE: when the render-prop returns a Fragment containing multiple
    // elements, `getOnlyValidElementChild` treats the Fragment as a single
    // valid element and `cloneElement`s it with `data-drwyn-visibility`. React
    // 19 emits an "Invalid prop ... supplied to React.Fragment" warning but
    // does not crash; both spans still render. The inline-mode fallback-to-
    // region path is NOT taken for this case (vs. the static multi-child case,
    // where children come through as an array and the fallback fires). This
    // test pins down current behavior; the bug is tracked separately.
    const { container } = render(
      <ActionProvider plugins={[]}>
        <Action mode="inline">
          {(_v) => (
            <>
              <span>one</span>
              <span>two</span>
            </>
          )}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelectorAll('span').length).toBe(2)
  })
})
