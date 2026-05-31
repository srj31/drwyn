import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Action } from '../../src/action'
import { mount as mountPlugin } from '../../src/plugins/mount'
import { ActionProvider } from '../../src/provider'

describe('mount plugin', () => {
  it('fires the configured event through the sink on mount only', () => {
    const sink = vi.fn()
    const { unmount } = render(
      <ActionProvider plugins={[mountPlugin]} services={{ sink }}>
        <Action mount={{ event: 'pricing_loaded', props: { region: 'us' } }}>
          <span>x</span>
        </Action>
      </ActionProvider>,
    )
    expect(sink).toHaveBeenCalledWith({
      name: 'pricing_loaded',
      props: { region: 'us' },
    })

    sink.mockClear()
    unmount()
    expect(sink).not.toHaveBeenCalled()
  })

  it('invokes the callback form on mount and unmount', () => {
    const onMount = vi.fn()
    const onUnmount = vi.fn()
    const { unmount } = render(
      <ActionProvider plugins={[mountPlugin]}>
        <Action mount={{ onMount, onUnmount }}>
          <span>x</span>
        </Action>
      </ActionProvider>,
    )
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onUnmount).not.toHaveBeenCalled()
    unmount()
    expect(onUnmount).toHaveBeenCalledTimes(1)
  })
})
