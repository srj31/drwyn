# @drwyn/react

## 0.3.0

### Minor Changes

- First stable (non-alpha) release; version aligned to `0.3.0` across all `@drwyn/*` packages.
- `analytics` plugin now enriches `track` click/submit events with the current snapshot recorded by `@drwyn/store`'s `capture` plugin (read via an optional `snapshots` service). It is a no-op when no `snapshots` service is registered, so existing behavior is unchanged.
- Built-in plugin propKeys (`track`, `flag`, `mount`, `visibility`) are now registered directly on the base `ActionPluginRegistry`, so external consumers get `<Action>` prop typing without a manual `declare module` augmentation. (Previously the relative-path augmentation did not survive the `.d.ts` bundle for consumers.)

## 0.2.0-alpha.1

### Patch Changes

- Peer dependency `@drwyn/memory` now uses `^0.2.0-alpha.1` instead of the unresolved `workspace:*` protocol, so the package installs cleanly outside the monorepo.
- Updated dependencies
  - @drwyn/memory@0.2.0-alpha.1

## 0.2.0-alpha.0

### Minor Changes

- 0c5f539: Initial alpha release (`0.2.0-alpha.0`). Published under the `alpha` npm tag — install with `bun add @drwyn/react@alpha`. API may change before v0.2 final.

  - `<ActionProvider>` for registering plugins and services at the app root.
  - `<Action>` wrapper component with `region` (default) and `inline` modes.
  - Plugin runtime with four lifecycle phases: `gate`, `mount`, `event`, `visibility`.
  - Four built-in plugins: `analytics`, `flag`, `mount`, `visibility`.
  - `definePlugin` helper for authoring plugins with full TypeScript inference.
  - Shared IntersectionObserver pool, dev-only warnings, fail-open error isolation.
  - ESM-only build with preserved `'use client'` directive for Next.js App Router.
  - Three subpath exports: `@drwyn/react`, `@drwyn/react/plugin`, `@drwyn/react/plugins`.

### Patch Changes

- Updated dependencies [3677a9f]
  - @drwyn/memory@0.2.0-alpha.0
