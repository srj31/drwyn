# `@drwyn/react`

Plugin-driven wrapper component for React and Next.js. Compose analytics, feature flags, mount/visibility events, and custom actions onto any subtree.

> ⚠️ **Alpha release** (`0.2.0-alpha.1`). API may change before v0.2 final. Install from the `alpha` npm tag.

```bash
bun add @drwyn/react@alpha
# or: npm install @drwyn/react@alpha
# or: pnpm add @drwyn/react@alpha
```

## Quick start

```tsx
// app/providers.tsx
'use client'

import { ActionProvider } from '@drwyn/react'
import { analytics, flag, mount, visibility } from '@drwyn/react/plugins'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActionProvider
      plugins={[analytics, flag, mount, visibility]}
      services={{
        sink: (e) => posthog.capture(e.name, e.props),
        flagSource: { isOn: (key) => growthbook.isOn(key) },
      }}
    >
      {children}
    </ActionProvider>
  )
}
```

```tsx
// app/pricing/page.tsx
import { Action } from '@drwyn/react'

export default function PricingPage() {
  return (
    <Action
      flag="new-checkout"
      track={{ click: 'cta_clicked', props: { plan: 'pro' } }}
      visibility={{ event: 'cta_viewed', once: true }}
    >
      <PricingCard />
    </Action>
  )
}
```

## Features

- **Plugin-based** — four built-in plugins (`analytics`, `flag`, `mount`, `visibility`), unlimited custom ones via `definePlugin`.
- **Strongly typed** — `<Action>` props auto-complete based on registered plugins via TypeScript module augmentation.
- **Two wrap modes** — `region` (wraps with a div) or `inline` (clones the single child).
- **Render-time gating** — `flag` plugin decides what renders without flicker.
- **Server-component friendly** — works in Next.js App Router (with `'use client'`).
- **Tiny** — ~10 KB minified, ESM-only, zero runtime deps.
- **Adaptive UI add-on** — pair with [`@drwyn/memory`](../memory) for per-user surface promotion / collapse / hide based on usage frequency.

## Where you'd use it

- **One-prop click tracking** on any button without `onClick` boilerplate (`track={{ click: 'cta_clicked' }}`).
- **Feature-flag gating** without scattering `if (flags.has(...))` through your tree (`flag="my-flag"`).
- **Impression tracking** when an element enters the viewport, on a shared IntersectionObserver (`visibility={{ event: 'viewed', once: true }}`).
- **Declarative mount side effects** as an alternative to `useEffect` + manual cleanup (`mount={{ on, off }}`).
- **Per-user adaptive UI** when paired with `@drwyn/memory` — pricing CTAs that promote themselves to interested users, dashboard panels that hide when ignored, settings tours that self-dismiss.

[Full use-cases catalog →](../../apps/docs/content/use-cases.mdx)

## API at a glance

| Export | From | Purpose |
|---|---|---|
| `<ActionProvider>` | `@drwyn/react` | Root provider, registers plugins + services |
| `<Action>` | `@drwyn/react` | The wrapper component |
| `useActionRuntime()` | `@drwyn/react` | Escape-hatch hook for plugin context |
| `definePlugin()` | `@drwyn/react/plugin` | Plugin authoring helper |
| `analytics`, `flag`, `mount`, `visibility` | `@drwyn/react/plugins` | Built-in plugins |

## Authoring a plugin

```ts
import { definePlugin } from '@drwyn/react/plugin'

export const confetti = definePlugin({
  name: 'confetti',
  propKey: 'celebrate',
  config: {} as { color: 'gold' | 'silver' },
  events: {
    click: (_e, cfg) => shootConfetti(cfg.color),
  },
})

// Augment the registry so <Action celebrate={{...}}> is typed:
declare module '@drwyn/react' {
  interface ActionPluginRegistry {
    confetti: typeof confetti
  }
}
```

## Documentation

Full docs at [drwyn.dev](https://drwyn.dev).

## License

[MIT](../../LICENSE)
