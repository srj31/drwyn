# `@drwyn/example`

Minimal Next.js App Router fixture wiring `@drwyn/react`, `@drwyn/memory`, and
`@drwyn/client` end-to-end against the local `apps/cloud` FastAPI backend.

Three adaptive widgets demonstrate the `surface` plugin:

- **Pricing CTA** — collapsed pill; promotes to a hero card after 5 clicks
- **Feature tour floater** — visible by default; hides after 3 dismissals
- **Nav list** — five items with diverse `promoteAfter` / `hideAfter` knobs

A `/debug` page renders the live `MemoryStore` state and lets you reset.

## Quickstart

```bash
# 1. Bring up Postgres (any way you like — Supabase, Docker, brew)
#    Then point apps/cloud at it via DATABASE_URL.

# 2. Run migrations
cd apps/cloud
uv run alembic upgrade head

# 3. Seed the example project (idempotent)
uv run python scripts/seed_example_project.py
# → seeded proj_example (public_key=pk_example_demo)

# 4. Start the backend
uv run uvicorn drwyn_cloud.main:app --reload
# → http://127.0.0.1:8000

# 5. In another terminal, install + boot the example app
cd ../..
bun install

cd apps/example
cp .env.example .env.local
bun dev
# → http://localhost:3000
```

Visit `localhost:3000`. Click the pricing CTA five times, then click `/debug`
in the header — when you come back, the pill has expanded into a hero card.
The feature-tour dismiss button hides itself after three clicks. The nav chips
adapt per-item based on which you use.

## Surfaces & knobs

| Widget | Action name | Defaults |
| --- | --- | --- |
| Pricing CTA | `pricing-cta` | `defaultVisibility: 'collapsed'`, `promoteAfter: 5` |
| Feature tour | `tour-dismiss` | `defaultVisibility: 'full'`, `hideAfter: 3` |
| Nav: docs | `nav-docs` | `defaultVisibility: 'full'`, `promoteAfter: 1` |
| Nav: pricing | `nav-pricing` | `defaultVisibility: 'collapsed'`, `promoteAfter: 3` |
| Nav: blog | `nav-blog` | `defaultVisibility: 'collapsed'`, `promoteAfter: 5` |
| Nav: community | `nav-community` | `defaultVisibility: 'collapsed'`, `promoteAfter: 4` |
| Nav: careers | `nav-careers` | `defaultVisibility: 'full'`, `hideAfter: 2` |

## How the loop works

1. Each click on an `<Action name="...">` fires the `memory` plugin which
   calls `MemoryStore.record(name)`.
2. `MemoryStore` updates an in-memory map (sync), persists to IndexedDB
   (fire-and-forget), and debounces a cloud write to `apps/cloud` every 5s.
3. The `surface` plugin reads `memory.uses(name)` at `<Action>` mount time
   and returns `'full' | 'collapsed' | 'hidden'`.
4. Because the decision is captured by `useMemo`, it only re-evaluates on a
   fresh mount — i.e. when you navigate routes. This intentional choice
   prevents mid-page visibility flips. Visit `/debug` and come back to see
   the next decision.

## Inspecting state

- **`/debug`** — table of known action names with `uses` + `lastSeen`. "Reset
  memory" clears the anon id, deletes the IDB database, and reloads.
- **DevTools → Application → IndexedDB → `drwyn-memory` → `action_uses`** —
  `${userId}::${actionName}` keys with `{ count, lastSeenMs }` values.
- **Postgres**:

  ```bash
  psql drwyn_dev -c "SELECT user_id, namespace, key, value FROM memory_entries;"
  ```

  After ~5s of debounce, you'll see one `value` blob per user containing the
  full action-uses map.

## Environment

`.env.local` (gitignored):

```
NEXT_PUBLIC_DRWYN_API_URL=http://localhost:8000
NEXT_PUBLIC_DRWYN_PROJECT_KEY=pk_example_demo
```

`NEXT_PUBLIC_DRWYN_API_URL` falls back to `http://localhost:8000` if unset.
`NEXT_PUBLIC_DRWYN_PROJECT_KEY` must match a row in `projects.public_key`;
the seed script inserts `pk_example_demo`.

## Known limitations

- `/debug` lists only known action names (the widgets and nav slugs). A
  future `MemoryStore.entries()` API would enumerate everything in IDB.
- Anon-id only. There is no login flow. The "Reset memory" button rotates
  the anon id so the next session looks like a fresh user.
- No automated end-to-end tests (Playwright lands in Month 3).
- Not deployable as-is — the demo assumes localhost. Deploy is Month 3.

## Screenshots

> Placeholder — fill in before the launch video.
>
> - `docs/static/example-home-collapsed.png` — pricing CTA in collapsed pill state
> - `docs/static/example-home-promoted.png` — same after 5 clicks + nav reload
> - `docs/static/example-debug.png` — `/debug` table with non-zero counts
