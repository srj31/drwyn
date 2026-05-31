# Concept: The `<Action>` component

`<Action>` is where every piece of the library comes together — it's a wrapper component that reads the runtime, runs the plugin lifecycle, and renders the result.

## The render flow

Every time React renders an `<Action>`, this sequence runs:

```
1. useActionRuntime()
       → grabs plugins, services, onError from <ActionProvider>'s context

2. extractConfigs(props)
       → walks the props, skips mode/as/children
       → returns { [propKey]: configValue, ... }

3. runGate(plugins, configs, ctx, onError)
       → synchronous; returns 'pass' / 'block' / 'replace'
       → 'block' → render null and stop
       → 'replace' → use the replacement node as the render target
       → 'pass' → use children as the render target

4. buildHandlers(plugins, configs, ctx, onError)
       → merges every plugin's events map into one handler per event name

5. useEffect(() => runMount(plugins, configs, ctx, onError))
       → schedules mount and cleanup after React commits to the DOM

6. createElement(as, { ref, handlers, data-attr }, renderTarget)
       → renders a wrapping element (region mode) around the children
```

Steps 1–4 happen on every render. Step 5 only runs on first render (and again if dependencies change). Step 6 is the JSX result React commits to the DOM.

## Region mode (the default)

`mode="region"` (or no `mode` prop at all) renders a wrapping element around the children:

```tsx
<Action visibility={{ event: 'pricing_viewed' }}>
  <PricingCard />
</Action>

// renders:
<div data-drwyn-action="<instanceId>" onClick={mergedHandler}>
  <PricingCard />
</div>
```

The wrapping element is `<div>` by default but customizable via `as`:

```tsx
<Action as="section" visibility={{ event: 'p_view' }}>
  <h1>Pricing</h1>
  <PricingCards />
</Action>

// renders:
<section data-drwyn-action="..." onClick={...}>
  <h1>Pricing</h1>
  <PricingCards />
</section>
```

The wrapping element exists for three reasons:

1. **Event delegation** — the merged `onClick`/`onFocus`/etc. attach to the wrapper; events bubble up from any descendant.
2. **IntersectionObserver target** — visibility plugins need a real DOM element to observe (Task 16).
3. **Stable mount/unmount anchor** — React's lifecycle binds to the wrapper, not whatever the children render.

## The `as` prop and the `component` pattern

The `as` prop comes from a well-known React pattern that lets a component render as any HTML tag:

| Library | Equivalent |
|---|---|
| **MUI** | `<Box component="section">` |
| **Mantine** | `<Box component="article">` |
| **Chakra** | `<Box as="span">` |
| **Radix Slot** | `<Slot>` (related but different — clones the child) |

The default tag (`<div>`) is the safest choice for a generic wrapper. Use `as="section"`, `as="article"`, `as="aside"`, etc. when semantics matter.

## React hooks used

`<Action>` calls four React hooks, each for a specific job:

| Hook | Job |
|---|---|
| `useActionRuntime()` | Read `{ plugins, services, onError }` from `<ActionProvider>` context |
| `useId()` | Generate a stable per-instance id (used for the `data-drwyn-action` attribute; SSR-safe) |
| `useMemo(...)` | Stabilize the configs object and the context object so other hooks' dep-arrays don't re-fire every render |
| `useRef(null)` | Hold a reference to the wrapping DOM element (used by mount + visibility) |
| `useEffect(...)` | Schedule the mount phase after React commits |

`useId` is the most modern of these — added in React 18 specifically to give components stable, SSR-safe ids without hand-rolled counters or `Math.random()`.

## Why each phase uses its specific React mechanism

| Phase | React mechanism | Why this one |
|---|---|---|
| Gate | Inline (during render) | Must decide what to render *before* React commits; can't use `useEffect` (runs too late). |
| Render | `createElement(as, props, children)` | The library's only DOM-producing step. |
| Mount | `useEffect(fn, [])` | Runs after the element is in the DOM, gives us a place for cleanup on unmount. |
| Events | JSX `onClick` etc. (via merged handlers) | Standard React event attachment; cooperates with the child's own handlers in inline mode. |
| Visibility | `useEffect` to register with the IntersectionObserver pool | Observer setup is a side effect after the ref is attached. |

This is also why the runtime functions (`runGate`, `runMount`, `buildHandlers`) are pure JS — they're not hooks themselves, they're called *from* hooks inside `<Action>`.

## What this task implements vs what's deferred

**This task (Task 11): region mode only.** Wrapper element, gate, mount, events. The most common path.

**Task 13: inline mode.** Skips the wrapping element and clones the single child instead. Trickier — requires `composeRefs` (already built in Task 8) and child-element validation.

**Task 16: visibility wiring.** Connects each `<Action>` instance to the shared IntersectionObserver pool (Task 15).

So after this task, you'll be able to use every phase except visibility, in region mode.
