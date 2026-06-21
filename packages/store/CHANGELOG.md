# @drwyn/store

## 0.3.0

### Minor Changes

- Initial release. Capture the values that existed when a drwyn action fired.

  - `createSnapshotStore({ capture?, maxPerAction? })` — in-memory, queryable snapshot store with a per-action ring buffer (default 25). Point-in-time clones so snapshots are immune to later mutation.
  - `capture` plugin — always-on; records a snapshot on every `<Action>` click/submit, merging three sources (central getters < `useDrwynCapture` contributors < per-`<Action>` `capture` prop; most specific wins).
  - `useDrwynCapture(key, value)` — contribute component-local state to every snapshot while mounted, without prop drilling.
  - `useDrwynSnapshot(actionName)` — reactively read the latest snapshot for an action (`useSyncExternalStore`-backed; SSR-safe).
  - Snapshots are merged into `@drwyn/react`'s `analytics` `track` event, so each tracked action carries its context in one event.
