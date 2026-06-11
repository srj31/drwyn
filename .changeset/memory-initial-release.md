---
'@drwyn/memory': minor
---

Initial alpha release. Per-user adaptive memory + the first adaptive primitive.

- `createMemoryStore({ cloud? })` — IndexedDB-backed local memory with sync reads, fire-and-forget writes, debounced cloud sync (5s) when a `DrwynClient` is provided.
- Anonymous UUID per device via `localStorage`; `setUserId('real')` overrides for authed users with anon → authed migration on the backend.
- `memory` plugin — always-on event observer that auto-records every `<Action name="...">` click.
- `surface` plugin — render-phase visibility decider. Returns `'full' | 'collapsed' | 'hidden'` via a render-prop child based on use-count thresholds (`promoteAfter`, `collapseUntil`, opt-in `hideAfter`).
- Mount-snapshot semantics — surface decisions freeze at mount, adapt on next route navigation. Zero hydration flash.
- Subpath import for ergonomics: `import { memory, surface, createMemoryStore } from '@drwyn/react/memory'`.
- `AuthClient`-style adapter boundary — swap providers by replacing one file.
