import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { definePlugin } from '../src/plugin/define'
import { __resetDevWarnCacheForTests } from '../src/plugin/dev-warn'
import { ActionProvider } from '../src/provider'

declare module '../src/types' {
  interface ActionPluginRegistry {
    warnA: ReturnType<typeof warnPluginA>
  }
}

function warnPluginA() {
  return definePlugin({ name: 'warnA', propKey: 'warnA', config: {} as boolean })
}

function warnPluginB() {
  return definePlugin({ name: 'warnB', propKey: 'warnA', config: {} as boolean })
}

describe('dev warnings', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetDevWarnCacheForTests()
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('warns when <Action> receives a prop claimed by no plugin', () => {
    render(
      <ActionProvider plugins={[warnPluginA()]}>
        <Action
          // @ts-expect-error testing runtime warning on unknown prop
          notAPlugin={{ x: 1 }}
        >
          <span>x</span>
        </Action>
      </ActionProvider>,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/unknown <Action> prop "notAPlugin"/i),
    )
  })

  it('warns when two plugins claim the same propKey', () => {
    render(
      <ActionProvider plugins={[warnPluginA(), warnPluginB()]}>
        <span>x</span>
      </ActionProvider>,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/propKey "warnA" claimed by multiple plugins: warnA, warnB/),
    )
  })
})
