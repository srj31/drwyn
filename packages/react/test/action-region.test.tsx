import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { ActionProvider } from '../src/provider'

declare module '../src/types' {
  interface ActionPluginRegistry {
    testGate: ReturnType<typeof testGatePlugin>
    testMount: ReturnType<typeof testMountPlugin>
    testClick: ReturnType<typeof testClickPlugin>
  }
}

function testClickPlugin(onClick: (label: string) => void) {
  return definePlugin({
    name: 'testClick',
    propKey: 'testClick',
    config: {} as { label: string },
    events: {
      click: (_e, cfg) => onClick(cfg.label),
    },
  })
}

function testGatePlugin(decision: 'pass' | 'block' | { kind: 'replace'; node: any }) {
  return definePlugin({
    name: 'testGate',
    propKey: 'testGate',
    config: {} as boolean,
    gate: (on) => {
      if (!on) return { kind: 'pass' }
      if (decision === 'pass') return { kind: 'pass' }
      if (decision === 'block') return { kind: 'block' }
      return decision
    },
  })
}

function testMountPlugin(onMount: () => void, onUnmount: () => void) {
  return definePlugin({
    name: 'testMount',
    propKey: 'testMount',
    config: {} as boolean,
    mount: () => {
      onMount()
      return onUnmount
    },
  })
}

describe('<Action mode="region">', () => {
  it('renders a wrapping div around children by default', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action>
          <span data-testid="child">hello</span>
        </Action>
      </ActionProvider>,
    )
    const child = screen.getByTestId('child')
    expect(child.parentElement?.tagName).toBe('DIV')
    expect(child.parentElement?.getAttribute('data-drwyn-action')).toBeTruthy()
  })

  it('respects the `as` prop for the wrapper tag', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action as="section">
          <span data-testid="child">hi</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('child').parentElement?.tagName).toBe('SECTION')
  })

  it('renders null when a gate returns block', () => {
    const p = testGatePlugin('block')
    const { container } = render(
      <ActionProvider plugins={[p]}>
        <Action testGate>
          <span data-testid="child">hi</span>
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="child"]')).toBeNull()
  })

  it('renders the replacement node when a gate returns replace', () => {
    const p = testGatePlugin({ kind: 'replace', node: <span data-testid="alt">alt</span> })
    render(
      <ActionProvider plugins={[p]}>
        <Action testGate>
          <span data-testid="orig">orig</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('alt')).toBeInTheDocument()
    expect(screen.queryByTestId('orig')).toBeNull()
  })

  it('calls mount on render and cleanup on unmount', () => {
    const onMount = vi.fn()
    const onUnmount = vi.fn()
    const p = testMountPlugin(onMount, onUnmount)

    const { unmount } = render(
      <ActionProvider plugins={[p]}>
        <Action testMount>
          <span>hi</span>
        </Action>
      </ActionProvider>,
    )
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onUnmount).not.toHaveBeenCalled()

    unmount()
    expect(onUnmount).toHaveBeenCalledTimes(1)
  })
})

describe('<Action mode="region"> event delegation', () => {
  it('fires plugin click handlers when any descendant is clicked', () => {
    const onClick = vi.fn()
    const p = testClickPlugin(onClick)

    render(
      <ActionProvider plugins={[p]}>
        <Action testClick={{ label: 'card' }}>
          <button data-testid="btn" type="button">
            click
          </button>
        </Action>
      </ActionProvider>,
    )

    fireEvent.click(screen.getByTestId('btn'))
    expect(onClick).toHaveBeenCalledWith('card')
  })
})
