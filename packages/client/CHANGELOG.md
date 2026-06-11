# @drwyn/client

## 0.2.0-alpha.0

### Minor Changes

- 3677a9f: Initial alpha release. Thin TypeScript SDK that talks to a drwyn cloud backend over HTTP.

  - `DrwynClient` class with three methods: `sendEvent`, `getMemory`, `setMemory`.
  - Bearer-key auth via `Authorization: Bearer pk_*`.
  - Server-friendly `fetch` wrapper — no DOM dependencies; works in browser, Node, Bun, edge runtimes.
  - Configurable `cloudUrl` (defaults to `https://api.drwyn.dev`).
  - Throws on non-2xx responses; surfaces server error bodies in `Error.message`.
  - ESM-only build with `'use client'` directive preserved for Next.js App Router consumers.
