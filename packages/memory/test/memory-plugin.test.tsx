import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Action, ActionProvider } from '@drwyn/react'
import { memory } from '../src/plugins/memory-plugin'
import {
  __resetMemoryPluginWarnCacheForTests,
} from '../src/plugins/memory-plugin'
import type { MemoryStore } from '../src/types'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    memory: typeof memory
  }
  interface ActionServicesRegistry {
    memory: MemoryStore
  }
}

function makeMockMemory(): MemoryStore & { record: ReturnType<typeof vi.fn> } {
  const record = vi.fn()
  return {
    uses: () => 0,
    lastSeen: () => null,
    record,
    setUserId: () => {},
    ready: Promise.resolve(),
    flush: async () => {},
  } as MemoryStore & { record: ReturnType<typeof vi.fn> }
}

function makeServices(memoryStore?: MemoryStore) {
  return {
    ...(memoryStore ? { memory: memoryStore } : {}),
    sink: () => {},
    flagSource: { isOn: () => undefined },
    logger: { warn: () => {}, error: () => {} },
  }
}

const warnSpy = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

beforeEach(() => {
  __resetMemoryPluginWarnCacheForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('memory plugin', () => {
  it('records actionName on click when name + service are present', () => {
    const store = makeMockMemory()
    const services = makeServices(store)
    const { container } = render(
      <ActionProvider plugins={[memory]} services={services as never}>
        <Action name="cta-pricing">
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(store.record).toHaveBeenCalledTimes(1)
    expect(store.record).toHaveBeenCalledWith('cta-pricing')
  })

  it('records on submit too', () => {
    const store = makeMockMemory()
    const services = makeServices(store)
    const { container } = render(
      <ActionProvider plugins={[memory]} services={services as never}>
        <Action name="signup-form">
          <form>x</form>
        </Action>
      </ActionProvider>,
    )
    fireEvent.submit(container.querySelector('form')!)
    expect(store.record).toHaveBeenCalledWith('signup-form')
  })

  it('does NOT record when actionName is missing (and warns once per instance)', () => {
    const store = makeMockMemory()
    const services = makeServices(store)
    const warn = warnSpy()
    const { container } = render(
      <ActionProvider plugins={[memory]} services={services as never}>
        <Action>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(store.record).not.toHaveBeenCalled()
    // The warning fires only once per instance.
    const nameWarns = warn.mock.calls.filter((call) =>
      /name/i.test(String(call[0])),
    )
    expect(nameWarns.length).toBe(1)
  })

  it('does NOT record when memory service is missing (and warns once)', () => {
    const services = makeServices()
    const warn = warnSpy()
    const { container } = render(
      <ActionProvider plugins={[memory]} services={services as never}>
        <Action name="cta">
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    fireEvent.click(btn)
    fireEvent.click(btn)
    const serviceWarns = warn.mock.calls.filter((call) =>
      /service/i.test(String(call[0])),
    )
    expect(serviceWarns.length).toBe(1)
  })

  it('multiple Actions with different names each record independently', () => {
    const store = makeMockMemory()
    const services = makeServices(store)
    const { container } = render(
      <ActionProvider plugins={[memory]} services={services as never}>
        <div>
          <Action name="a">
            <button type="button">x</button>
          </Action>
          <Action name="b">
            <button type="button">y</button>
          </Action>
        </div>
      </ActionProvider>,
    )
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0]!)
    fireEvent.click(buttons[1]!)
    fireEvent.click(buttons[0]!)
    expect(store.record).toHaveBeenCalledTimes(3)
    expect(store.record).toHaveBeenNthCalledWith(1, 'a')
    expect(store.record).toHaveBeenNthCalledWith(2, 'b')
    expect(store.record).toHaveBeenNthCalledWith(3, 'a')
  })
})
