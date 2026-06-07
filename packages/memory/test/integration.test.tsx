import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Action, ActionProvider } from '@drwyn/react'
import { createMemoryStore, memory, surface } from '../src'
import { createUserIdSource } from '../src/store/user-id'
import type { MemoryStore } from '../src/types'

class MemStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
}

const baseServices = (memoryService: MemoryStore) => ({
  memory: memoryService,
  sink: () => {},
  flagSource: { isOn: () => undefined },
  logger: { warn: () => {}, error: () => {} },
})

let dbName: string

beforeEach(() => {
  dbName = `drwyn-int-${Math.random().toString(36).slice(2)}`
})

afterEach(async () => {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(dbName)
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('@drwyn/memory integration', () => {
  it('memory + surface: 6 clicks then remount → adaptation flips defaultVisibility to "full"', async () => {
    const userId = createUserIdSource({ storage: new MemStorage(), uuid: () => 'integration-user' })
    const store = createMemoryStore({ dbName, userId })
    await store.ready

    const services = baseServices(store)

    function App({ instanceKey }: { instanceKey: string }) {
      return (
        <ActionProvider plugins={[memory, surface]} services={services}>
          <Action
            key={instanceKey}
            name="cta-primary"
            surface={{ defaultVisibility: 'collapsed' }}
          >
            {(v) => <button type="button" data-testid="cta">{v}</button>}
          </Action>
        </ActionProvider>
      )
    }

    const { container, rerender } = render(<App instanceKey="mount-1" />)

    // Initial: 0 uses → collapsed (defaultVisibility)
    expect(container.querySelector('[data-testid="cta"]')?.textContent).toBe('collapsed')
    expect(store.uses('cta-primary')).toBe(0)

    // Click 6 times — memory plugin records each click.
    const btn = container.querySelector('button')!
    for (let i = 0; i < 6; i++) {
      fireEvent.click(btn)
    }
    expect(store.uses('cta-primary')).toBe(6)

    // Same mount: visibility doesn't flip (mount-snapshot semantics).
    expect(container.querySelector('[data-testid="cta"]')?.textContent).toBe('collapsed')

    // Force remount via key change — surface plugin now sees uses=6 >= promoteAfter=5 → 'full'.
    rerender(<App instanceKey="mount-2" />)
    expect(container.querySelector('[data-testid="cta"]')?.textContent).toBe('full')
  })

  it('uses heuristic with hideAfter opt-in: 25 uses + hideAfter=20 → hidden on next mount', async () => {
    const userId = createUserIdSource({ storage: new MemStorage(), uuid: () => 'integration-user-2' })
    const store = createMemoryStore({ dbName, userId })
    await store.ready

    // Pre-record 25 uses directly via the store (faster than 25 fireEvent.click calls).
    for (let i = 0; i < 25; i++) {
      store.record('cta-hide')
    }
    expect(store.uses('cta-hide')).toBe(25)

    const services = baseServices(store)

    const { container } = render(
      <ActionProvider plugins={[memory, surface]} services={services}>
        <Action name="cta-hide" surface={{ defaultVisibility: 'full', hideAfter: 20 }}>
          {(v) => v === 'hidden' ? null : <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    // hidden → render returns null
    expect(container.querySelector('[data-testid="v"]')).toBeNull()
  })

  it('store persists across instances: action recorded in one store appears in the next', async () => {
    const userId = createUserIdSource({ storage: new MemStorage(), uuid: () => 'persist-user' })

    // First store: record some clicks via the plugin pipeline.
    const store1 = createMemoryStore({ dbName, userId })
    await store1.ready

    const services1 = baseServices(store1)
    const { container, unmount } = render(
      <ActionProvider plugins={[memory, surface]} services={services1}>
        <Action name="persisted-cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <button type="button" data-testid="b">{v}</button>}
        </Action>
      </ActionProvider>,
    )
    const btn = container.querySelector('button')!
    for (let i = 0; i < 5; i++) fireEvent.click(btn)
    expect(store1.uses('persisted-cta')).toBe(5)
    unmount()

    // Wait a tick for IDB writes to flush.
    await new Promise((r) => setTimeout(r, 50))

    // Second store: same dbName + userId → should load the persisted count.
    const store2 = createMemoryStore({ dbName, userId })
    await store2.ready
    expect(store2.uses('persisted-cta')).toBe(5)

    const services2 = baseServices(store2)
    const { container: c2 } = render(
      <ActionProvider plugins={[memory, surface]} services={services2}>
        <Action name="persisted-cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v2">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(c2.querySelector('[data-testid="v2"]')?.textContent).toBe('full')  // uses=5 >= promoteAfter=5
  })
})
