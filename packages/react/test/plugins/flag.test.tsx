import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Action } from '../../src/action'
import { flag } from '../../src/plugins/flag'
import { ActionProvider } from '../../src/provider'

function withFlags(values: Record<string, boolean | undefined>) {
  return {
    sink: () => {},
    flagSource: { isOn: (k: string) => values[k] },
  }
}

describe('flag plugin', () => {
  it('renders when the flag is on', () => {
    render(
      <ActionProvider plugins={[flag]} services={withFlags({ a: true })}>
        <Action flag="a">
          <span data-testid="c">on</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('c')).toBeInTheDocument()
  })

  it('blocks rendering when the flag is off', () => {
    const { container } = render(
      <ActionProvider plugins={[flag]} services={withFlags({ a: false })}>
        <Action flag="a">
          <span data-testid="c">off</span>
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="c"]')).toBeNull()
  })

  it('replaces with fallback when off and fallback provided', () => {
    render(
      <ActionProvider plugins={[flag]} services={withFlags({ a: false })}>
        <Action flag={{ key: 'a', fallback: <span data-testid="alt">alt</span> }}>
          <span>orig</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('alt')).toBeInTheDocument()
  })

  it('fails open (renders) when the flag is unknown', () => {
    render(
      <ActionProvider plugins={[flag]} services={withFlags({})}>
        <Action flag="a">
          <span data-testid="c">x</span>
        </Action>
      </ActionProvider>,
    )
    expect(screen.getByTestId('c')).toBeInTheDocument()
  })

  it('respects per-instance defaultWhenUnknown=false', () => {
    const { container } = render(
      <ActionProvider plugins={[flag]} services={withFlags({})}>
        <Action flag={{ key: 'a', defaultWhenUnknown: false }}>
          <span data-testid="c">x</span>
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="c"]')).toBeNull()
  })
})
