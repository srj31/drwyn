import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../../src/action'
import { analytics } from '../../src/plugins/analytics'
import { ActionProvider } from '../../src/provider'

describe('analytics plugin — snapshot enrichment', () => {
  it('merges the current snapshot into the click track event (explicit props win)', () => {
    const sink = vi.fn()
    const snapshots = { peek: () => ({ route: '/home', plan: 'free' }) }
    render(
      <ActionProvider plugins={[analytics]} services={{ sink, snapshots } as never}>
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
      props: { route: '/home', plan: 'pro' },
    })
  })

  it('enriches submit events too', () => {
    const sink = vi.fn()
    const snapshots = { peek: () => ({ a: 1 }) }
    const { container } = render(
      <ActionProvider plugins={[analytics]} services={{ sink, snapshots } as never}>
        <Action track={{ submit: 'form_submit' }}>
          <form>x</form>
        </Action>
      </ActionProvider>,
    )
    fireEvent.submit(container.querySelector('form')!)
    expect(sink).toHaveBeenCalledWith({ name: 'form_submit', props: { a: 1 } })
  })

  it('leaves props unchanged when peek returns undefined', () => {
    const sink = vi.fn()
    const snapshots = { peek: () => undefined }
    render(
      <ActionProvider plugins={[analytics]} services={{ sink, snapshots } as never}>
        <Action mode="inline" track={{ click: 'cta_clicked', props: { plan: 'pro' } }}>
          <button data-testid="btn" type="button">
            Buy
          </button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(screen.getByTestId('btn'))
    expect(sink).toHaveBeenCalledWith({ name: 'cta_clicked', props: { plan: 'pro' } })
  })

  it('does not enrich focus/change events (avoids stale snapshots)', () => {
    const sink = vi.fn()
    const snapshots = { peek: () => ({ stale: true }) }
    render(
      <ActionProvider plugins={[analytics]} services={{ sink, snapshots } as never}>
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
