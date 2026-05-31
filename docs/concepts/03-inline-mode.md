# Concept: Inline mode (the cloning pattern)

`<Action mode="inline">` doesn't render a wrapping element — it **clones the single child** and merges drwyn's handlers and ref into it. Same pattern Radix calls `asChild`.

## The DOM difference

```tsx
// region mode (default) — extra wrapper
<Action visibility={{...}}>
  <button>Buy</button>
</Action>
// renders:
<div data-drwyn-action="abc" onClick={...}>
  <button>Buy</button>
</div>

// inline mode — no wrapper, behavior merged into child
<Action mode="inline" track={{ click: 'cta' }}>
  <button>Buy</button>
</Action>
// renders:
<button onClick={mergedHandler}>Buy</button>
```

Inline mode is for **interactive primitives** (buttons, links, inputs) where you don't want an extra DOM node. Region mode is for **sections** (cards, panels) where you do.

## You've seen this in

| Library | Their version |
|---|---|
| **Radix UI** | `<Dialog.Trigger asChild>` + internal `<Slot>` helper |
| **Reach UI** | `<DialogTrigger as={Button}>` (older variant) |
| **React Aria** | `mergeProps()` + manual ref forwarding |

Radix's `<Slot>` is the most influential — its source is ~50 lines and is essentially what we're building, inlined into `<Action>`.

## The mechanism: `React.cloneElement`

`cloneElement(element, newProps)` produces a new React element whose props are the old props merged with `newProps`. Refs in `newProps` replace the old ref (which is why we have to compose manually).

```tsx
import { cloneElement } from 'react'

const original = <button onClick={() => alert('original')}>Buy</button>
const cloned = cloneElement(original, { onClick: () => alert('replaced') })

// Rendering `cloned`: only 'replaced' fires. The original onClick was overwritten.
```

That's the naïve case. We can't just overwrite the child's `onClick` — the user wrote it for a reason. So we **merge** handlers before passing them in.

## Handler composition

```ts
function mergeHandlerOnto(childProp, pluginProp) {
  if (!childProp) return pluginProp        // no child handler — just use ours
  if (!pluginProp) return childProp         // no plugin handler — just use theirs
  return (e) => {
    childProp(e)                            // child's handler FIRST
    pluginProp(e)                           // then drwyn's plugin handler
  }
}
```

Two design choices baked in:

- **Child's handler runs first.** This matches React Aria's `mergeProps()` convention. The user wrote `onClick={...}` deliberately; their code is the "primary" action and should run before any library behavior layers on top.
- **Plugin handler runs regardless of `e.preventDefault()` or `e.defaultPrevented`.** A click that's `preventDefault`'d (e.g. to stop form submission) should still be *tracked* — analytics don't care whether the default action ran. We covered this in viva Q5/Q6.

## Ref composition

The user's child may already have a `ref`:

```tsx
const ref = useRef()
<Action mode="inline">
  <button ref={ref}>Buy</button>     // user's ref needs to receive the DOM node
</Action>
```

We *also* need a ref on the same element (for visibility tracking in Task 16). Naïvely passing our ref via `cloneElement(child, { ref: ourRef })` would overwrite the user's `ref`. So we use the `composeRefs` helper from Task 8:

```ts
const childRef = onlyChild.props.ref            // or onlyChild.ref in React 18 element shape
;(childProps as { ref: Ref<HTMLElement> }).ref = composeRefs(childRef, elementRef)
```

`composeRefs(a, b)` returns a single ref-callback that writes to both. The DOM node lands in `a.current` AND `b.current`. Both consumers get what they expected.

## Child validation

Inline mode only works on a single, ref-accepting element. Three things can go wrong:

| Child shape | What happens |
|---|---|
| Two or more elements | Can't decide which to clone — fall back to region mode + dev warning |
| A string or number (`<Action>hello</Action>`) | Not an element — fall back to region mode + dev warning |
| A React Fragment | `cloneElement` would clone the fragment, not the content — fall back + dev warning |
| `null` / `false` / conditional that evaluated to nothing | Nothing to clone — fall back + dev warning |
| One valid element ✅ | Cloned with merged handlers + composed ref |

The fallback to region mode means the consumer doesn't *break* on a violation — they get a wrapping `<div>` and a loud dev warning explaining what went wrong. Same friendly-failure pattern as React's own dev warnings (you cover this in Task 14).

## Why the rules are stricter than region mode

Region mode accepts any children. Inline mode requires exactly one ref-accepting element. The trade-off:

- Region mode: always works, extra DOM node.
- Inline mode: no extra DOM node, constraints on children.

Pick the mode that matches what you're wrapping. Use **inline** for `<button>`, `<a>`, `<input>` — single interactive elements. Use **region** for cards, sections, anywhere else.
