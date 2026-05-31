import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../../src/action'
import { analytics } from '../../src/plugins/analytics'
import { ActionProvider } from '../../src/provider'

describe('analytics plugin', () => {
  it('emits the configured event with props on click via the provider sink', () => {
    const sink = vi.fn()
    render(
      <ActionProvider plugins={[analytics]} services={{ sink }}>
        <Action mode="inline" track={{ click: 'cta_clicked', props: { plan: 'pro' } }}>
          <button data-testid="btn" type="button">
            Buy
          </button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(screen.getByTestId('btn'))
    expect(sink).toHaveBeenCalledWith({
      name: 'cta_clicked',
      props: { plan: 'pro' },
    })
  })

  it('does not emit on click when track.click is missing', () => {
    const sink = vi.fn()
    render(
      <ActionProvider plugins={[analytics]} services={{ sink }}>
        <Action mode="inline" track={{ focus: 'cta_focused' }}>
          <button data-testid="btn" type="button">
            x
          </button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(screen.getByTestId('btn'))
    expect(sink).not.toHaveBeenCalled()
  })

  it('emits on focus and change', () => {
    const sink = vi.fn()
    render(
      <ActionProvider plugins={[analytics]} services={{ sink }}>
        <Action mode="inline" track={{ focus: 'f', change: 'c' }}>
          <input data-testid="i" />
        </Action>
      </ActionProvider>,
    )
    fireEvent.focus(screen.getByTestId('i'))
    fireEvent.change(screen.getByTestId('i'), { target: { value: 'x' } })
    expect(sink).toHaveBeenCalledWith({ name: 'f', props: undefined })
    expect(sink).toHaveBeenCalledWith({ name: 'c', props: undefined })
  })
})
