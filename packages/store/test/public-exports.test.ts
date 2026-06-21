import { describe, expect, it } from 'vitest'
import {
  type CaptureConfig,
  type CreateSnapshotStoreOptions,
  type Snapshot,
  type SnapshotStore,
  capture,
  createSnapshotStore,
  useDrwynCapture,
  useDrwynSnapshot,
} from '../src/index'

describe('@drwyn/store public exports', () => {
  it('createSnapshotStore is a function', () => {
    expect(typeof createSnapshotStore).toBe('function')
  })

  it('capture plugin is an always-on plugin with the capture propKey', () => {
    expect(capture.name).toBe('capture')
    expect(capture.propKey).toBe('capture')
    expect(capture.always).toBe(true)
  })

  it('hooks are functions', () => {
    expect(typeof useDrwynCapture).toBe('function')
    expect(typeof useDrwynSnapshot).toBe('function')
  })

  it('type imports are usable (compile-time only)', () => {
    const _typeCheck: {
      snap?: Snapshot
      store?: SnapshotStore
      cfg?: CaptureConfig
      opts?: CreateSnapshotStoreOptions
    } = {}
    expect(_typeCheck).toBeDefined()
  })
})
