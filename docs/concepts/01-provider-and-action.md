# Concept: Provider + Action

The library has two top-level pieces a consumer touches: **`<ActionProvider>`** and **`<Action>`**. This doc explains the pattern they form.

## The pattern: React Context

`<ActionProvider>` is a **React Context provider**. It does two things:

1. Holds the list of registered plugins and the shared services (analytics sink, flag source, logger, error handler) in one place.
2. Exposes that bundle to any descendant component via React's `useContext` mechanism.

`<Action>` is just a component that *reads* the context (via `useActionRuntime()`) and uses what it finds to run plugin lifecycle phases around its children.

## You've seen this in

| Library | Provider | Hook |
|---|---|---|
| TanStack Query | `<QueryClientProvider client={qc}>` | `useQuery()` |
| MUI | `<ThemeProvider theme={t}>` | `useTheme()` |
| Apollo Client | `<ApolloProvider client={c}>` | `useQuery()` |
| Redux Toolkit | `<Provider store={s}>` | `useSelector()` |
| Clerk | `<ClerkProvider>` | `useUser()` |

It's the same shape every time: one provider at the root, a hook to read it anywhere below.

## Why we throw if used outside the provider

```ts
const value = useContext(ActionContext)
if (!value) {
  throw new Error('[drwyn] useActionRuntime/<Action> used outside an <ActionProvider>...')
}
```

If a developer drops an `<Action>` into a tree that has no `<ActionProvider>` above it, `useContext` returns `null` and our hook throws a helpful error pointing them at the fix.

Without this check, the failure mode would be "everything looks fine but nothing happens" — much harder to debug. TanStack Query and Apollo Client both do exactly this for the same reason.

## Why the services live on the provider, not on `<Action>`

A consumer typically has *one* analytics sink (Segment, PostHog, etc.) and *one* flag source (GrowthBook, LaunchDarkly) for their entire app. Putting them on the provider means you configure once at the root. Each `<Action>` just inherits.

This is also why `plugins` is on the provider: registering a plugin is a one-time setup decision, not a per-component one.

## Why `plugins` order matters

The plugins array on `<ActionProvider>` is also the *execution order* for each phase — first plugin to return `block` from a gate wins; event handlers run in this order; mount/cleanup follow this order. This is load-bearing and explicit by design: implicit ordering algorithms make behavior surprising.

## Minimal example

```tsx
'use client'  // App Router requires this; Pages Router / Vite / CRA don't need it

import { ActionProvider } from '@drwyn/react'
import { analytics, flag } from '@drwyn/react/plugins'

export function Providers({ children }) {
  return (
    <ActionProvider
      plugins={[analytics, flag]}
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

That's the whole setup. From here, any `<Action>` in the tree picks up `track`, `flag`, etc. as type-checked props.
