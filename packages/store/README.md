# `@drwyn/store`

Capture the **values that existed when an action was taken** for [`@drwyn/react`](../react). An in-memory, queryable snapshot store + a `capture` plugin + two hooks. Each tracked action is also enriched with its snapshot, so your analytics event carries the surrounding context.

```bash
bun add @drwyn/react @drwyn/store
```

## What's in the box

- **`createSnapshotStore`** — in-memory snapshot store with a per-action ring buffer. Reads via `last(name)` / `history(name)`; point-in-time clones so snapshots are immune to later mutation.
- **`capture` plugin** — always-on event observer that records a snapshot on every `<Action>` click/submit. Zero per-`<Action>` config; just include the plugin.
- **`useDrwynCapture(key, value)`** — contribute component-local state to every snapshot while the component is mounted, without prop drilling.
- **`useDrwynSnapshot(actionName)`** — reactively read the latest snapshot for an action.

## How a snapshot is built

Three sources merge into one snapshot, **most specific wins**:

1. **Central getters** passed to `createSnapshotStore({ capture })` — ambient values read on every action (route, current user, active flags…).
2. **`useDrwynCapture` contributors** — values from components that are currently mounted.
3. **Per-`<Action>` `capture` prop** — values specific to one action.

## Quick start

One-time provider edit — register `capture` **before** `analytics` (handlers fire in plugin order, so the snapshot exists when analytics enriches its event):

```tsx filename="app/providers.tsx"
'use client'
import { ActionProvider } from '@drwyn/react'
import { analytics } from '@drwyn/react/plugins'
import { capture, createSnapshotStore } from '@drwyn/store'

const snapshots = createSnapshotStore({
  capture: { route: () => location.pathname },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActionProvider
      plugins={[capture, analytics]}
      services={{ snapshots, sink: (e) => posthog.capture(e.name, e.props) }}
    >
      {children}
    </ActionProvider>
  )
}
```

**Every existing `<Action name="…" track={…}>` is now enriched automatically** — no per-site edits. Opt-in extras:

```tsx
import { Action } from '@drwyn/react'
import { useDrwynCapture, useDrwynSnapshot } from '@drwyn/store'

function AddToCart() {
  const [qty, setQty] = useState(1)
  useDrwynCapture('qty', () => qty) // contributes to every snapshot while mounted

  const last = useDrwynSnapshot('add-to-cart') // reactive read

  return (
    <Action name="add-to-cart" track={{ click: 'add_to_cart' }} capture={() => ({ sku: 'TSHIRT-01' })}>
      <button>Add {qty} to cart</button>
    </Action>
  )
}
```

Clicking emits `add_to_cart` with props `{ route, qty, sku }` to your sink **and** stores the same snapshot, readable via `useDrwynSnapshot('add-to-cart')` or `snapshots.last('add-to-cart')`.

## Where you'd use it

- **Context-rich analytics** — every `track` event carries the route, cart total, active experiment, and form state at click time, with no manual prop plumbing.
- **Repro for bug reports** — read `snapshots.history('checkout')` to see the values behind the last few checkout attempts.
- **Debugging adaptive UI** — inspect exactly what the world looked like when a user triggered an action.

## Notes

- **In-memory only.** Snapshots live for the session (ring buffer, default 25 per action). No IndexedDB, no separate cloud sync — the snapshot rides along in the `track` event to wherever your sink sends it.
- **SSR-safe.** The store is pure in-memory and `useDrwynSnapshot` uses `useSyncExternalStore` with an empty server snapshot, so it works in the Next.js App Router.
- **Serializable values.** Snapshots are cloned via `structuredClone`; non-serializable values are dropped with a dev warning.

## Documentation

Full docs at [drwyn.dev](https://drwyn.dev).

## License

[MIT](../../LICENSE)
