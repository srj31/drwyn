# `@drwyn/memory`

Per-user adaptive memory + the first adaptive primitive (`surface`) for [`@drwyn/react`](../react). IndexedDB-backed local memory, optional cloud sync via [`@drwyn/client`](../client).

```bash
bun add @drwyn/react @drwyn/memory
```

## What's in the box

- **`createMemoryStore`** — per-user store with synchronous reads, fire-and-forget writes, debounced cloud sync (5 s) when a `DrwynClient` is provided. Anonymous UUID per device via `localStorage`; `setUserId('real')` overrides for authed users with backend migration.
- **`memory` plugin** — always-on event observer that auto-records every `<Action name="...">` click. Zero config; just include the plugin.
- **`surface` plugin** — render-phase visibility decider. Returns `'full' | 'collapsed' | 'hidden'` via render-prop child based on use-count thresholds. Mount-snapshot semantics — decisions freeze at mount, adapt on next route navigation. Zero hydration flash.

## Quick start

```tsx filename="app/providers.tsx"
'use client'
import { ActionProvider } from '@drwyn/react'
import { memory, surface, createMemoryStore } from '@drwyn/memory'

const memoryStore = createMemoryStore()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActionProvider plugins={[memory, surface]} services={{ memory: memoryStore }}>
      {children}
    </ActionProvider>
  )
}
```

```tsx
import { Action } from '@drwyn/react'

<Action
  name="pricing-cta"
  surface={{ defaultVisibility: 'collapsed', promoteAfter: 5 }}
>
  {(visibility) =>
    visibility === 'full' ? <HeroPricingCard /> : <SmallPricingLink />
  }
</Action>
```

The CTA stays subtle by default. After five clicks (tracked automatically), `surface` returns `'full'` on the next route navigation — for **that user only**.

## Where you'd use it

- **Pricing CTA that promotes itself** — expand the CTA only for users who've already clicked it N times (`promoteAfter: 3`).
- **Dashboard panels that hide when ignored** — each user's dashboard distills to the panels they actually use.
- **Contextual docs feedback** — render the "did this help?" widget only on pages a user engaged with.
- **Settings tour that self-dismisses** — after N dismissals (`hideAfter: 3`), the tooltip stops rendering for that user. Forever.

[Full use-cases catalog →](../../apps/docs/content/use-cases.mdx)

## Cloud sync (optional)

Pass a `DrwynClient` to enable cross-device sync to a hosted backend:

```ts
import { DrwynClient } from '@drwyn/client'
import { createMemoryStore } from '@drwyn/memory'

const drwyn = new DrwynClient({ projectKey: 'pk_...' })
const memoryStore = createMemoryStore({ cloud: drwyn })
```

Local IndexedDB stays the source of truth for reads. Writes hit IDB immediately and debounce-batch to the cloud every 5 s (and on `pagehide`). Initial cloud pull merges by `max(local, cloud)` per action.

Without `cloud`, memory is local-only — the OSS package works standalone.

## Subpath import

For consumers of `@drwyn/react` who want one fewer dep line:

```ts
import { memory, surface, createMemoryStore } from '@drwyn/react/memory'
```

Same module, re-exported via subpath.

## Documentation

Full docs at [drwyn.dev](https://drwyn.dev).

## License

[MIT](../../LICENSE)
