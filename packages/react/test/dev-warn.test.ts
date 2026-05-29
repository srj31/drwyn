import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetDevWarnCacheForTests, devWarn } from '../src/plugin/dev-warn'

describe('devWarn', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetDevWarnCacheForTests()
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('emits a console.warn with [drwyn] prefix', () => {
    devWarn('hello world')
    expect(warn).toHaveBeenCalledWith('[drwyn] hello world')
  })

  it('dedupes by message — second identical call is silent', () => {
    devWarn('same message')
    devWarn('same message')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('treats different messages as distinct warnings', () => {
    devWarn('a')
    devWarn('b')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('is a no-op when NODE_ENV is production', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      devWarn('should be silent')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = prev
    }
  })
})
