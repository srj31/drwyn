import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { definePlugin } from '../src/plugin/define'
import { ActionProvider, useActionRuntime } from '../src/provider'

function Consumer() {
  const runtime = useActionRuntime()
  return <div data-testid="plugin-count">{runtime.plugins.length}</div>
}

describe('<ActionProvider>', () => {
  it('exposes registered plugins to descendants', () => {
    const p = definePlugin({ name: 'noop', propKey: 'noop' })

    render(
      <ActionProvider plugins={[p]}>
        <Consumer />
      </ActionProvider>,
    )

    expect(screen.getByTestId('plugin-count').textContent).toBe('1')
  })

  it('throws a helpful error when useActionRuntime is used without a provider', () => {
    const original = console.error
    console.error = () => {}
    try {
      expect(() => render(<Consumer />)).toThrow(/ActionProvider/)
    } finally {
      console.error = original
    }
  })
})
