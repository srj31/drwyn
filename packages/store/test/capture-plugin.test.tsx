import { Action, ActionProvider } from '@drwyn/react'
import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetCapturePluginWarnCacheForTests, capture } from '../src/plugins/capture-plugin'
import type { SnapshotStore } from '../src/types'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    capture: typeof capture
  }
  interface ActionServicesRegistry {
    snapshots: SnapshotStore
  }
}

function makeMockStore(): SnapshotStore & { record: ReturnType<typeof vi.fn> } {
  const record = vi.fn(() => ({}))
  return {
    record,
    peek: () => undefined,
    last: () => undefined,
    history: () => [],
    subscribe: () => () => {},
    registerContributor: () => () => {},
  } as SnapshotStore & { record: ReturnType<typeof vi.fn> }
}

function makeServices(store?: SnapshotStore) {
  return {
    ...(store ? { snapshots: store } : {}),
    sink: () => {},
    flagSource: { isOn: () => undefined },
    logger: { warn: () => {}, error: () => {} },
  }
}

beforeEach(() => {
  __resetCapturePluginWarnCacheForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('capture plugin', () => {
  it('is an always-on plugin with the capture propKey', () => {
    expect(capture.name).toBe('capture')
    expect(capture.propKey).toBe('capture')
    expect(capture.always).toBe(true)
  })

  it('records on click, passing ctx and the per-action capture config', () => {
    const store = makeMockStore()
    const { container } = render(
      <ActionProvider plugins={[capture]} services={makeServices(store) as never}>
        <Action name="cta" capture={() => ({ qty: 3 })}>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(store.record).toHaveBeenCalledTimes(1)
    const call = store.record.mock.calls[0]!
    expect((call[0] as { actionName?: string }).actionName).toBe('cta')
    expect(typeof (call[0] as { instanceId: string }).instanceId).toBe('string')
    expect(typeof call[1]).toBe('function')
  })

  it('records on submit', () => {
    const store = makeMockStore()
    const { container } = render(
      <ActionProvider plugins={[capture]} services={makeServices(store) as never}>
        <Action name="signup">
          <form>x</form>
        </Action>
      </ActionProvider>,
    )
    fireEvent.submit(container.querySelector('form')!)
    expect(store.record).toHaveBeenCalledTimes(1)
  })

  it('records even when no capture prop is present (always-on ambient capture)', () => {
    const store = makeMockStore()
    const { container } = render(
      <ActionProvider plugins={[capture]} services={makeServices(store) as never}>
        <Action name="cta">
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(store.record).toHaveBeenCalledTimes(1)
    expect(store.record.mock.calls[0]![1]).toBeUndefined()
  })

  it('does not record and warns once when no snapshots service is registered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <ActionProvider plugins={[capture]} services={makeServices() as never}>
        <Action name="cta">
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    fireEvent.click(btn)
    fireEvent.click(btn)
    const serviceWarns = warn.mock.calls.filter((c) => /service/i.test(String(c[0])))
    expect(serviceWarns.length).toBe(1)
  })
})
