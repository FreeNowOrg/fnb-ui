import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.json', include: ['src'] })],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { output: { assetFileNames: 'style.css' } },
  },
})
