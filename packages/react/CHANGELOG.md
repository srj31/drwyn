# @drwyn/react

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
