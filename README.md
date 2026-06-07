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
| [`@drwyn/react`](./packages/react) | React/Next.js wrapper component with the plugin runtime and four built-in plugins | `0.1.0-alpha.0` (alpha) |
| [`@drwyn/memory`](./packages/memory) | Per-user adaptive memory: IndexedDB-backed local memory + optional cloud sync, the `memory` plugin (auto-records `<Action>` clicks), and the `surface` adaptive primitive | `0.0.0` (unpublished) |
| [`@drwyn/client`](./packages/client) | Thin TypeScript SDK that talks to a drwyn cloud backend over HTTP | `0.0.0` (unpublished) |

> ⚠️ **Alpha release.** drwyn is in active development. Expect breaking changes before v1.0. Published under the `alpha` npm tag — install with `@alpha` (see below).

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
bun add @drwyn/react@alpha
# or: npm install @drwyn/react@alpha
# or: pnpm add @drwyn/react@alpha
```

See the [docs site](https://drwyn.dev) (or the [`docs/`](./docs) folder) for usage, concepts, and recipes.

## Why drwyn

The same `<Action>` component lets you layer behaviors around any UI element:

- **Analytics** — track clicks, focuses, submits with one prop.
- **Feature flags** — gate render-time with `flag="my-flag"`.
- **Impression tracking** — `visibility={{ event: 'viewed', once: true }}`.
- **Custom plugins** — `definePlugin` for anything else.

Plugins are tiny objects with up to four lifecycle hooks: `gate`, `mount`, `events`, `visibility`. The runtime is React-agnostic and fully unit-tested.

## License

[MIT](./LICENSE)
