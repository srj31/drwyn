# drwyn

Wrap any React or Next.js subtree with plugin-driven analytics, feature flags, mount/visibility events, and custom actions.

```tsx
<ActionProvider plugins={[analytics, flag, mount, visibility]} services={{ sink, flagSource }}>
  <Action
    mode="inline"
    flag="new-checkout"
    track={{ click: 'cta_clicked', props: { plan: 'pro' } }}
    visibility={{ event: 'cta_viewed', once: true }}
  >
    <button>Buy</button>
  </Action>
</ActionProvider>
```

## Packages (MIT, on npm)

| Package | Description | Version |
|---|---|---|
| [`@drwyn/react`](./packages/react) | React/Next.js wrapper component with the plugin runtime and four built-in plugins | `0.3.0` |
| [`@drwyn/memory`](./packages/memory) | Per-user adaptive memory: IndexedDB-backed local memory + optional cloud sync, the `memory` plugin (auto-records `<Action>` clicks), and the `surface` adaptive primitive | `0.3.0` |
| [`@drwyn/client`](./packages/client) | Thin TypeScript SDK that talks to a drwyn cloud backend over HTTP | `0.3.0` |
| [`@drwyn/store`](./packages/store) | Capture the values that existed when a drwyn action fired — queryable snapshots + track-event enrichment. | `0.3.0` |

> drwyn `0.3.0` — the first stable release. Install the packages you need (see below).

## What's in this repo

| Directory | License | Description |
|---|---|---|
| `packages/*` | MIT | The OSS library (React component, memory, client SDK). Install from npm. |
| `apps/docs/` | MIT | Developer documentation (drwyn.dev/docs). |
| `apps/example/` | MIT | Reference Next.js app wiring up the OSS library against a drwyn project. |

Everything in this repository is MIT. The hosted product (FastAPI backend + customer dashboard at drwyn.dev) is proprietary and lives in a separate private repository.

If you want to self-host an event ingestion + memory backend for the OSS packages, you can build one — `@drwyn/client` talks to the backend via a documented HTTP contract (`POST /events`, `GET/POST /memory`).

## Getting started

```bash
bun add @drwyn/react
# or: npm install @drwyn/react
# or: pnpm add @drwyn/react
```

See the [docs site](https://drwyn.dev) (or the [`docs/`](./docs) folder) for usage, concepts, and recipes.

## Why drwyn

The same `<Action>` component lets you layer behaviors around any UI element:

- **Analytics** — track clicks, focuses, submits with one prop.
- **Feature flags** — gate render-time with `flag="my-flag"`.
- **Impression tracking** — `visibility={{ event: 'viewed', once: true }}`.
- **Adaptive UI** — `surface={{ promoteAfter: 5 }}` promotes a CTA only for users who've shown interest (via `@drwyn/memory`).
- **Custom plugins** — `definePlugin` for anything else.

Plugins are tiny objects with up to five lifecycle hooks: `gate`, `mount`, `events`, `visibility`, `render`. The runtime is React-agnostic and fully unit-tested.

## Where you'd use it

Eight concrete scenarios spanning one-prop click tracking → per-user adaptive UI, in [`apps/docs/content/use-cases.mdx`](./apps/docs/content/use-cases.mdx). The short version:

| Use case | Plugins | What you get |
|---|---|---|
| Click tracking on any element | `analytics` | One prop → events forwarded to your sink. |
| Feature-flag gating | `flag` | One prop → subtree renders or returns `null`. |
| Impression tracking | `visibility` | Shared IntersectionObserver, fires on viewport entry. |
| Run-once mount side effects | `mount` | Declarative `useEffect` replacement. |
| Pricing CTA that promotes itself | `memory` + `surface` | CTA expands only for users who've clicked it 3+ times. |
| Dashboard panels that hide when ignored | `memory` + `surface` | Each user's dashboard distills to the panels they use. |
| Contextual docs feedback | `memory` + `surface` + `visibility` | Feedback widget appears only on pages a user engaged with. |
| Self-hiding settings tour | `memory` + `surface` | After N dismissals, the tooltip stops rendering. Forever. |

## License

[MIT](./LICENSE)
