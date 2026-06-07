import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useActionRuntime } from '@drwyn/react'
import { Providers } from '../app/providers'

function ServicesProbe() {
  const runtime = useActionRuntime()
  return (
    <pre data-testid="probe">
      {`memory=${String(typeof runtime.services.memory)};`}
      {`sink=${String(typeof runtime.services.sink)};`}
      {`flagSource=${String(typeof runtime.services.flagSource)};`}
      {`logger=${String(typeof runtime.services.logger)};`}
    </pre>
  )
}

describe('<Providers>', () => {
  beforeEach(() => {
    // Set env BEFORE the provider tries to read it (Providers calls getMemoryStore
    // which reads NEXT_PUBLIC_DRWYN_PROJECT_KEY).
    process.env.NEXT_PUBLIC_DRWYN_PROJECT_KEY = 'pk_test'
    process.env.NEXT_PUBLIC_DRWYN_API_URL = 'http://test.local'
  })

  it('wires memory, sink, flagSource, and logger services', () => {
    render(
      <Providers>
        <ServicesProbe />
      </Providers>,
    )
    const probe = screen.getByTestId('probe').textContent ?? ''
    expect(probe).toContain('memory=object')
    expect(probe).toContain('sink=function')
    expect(probe).toContain('flagSource=object')
    // logger is typically an object (console), but accept function too
    expect(probe).toMatch(/logger=(object|function)/)
  })
})
