# `@drwyn/client`

Client for drwyn cloud — sends events and reads/writes per-user memory.

```bash
bun add @drwyn/client@alpha
```

## Usage

```ts
import { DrwynClient } from '@drwyn/client'

const drwyn = new DrwynClient({
  projectKey: 'pk_...', // from your drwyn.dev dashboard
})

await drwyn.sendEvent({
  userId: 'anon_xyz',
  name: 'cta_clicked',
  props: { plan: 'pro' },
})

const value = await drwyn.getMemory('anon_xyz', 'last_page')
await drwyn.setMemory('anon_xyz', 'last_page', '/pricing')
```

## License

MIT
