import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'tsup'

// The `./memory` subpath re-exports `@drwyn/memory`. Its dts build therefore
// requires `@drwyn/memory/dist/*.d.ts` to exist. Conversely, `@drwyn/memory`'s
// own dts build needs `@drwyn/react/dist/*.d.ts`. To break the cycle on a
// cold build, the memory subpath entry is only included once @drwyn/memory's
// dist exists — the workspace `build` script runs react → memory → react.
const memoryDistDts = resolve(
  __dirname,
  '../../packages/memory/dist/index.d.ts',
)
const includeMemoryEntry = existsSync(memoryDistDts)

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    plugin: 'src/plugin/define.ts',
    plugins: 'src/plugins/index.ts',
    ...(includeMemoryEntry ? { memory: 'src/memory.ts' } : {}),
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'es2022',
  external: ['react', 'react-dom', '@drwyn/memory'],
  banner: { js: "'use client';" },
})
