# `@drwyn/memory`

Per-user adaptive memory for drwyn — IndexedDB-backed local memory + optional cloud sync.

```bash
bun add @drwyn/memory@alpha
```

## Usage

```ts
import { ActionProvider } from '@drwyn/react'
import { memory, surface, createMemoryStore } from '@drwyn/memory'

const memoryStore = createMemoryStore()

<ActionProvider
  plugins={[memory, surface]}
  services={{ memory: memoryStore, /* ...other services */ }}
>
  <Action name="pricing-cta" surface={{ defaultVisibility: 'collapsed' }}>
    {(v) => v === 'full' ? <BigCta /> : v === 'collapsed' ? <SmallLink /> : null}
  </Action>
</ActionProvider>
```

## License

MIT
