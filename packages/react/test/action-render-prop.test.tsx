import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { ActionProvider } from '../src/provider'
import type { SurfaceVisibility } from '../src/types'

const collapsedPlugin = definePlugin({
  name: 'collapser',
  propKey: 'collapser',
  config: {} as Record<string, unknown>,
  render: () => ({ visibility: 'collapsed' as SurfaceVisibility }),
})

const blockPlugin = definePlugin({
  name: 'blocker',
  propKey: 'blocker',
  config: {} as Record<string, unknown>,
  gate: () => ({ kind: 'block' as const }),
})

const replacePlugin = definePlugin({
  name: 'replacer',
  propKey: 'replacer',
  config: {} as Record<string, unknown>,
  gate: () => ({ kind: 'replace' as const, node: <span data-testid="replaced">replaced</span> }),
})

declare module '../src/types' {
  interface ActionPluginRegistry {
    collapser: typeof collapsedPlugin
    blocker: typeof blockPlugin
    replacer: typeof replacePlugin
  }
}

describe('<Action> render-prop child', () => {
  it('calls the function child with visibility = "full" when no render plugin votes', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action>{(v) => <span data-testid="v">{v}</span>}</Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('v').textContent).toBe('full')
  })

  it('calls the function child with the resolved visibility when a render plugin votes', () => {
    render(
      <ActionProvider plugins={[collapsedPlugin]}>
        <Action collapser={{}}>{(v) => <span data-testid="v">{v}</span>}</Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('v').textContent).toBe('collapsed')
  })

  it('still supports regular ReactNode children (no regression)', () => {
    render(
      <ActionProvider plugins={[]}>
        <Action>
          <span data-testid="static">static</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('static')).toBeInTheDocument()
  })

  it('does not invoke the function child when the gate blocks', () => {
    const fn = vi.fn((v: SurfaceVisibility) => <span>{v}</span>)
    render(
      <ActionProvider plugins={[blockPlugin]}>
        <Action blocker={{}}>{fn}</Action>
      </ActionProvider>,
    )
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not invoke the function child when the gate replaces', () => {
    const fn = vi.fn((v: SurfaceVisibility) => <span>{v}</span>)
    render(
      <ActionProvider plugins={[replacePlugin]}>
        <Action replacer={{}}>{fn}</Action>
      </ActionProvider>,
    )
    expect(fn).not.toHaveBeenCalled()
    expect(screen.getByTestId('replaced')).toBeDefined()
  })
})
