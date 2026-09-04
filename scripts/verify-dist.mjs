// scripts/verify-dist.mjs
// Post-build sanity check for the library artifacts (spec §12).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

// core: single stylesheet carrying tokens + components + prose
present('packages/core/dist/style.css')
contains('packages/core/dist/style.css', '--fnb-brand')
contains('packages/core/dist/style.css', '--fnb-control-h')
contains('packages/core/dist/style.css', '--fnb-weight-border')
contains('packages/core/dist/style.css', '.fnb-button')
contains('packages/core/dist/style.css', '.fnb-input-group')
contains('packages/core/dist/style.css', '.fnb-prose')
// business tokens must never ship in the library
absent('packages/core/dist/style.css', '--pixiv-')
absent('packages/core/dist/style.css', '--fnb-bookmark')
// breakpoints must never become CSS variables
absent('packages/core/dist/style.css', '--fnb-bp')
// scoped styles must be gone: no Vue scope attributes may remain
absent('packages/core/dist/style.css', 'data-v-')

// core JS: tokens and framework-agnostic logic
present('packages/core/dist/index.js')
present('packages/core/dist/index.d.ts')
contains('packages/core/dist/index.d.ts', 'FnbTokenName')

// vue: bindings only — the package boundary enforces "CSS is the product"
present('packages/vue/dist/index.js')
present('packages/vue/dist/index.d.ts')
contains('packages/vue/dist/index.d.ts', 'FnbButton')

// The vue package must not ship any stylesheet at all.
const vueDist = resolve(root, 'packages/vue/dist')
if (existsSync(vueDist)) {
  const stray = readdirSync(vueDist).filter((f) => f.endsWith('.css'))
  if (stray.length)
    errors.push(`packages/vue/dist ships CSS: ${stray.join(', ')}`)
}

if (errors.length) {
  console.error(
    'verify-dist FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n')
  )
  process.exit(1)
}
console.log('verify-dist OK')
