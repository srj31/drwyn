import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { ActionProvider } from '../src/provider'

let receivedName: string | undefined
let receivedConfig: unknown

const captureNamePlugin = definePlugin({
  name: 'capture',
  propKey: 'capture',
  config: {} as Record<string, unknown>,
  events: {
    click: (_e, _cfg, ctx) => {
      receivedName = ctx.actionName
    },
  },
})

const configCapturePlugin = definePlugin({
  name: 'cfg-capture',
  propKey: 'cfgCapture',
  config: {} as Record<string, unknown>,
  events: {
    click: (_e, cfg, _ctx) => {
      receivedConfig = cfg
    },
  },
})

declare module '../src/types' {
  interface ActionPluginRegistry {
    capture: typeof captureNamePlugin
    cfgCapture: typeof configCapturePlugin
  }
}

describe('<Action name>', () => {
  beforeEach(() => {
    receivedName = undefined
    receivedConfig = undefined
  })

  it('exposes name via ctx.actionName to event handlers', () => {
    const { container } = render(
      <ActionProvider plugins={[captureNamePlugin]}>
        <Action name="cta-primary" capture={{}}>
          <button type="button">click me</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(receivedName).toBe('cta-primary')
  })

  it('name is undefined in ctx when not provided', () => {
    const { container } = render(
      <ActionProvider plugins={[captureNamePlugin]}>
        <Action capture={{}}>
          <button type="button">click me</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(receivedName).toBeUndefined()
  })

  it('does not leak name into plugin configs (name is reserved)', () => {
    const { container } = render(
      <ActionProvider plugins={[configCapturePlugin]}>
        <Action name="my-action" cfgCapture={{ foo: 'bar' }}>
          <button type="button">x</button>
        </Action>
      </ActionProvider>,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(receivedConfig).toEqual({ foo: 'bar' })
  })
})
