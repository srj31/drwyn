import { Action, ActionProvider } from '@drwyn/react'
import { analytics } from '@drwyn/react/plugins'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { capture } from '../src/plugins/capture-plugin'
import { createSnapshotStore } from '../src/store/snapshot-store'
import type { SnapshotStore } from '../src/types'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    capture: typeof capture
  }
  interface ActionServicesRegistry {
    snapshots: SnapshotStore
  }
}

function services(snapshots: SnapshotStore, sink: (e: unknown) => void = () => {}) {
  return {
    snapshots,
    sink,
    flagSource: { isOn: () => undefined },
    logger: { warn: () => {}, error: () => {} },
  }
}

describe('integration: capture + analytics', () => {
  it('enriches the track event AND stores a queryable snapshot', () => {
    const sink = vi.fn()
    const snapshots = createSnapshotStore({ capture: { route: () => '/pricing' } })
    const { container } = render(
      <ActionProvider plugins={[capture, analytics]} services={services(snapshots, sink) as never}>
        <Action
          name="checkout"
          track={{ click: 'checkout_clicked' }}
          capture={() => ({ plan: 'pro' })}
        >
          <button type="button">Checkout</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)

    expect(sink).toHaveBeenCalledWith({
      name: 'checkout_clicked',
      props: { route: '/pricing', plan: 'pro' },
    })
    expect(snapshots.last('checkout')).toEqual({ route: '/pricing', plan: 'pro' })
  })

  it('records an ambient snapshot even when the action has no track config', () => {
    const snapshots = createSnapshotStore({ capture: { route: () => '/home' } })
    const { container } = render(
      <ActionProvider plugins={[capture, analytics]} services={services(snapshots) as never}>
        <Action name="widget">
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(snapshots.last('widget')).toEqual({ route: '/home' })
  })
})
