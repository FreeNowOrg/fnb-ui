// scripts/verify-dist.mjs
// Post-build sanity check for the library artifacts (spec §12).
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const errors = []

function present(rel) {
  if (!existsSync(resolve(root, rel))) errors.push(`missing ${rel}`)
}

function contains(rel, needle) {
  const full = resolve(root, rel)
  if (!existsSync(full)) {
    errors.push(`missing ${rel}`)
    return
  }
  if (!readFileSync(full, 'utf8').includes(needle)) {
    errors.push(`${rel} does not contain "${needle}"`)
  }
}

function absent(rel, needle) {
  const full = resolve(root, rel)
  if (existsSync(full) && readFileSync(full, 'utf8').includes(needle)) {
    errors.push(`${rel} unexpectedly contains "${needle}"`)
  }
}

// ESM bundle exists and keeps vue external (imported, not inlined)
present('dist/index.js')
contains('dist/index.js', 'vue')

// Single bundled stylesheet with tokens + component styles, no project tokens
present('dist/style.css')
contains('dist/style.css', '--fnb-bg')
contains('dist/style.css', '.fnb-button')
absent('dist/style.css', '--pixiv-')

// Type declarations expose the component
present('dist/index.d.ts')
contains('dist/index.d.ts', 'FnbButton')

if (errors.length) {
  console.error(
    'verify-dist FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n')
  )
  process.exit(1)
}
console.log('verify-dist OK')
