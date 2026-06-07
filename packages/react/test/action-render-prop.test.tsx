import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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

declare module '../src/types' {
  interface ActionPluginRegistry {
    collapser: typeof collapsedPlugin
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
})
