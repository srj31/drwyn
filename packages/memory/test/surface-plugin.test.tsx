import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Action, ActionProvider } from '@drwyn/react'
import type { MemoryStore } from '../src/types'
import { surface } from '../src/plugins/surface-plugin'

declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    surface: typeof surface
  }
  interface ActionServicesRegistry {
    memory: MemoryStore
  }
}

function makeMemory(uses: Record<string, number> = {}): MemoryStore {
  return {
    uses: (name) => uses[name] ?? 0,
    lastSeen: () => null,
    record: () => {},
    setUserId: () => {},
    ready: Promise.resolve(),
    flush: async () => {},
  }
}

const baseServices = (memory: MemoryStore) => ({
  memory,
  sink: () => {},
  flagSource: { isOn: () => undefined },
  logger: { warn: () => {}, error: () => {} },
})

describe('surface plugin defaults (P3.14)', () => {
  it('returns defaultVisibility when actionName is missing', () => {
    const services = baseServices(makeMemory({ cta: 100 }))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        {/* No name prop */}
        <Action surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })

  it('returns defaultVisibility when uses === 0 (below collapseUntil)', () => {
    const services = baseServices(makeMemory({}))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })

  it('returns defaultVisibility when memory service is missing', () => {
    const services = {
      sink: () => {},
      flagSource: { isOn: () => undefined },
      logger: { warn: () => {}, error: () => {} },
    }
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })
})

describe('surface heuristic (P3.15)', () => {
  it('promotes to full when uses >= promoteAfter (default 5)', () => {
    const services = baseServices(makeMemory({ cta: 5 }))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('full')
  })

  it('collapses when collapseUntil <= uses < promoteAfter (3-4 uses)', () => {
    const services3 = baseServices(makeMemory({ cta: 3 }))
    const { container: c3 } = render(
      <ActionProvider plugins={[surface]} services={services3 as never}>
        <Action name="cta" surface={{ defaultVisibility: 'full' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(c3.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')

    const services4 = baseServices(makeMemory({ cta: 4 }))
    const { container: c4 } = render(
      <ActionProvider plugins={[surface]} services={services4 as never}>
        <Action name="cta" surface={{ defaultVisibility: 'full' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(c4.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })

  it('respects per-surface promoteAfter / collapseUntil overrides', () => {
    const services = baseServices(makeMemory({ cta: 10 }))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action
          name="cta"
          surface={{ defaultVisibility: 'collapsed', promoteAfter: 100, collapseUntil: 50 }}
        >
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    // uses=10, but promoteAfter=100 and collapseUntil=50 → 10 < 50 → defaultVisibility
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })

  it('hideAfter is opt-in: when set, uses >= hideAfter returns hidden', () => {
    const services = baseServices(makeMemory({ cta: 50 }))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'full', hideAfter: 20 }}>
          {(v) => <span data-testid="v">{v ?? 'none'}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('hidden')
  })

  it('hideAfter takes precedence over promoteAfter', () => {
    const services = baseServices(makeMemory({ cta: 25 }))
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'full', hideAfter: 20 }}>
          {(v) => <span data-testid="v">{v ?? 'none'}</span>}
        </Action>
      </ActionProvider>,
    )
    // uses=25, hideAfter=20, also >= default promoteAfter=5 → hidden wins
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('hidden')
  })
})

describe('surface mount-snapshot semantics (P3.16)', () => {
  it('does NOT re-evaluate when memory mutates after mount', () => {
    let usesValue = 0
    const memory: MemoryStore = {
      uses: () => usesValue,
      lastSeen: () => null,
      record: () => {
        usesValue++
      },
      setUserId: () => {},
      ready: Promise.resolve(),
      flush: async () => {},
    }
    const services = baseServices(memory)
    const { container } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    // Initially uses=0 → defaultVisibility='collapsed'
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')

    // Mutate uses externally — visibility should NOT change without remount
    usesValue = 10
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')
  })

  it('re-evaluates on remount (key change)', () => {
    let usesValue = 0
    const memory: MemoryStore = {
      uses: () => usesValue,
      lastSeen: () => null,
      record: () => {},
      setUserId: () => {},
      ready: Promise.resolve(),
      flush: async () => {},
    }
    const services = baseServices(memory)
    const { container, rerender } = render(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action key="v1" name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('collapsed')

    usesValue = 10
    rerender(
      <ActionProvider plugins={[surface]} services={services as never}>
        <Action key="v2" name="cta" surface={{ defaultVisibility: 'collapsed' }}>
          {(v) => <span data-testid="v">{v}</span>}
        </Action>
      </ActionProvider>,
    )
    expect(container.querySelector('[data-testid="v"]')?.textContent).toBe('full')
  })
})
