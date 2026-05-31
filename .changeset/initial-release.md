---
'@drwyn/react': minor
---

Initial public release.

- `<ActionProvider>` for registering plugins and services at the app root.
- `<Action>` wrapper component with `region` (default) and `inline` modes.
- Plugin runtime with four lifecycle phases: `gate`, `mount`, `event`, `visibility`.
- Four built-in plugins: `analytics`, `flag`, `mount`, `visibility`.
- `definePlugin` helper for authoring plugins with full TypeScript inference.
- Shared IntersectionObserver pool, dev-only warnings, fail-open error isolation.
- ESM-only build with preserved `'use client'` directive for Next.js App Router.
- Three subpath exports: `@drwyn/react`, `@drwyn/react/plugin`, `@drwyn/react/plugins`.
