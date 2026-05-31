import { fireEvent, render, screen } from '@testing-library/react'
import { forwardRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { __resetDevWarnCacheForTests } from '../src/plugin/dev-warn'
import { ActionProvider } from '../src/provider'

declare module '../src/types' {
  interface ActionPluginRegistry {
    inlineClick: ReturnType<typeof inlineClickPlugin>
  }
}

function inlineClickPlugin(onClick: () => void) {
  return definePlugin({
    name: 'inlineClick',
    propKey: 'inlineClick',
    config: {} as boolean,
    events: { click: () => onClick() },
  })
}

describe('<Action mode="inline">', () => {
  it('renders the cloned child without an extra wrapper element', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action mode="inline">
          <span data-testid="child">hi</span>
        </Action>
      </ActionProvider>,
    )

    const child = screen.getByTestId('child')
    expect(child.parentElement?.getAttribute('data-drwyn-action')).toBeNull()
  })

  it("merges plugin click handler with the child's own onClick (child runs first)", () => {
    const order: string[] = []
    const childClick = vi.fn(() => {
      order.push('child')
    })
    const pluginClick = vi.fn(() => {
      order.push('plugin')
    })
    const p = inlineClickPlugin(pluginClick)

    render(
      <ActionProvider plugins={[p]}>
        <Action mode="inline" inlineClick>
          <button data-testid="btn" type="button" onClick={childClick}>
            click
          </button>
        </Action>
      </ActionProvider>,
    )

    fireEvent.click(screen.getByTestId('btn'))
    expect(order).toEqual(['child', 'plugin'])
  })

  it("composes ref with the child's own ref", () => {
    const childRef = { current: null as HTMLDivElement | null }
    const Child = forwardRef<HTMLDivElement, { children: any }>(({ children }, ref) => (
      <div ref={ref} data-testid="ref-child">
        {children}
      </div>
    ))

    function Wrap() {
      return (
        <ActionProvider plugins={[]}>
          <Action mode="inline">
            <Child ref={childRef}>x</Child>
          </Action>
        </ActionProvider>
      )
    }

    render(<Wrap />)
    expect(childRef.current).toBe(screen.getByTestId('ref-child'))
  })
})

describe('<Action mode="inline"> constraint warnings', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetDevWarnCacheForTests()
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('warns and falls back when there are multiple element children', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action mode="inline">
          <span>a</span>
          <span>b</span>
        </Action>
      </ActionProvider>,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/inline.*exactly one valid React element/i),
    )
  })

  it('warns and falls back when the child is a string', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action mode="inline">hello</Action>
      </ActionProvider>,
    )
    expect(warn).toHaveBeenCalled()
  })
})
