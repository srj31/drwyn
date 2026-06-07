import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The Next-app tsconfig sets `jsx: "preserve"` so Next can handle JSX
  // transformation at build time. Vitest's esbuild loader honors that and
  // refuses to transform JSX. Force the automatic runtime here so tests can
  // render React components without an explicit React import.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      // Mirror the `@/*` path alias from tsconfig.json so test files can use it.
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
