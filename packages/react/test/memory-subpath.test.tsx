import { describe, expect, it } from 'vitest'
import * as memorySubpath from '@drwyn/react/memory'

describe('@drwyn/react/memory subpath', () => {
  it('re-exports the memory module', () => {
    expect(memorySubpath.memory).toBeDefined()
    expect(memorySubpath.surface).toBeDefined()
    expect(memorySubpath.createMemoryStore).toBeDefined()
  })
})
