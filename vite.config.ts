/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { version } from './package.json'

export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json', include: ['src'] })],
  define: {
    'import.meta.env.__VERSION__': JSON.stringify(version),
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: { assetFileNames: 'style.css' },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
