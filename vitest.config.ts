import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Resolve to core's source, not its build output: tests must see
      // changes to core immediately, without an intermediate `pnpm build`.
      '@fnb-ui/core': resolve(import.meta.dirname, 'packages/core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/*/tests/**/*.spec.ts'],
  },
})
