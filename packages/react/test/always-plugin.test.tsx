import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { ActionProvider } from '../src/provider'
import type { SurfaceVisibility } from '../src/types'

const eventsPlugin = definePlugin({
  name: 'observer',
  propKey: 'observer',
  config: {} as Record<string, unknown>,
  always: true,
  events: {
    click: (_e, _cfg, ctx) => {
      observerClickSpy(ctx.instanceId)
    },
  },
})

const observerClickSpy = vi.fn()

const mountPlugin = definePlugin({
  name: 'mounter',
  propKey: 'mounter',
  config: {} as Record<string, unknown>,
  always: true,
  mount: () => {
    mountSpy()
  },
})

const mountSpy = vi.fn()

const renderPlugin = definePlugin({
  name: 'renderer',
  propKey: 'renderer',
  config: {} as Record<string, unknown>,
  always: true,
  render: () => {
    renderSpy()
    return { visibility: 'collapsed' as SurfaceVisibility }
  },
})

const renderSpy = vi.fn()

const gatedPlugin = definePlugin({
  name: 'gated',
  propKey: 'gated',
  config: {} as Record<string, unknown>,
  events: {
    click: () => {
      gatedClickSpy()
    },
  },
})

const gatedClickSpy = vi.fn()

declare module '../src/types' {
  interface ActionPluginRegistry {
    observer: typeof eventsPlugin
    mounter: typeof mountPlugin
    renderer: typeof renderPlugin
    gated: typeof gatedPlugin
  }
}

describe('Plugin with always: true', () => {
  it('runs event handlers without a matching prop', () => {
    observerClickSpy.mockClear()
    const { container } = render(
      <ActionProvider plugins={[eventsPlugin]}>
        <Action>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(observerClickSpy).toHaveBeenCalledTimes(1)
  })

  it('runs mount without a matching prop', () => {
    mountSpy.mockClear()
    render(
      <ActionProvider plugins={[mountPlugin]}>
        <Action>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    expect(mountSpy).toHaveBeenCalledTimes(1)
  })

  it('runs render without a matching prop', () => {
    renderSpy.mockClear()
    render(
      <ActionProvider plugins={[renderPlugin]}>
        <Action>{(v) => <span data-testid="v">{v}</span>}</Action>
      </ActionProvider>,
    )
    expect(renderSpy).toHaveBeenCalled()
    expect(screen.getByTestId('v').textContent).toBe('collapsed')
  })

  it('regular plugin without always:true still requires propKey config', () => {
    gatedClickSpy.mockClear()
    const { container } = render(
      <ActionProvider plugins={[gatedPlugin]}>
        <Action>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(gatedClickSpy).not.toHaveBeenCalled()
  })
})
