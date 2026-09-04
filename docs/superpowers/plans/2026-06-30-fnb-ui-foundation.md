# fnb-ui Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `fnb-ui` build/test toolchain, the `--fnb-*` style base, and one fully-built component (`FnbButton`) as a verified vertical slice — proving the riskiest parts (Rolldown library output, Pug→`.d.ts`) before any bulk component work.

**Architecture:** Vite 8 (Rolldown) library mode emits a single ESM `dist/index.js`, a single `dist/style.css`, and `dist/index.d.ts`. SCSS mixins live in `src/styles/_fnb.scss` and are pulled into each component via an explicit `@use '../styles/fnb' as *;` (no global `additionalData` injection — avoids Sass self-`@use` recursion). Design tokens (`:root` + `.dark`) live in `src/styles/_variables.scss`, emitted once into `style.css` because `src/index.ts` imports `src/styles/index.scss`. Components are authored in Pug + SCSS and compiled away at build time. Vitest + `@vue/test-utils` (jsdom) drives component unit tests.

**Tech Stack:** Vue 3.5, Vite 8 + Rolldown, `@vitejs/plugin-vue` 6, `vite-plugin-dts` 5, `vue-tsc` 3 + `@vue/language-plugin-pug`, `sass-embedded`, Pug, Vitest + `@vue/test-utils` + jsdom, oxlint, Prettier + `@prettier/plugin-pug`.

## Global Constraints

- **Package**: `fnb-ui`, ESM-only library, component prefix `Fnb`, MIT, pnpm.
- **Node**: `>=20.19.0` (already in `package.json` `engines`).
- **Vue is a peer dependency** — never bundle it. `rollupOptions.external: ['vue']`.
- **CSS**: `build.cssCodeSplit: false` → one `dist/style.css`. Consumers `import 'fnb-ui/style.css'`.
- **Dark mode trigger is the `.dark` class** (spec §7 finalized this over PixivNow's `html.dark`).
- **Only `--fnb-*` tokens enter the library.** Project tokens (`--pixiv-*`, `--pica-*`) do NOT — drop them during port.
- **Code style** (Prettier): no semicolons, single quotes, 2-space indent, `es5` trailing commas. Templates are Pug. Styles are SCSS.
- **Comments in code are English.**
- **The VitePress docs site lives in `website/`, not `docs/`** (`docs/` is reserved for SDD specs/plans). Out of scope for this plan but constrains naming.
- **Versions are already pinned in `package.json`** — do not change pinned versions; add only the test-runner deps named in Task 1.

---

### Task 1: Toolchain config + buildable empty entry

Establish every config file and prove `pnpm build` emits an ESM bundle + `.d.ts` from an (almost) empty entry. No styles or components yet.

**Files:**

- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.oxlintrc.json`
- Create: `.prettierrc`
- Create: `src/env.d.ts`
- Create: `src/index.ts`
- Modify: `package.json` (add `test` script + test devDeps)

**Interfaces:**

- Consumes: nothing (first task).
- Produces: `src/index.ts` as the single library entry (`build.lib.entry.index`). Later tasks add exports to it. Build emits `dist/index.js` and `dist/index.d.ts`.

- [ ] **Step 1: Add the test-runner dev dependencies**

```bash
pnpm add -D vitest @vue/test-utils jsdom
```

Expected: `vitest`, `@vue/test-utils`, `jsdom` appear in `package.json` `devDependencies`.

- [ ] **Step 2: Add the `test` script to `package.json`**

In `package.json` `scripts`, add (keep existing scripts):

```jsonc
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `tsconfig.json`**

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "types": ["node", "vitest/globals"],
    "baseUrl": ".",
  },
  "vueCompilerOptions": {
    "plugins": ["@vue/language-plugin-pug"],
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts"],
  "exclude": ["dist", "node_modules"],
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
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
```

- [ ] **Step 5: Create `.prettierrc`**

```jsonc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["@prettier/plugin-pug"],
}
```

- [ ] **Step 6: Create `.oxlintrc.json`**

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn"],
  "categories": {
    "correctness": "error",
  },
}
```

- [ ] **Step 7: Create `src/env.d.ts` (type the injected version) and `src/index.ts`**

`src/env.d.ts` — references Vite client types and augments `import.meta.env` with the `__VERSION__` injected by `define`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Package version, injected at build time from package.json#version. */
  readonly __VERSION__: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`src/index.ts` — the version comes from the build-time define, not a hardcoded literal:

```ts
// fnb-ui public entry. Components, composables, and providers are
// re-exported here as later tasks land them.
export const version = import.meta.env.__VERSION__
```

- [ ] **Step 8: Build and verify ESM + dts emit**

Run: `pnpm build`
Expected: exits 0; creates `dist/index.js` and `dist/index.d.ts`.

Then verify both files exist:

Run: `test -f dist/index.js && test -f dist/index.d.ts && echo OK`
Expected: prints `OK`.

Verify the dts carries the entry export:

Run: `grep -q "version" dist/index.d.ts && echo OK`
Expected: prints `OK`.

> **Risk gate (spec §12):** if `dist/index.d.ts` is missing or empty, the `vite-plugin-dts` + Rolldown path is broken — STOP and report before proceeding (fallback: temporarily `vite@7`).

- [ ] **Step 9: Verify lint + typecheck run clean**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0 with no errors.

- [ ] **Step 10: Commit**

```bash
git add tsconfig.json vite.config.ts .oxlintrc.json .prettierrc src/env.d.ts src/index.ts package.json .gitignore pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: set up vite library build, ts, lint, format, vitest"
```

---

### Task 2: Style base — `--fnb-*` tokens + mixins emitted into `style.css`

Port the design-system tokens (light + dark, `.dark` trigger, **no** `--pixiv-*`) and the SCSS mixins. Prove they compile into a single `dist/style.css`.

**Files:**

- Create: `src/styles/_variables.scss`
- Create: `src/styles/_fnb.scss`
- Create: `src/styles/index.scss`
- Modify: `src/index.ts` (import the style entry)

**Interfaces:**

- Consumes: `src/index.ts` from Task 1.
- Produces:
  - `src/styles/_fnb.scss` exposing mixins `fnb-border`, `fnb-border-sm`, `fnb-shadow`, `fnb-shadow-sm`, `fnb-shadow-lg`, `fnb-shadow-xs`, `fnb-press`, `fnb-card`, `fnb-btn`, `fnb-tag`, `fnb-input` — consumed by components via `@use '../styles/fnb' as *;`.
  - `:root` / `.dark` custom properties (all `--fnb-*`) emitted into `dist/style.css`.

- [ ] **Step 1: Create `src/styles/_fnb.scss` (mixins only — emits no CSS on its own)**

```scss
// Borders
@mixin fnb-border {
  border: 3px solid var(--fnb-border);
  border-radius: var(--fnb-radius);
}

@mixin fnb-border-sm {
  border: 2px solid var(--fnb-border);
  border-radius: var(--fnb-radius-sm);
}

// Shadows
@mixin fnb-shadow {
  box-shadow: var(--fnb-shadow);
}

@mixin fnb-shadow-sm {
  box-shadow: var(--fnb-shadow-sm);
}

@mixin fnb-shadow-lg {
  box-shadow: var(--fnb-shadow-lg);
}

@mixin fnb-shadow-xs {
  box-shadow: var(--fnb-shadow-xs);
}

// Press effect
@mixin fnb-press {
  transition:
    transform 150ms,
    box-shadow 150ms;

  &:hover,
  &:active {
    transform: translate(1.5px, 1.5px);
    box-shadow: 0 0 0 0 var(--fnb-border);
  }
}

// Composites
@mixin fnb-card {
  @include fnb-border;
  @include fnb-shadow;
  background: var(--fnb-surface);
  transition: all 150ms;
}

@mixin fnb-btn {
  @include fnb-border;
  @include fnb-shadow;
  @include fnb-press;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.75rem 1.5rem;
  font-weight: 900;
  font-family: inherit;
  font-size: inherit;
  background: var(--fnb-bg);
  color: var(--fnb-text);
  cursor: pointer;
  text-decoration: none;
  border-radius: var(--fnb-radius);
}

@mixin fnb-tag {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
  background: var(--fnb-surface);
  transition: all 150ms;
  border-radius: var(--fnb-radius-sm);
}

@mixin fnb-input {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.5rem 0.75rem;
  background: var(--fnb-surface);
  outline: none;
  font-family: inherit;
  font-size: inherit;
  color: var(--fnb-text);
  border-radius: var(--fnb-radius-sm);
  transition: box-shadow 150ms;

  &:focus {
    box-shadow: 4px 4px 0 0 var(--fnb-brand);
  }
}
```

- [ ] **Step 2: Create `src/styles/_variables.scss` (design-system tokens; dark via `.dark`)**

```scss
// Design system tokens (--fnb-*). Light defaults on :root; dark overrides
// on .dark (class-based, aligned with the Tailwind/ecosystem convention).
:root {
  // Colors
  --fnb-bg: #eef2ff;
  --fnb-bg-alt: #f0f0f0;
  --fnb-brand: #4993ff;
  --fnb-brand-hover: #6aabff;
  --fnb-accent: #a78bfa;
  --fnb-success: #7fd957;
  --fnb-highlight: #ffe066;
  --fnb-danger: #ff5555;
  --fnb-bookmark: #ff69b4;
  --fnb-border: #000;
  --fnb-surface: #fff;
  --fnb-text: #1a1a1a;
  --fnb-text-muted: #666;
  --fnb-on-brand: #fff;
  --fnb-on-light: #1a1a1a;
  --fnb-skeleton: #e8e8e8;
  --fnb-divider: #dedede;
  --fnb-grid-line: rgba(0, 0, 0, 0.03);
  --fnb-silver: #d1d5db;
  --fnb-bronze: #f0b27a;

  // Border radius (neubrutalism = zero radius)
  --fnb-radius: 0;
  --fnb-radius-sm: 0;
  --fnb-radius-lg: 0;

  // Typography
  --fnb-font-sans:
    'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --fnb-font-display: 'Archivo Black', 'Noto Sans SC', system-ui, sans-serif;
  --fnb-font-mono: 'Space Grotesk', ui-monospace, monospace;

  // Shadows. --fnb-shadow-color defaults to the border color (black in light
  // mode); dark mode overrides it to brand-blue so the hard shadow stays
  // visible against the dark background.
  --fnb-shadow-color: var(--fnb-border);
  --fnb-shadow: 6px 6px 0 0 var(--fnb-shadow-color);
  --fnb-shadow-sm: 4px 4px 0 0 var(--fnb-shadow-color);
  --fnb-shadow-lg: 8px 8px 0 0 var(--fnb-shadow-color);
  --fnb-shadow-xs: 3px 3px 0 0 var(--fnb-shadow-color);
  --fnb-shadow-active: 6px 6px 0 0 var(--fnb-brand);
}

.dark {
  --fnb-bg: #14151b;
  --fnb-bg-alt: #1d2029;
  --fnb-border: #4c5160;
  --fnb-shadow-color: #2f5ea8;
  --fnb-surface: #1e222b;
  --fnb-text: #eef0f3;
  --fnb-text-muted: #9aa1ac;
  --fnb-skeleton: #2a2e38;
  --fnb-divider: #343a45;
  --fnb-grid-line: rgba(255, 255, 255, 0.04);
}
```

- [ ] **Step 3: Create `src/styles/index.scss` (pulls tokens into the bundle)**

```scss
// Importing this file emits the :root / .dark token declarations into the
// single bundled style.css. Mixins (_fnb.scss) are intentionally NOT used
// here — they emit nothing and are consumed per-component.
@use 'variables';
```

- [ ] **Step 4: Import the style entry from `src/index.ts`**

Add the import as the FIRST line of `src/index.ts` (above the existing `version` export):

```ts
import './styles/index.scss'

// fnb-ui public entry. Components, composables, and providers are
// re-exported here as later tasks land them.
export const version = import.meta.env.__VERSION__
```

- [ ] **Step 5: Build and verify tokens land in a single `style.css`**

Run: `pnpm build`
Expected: exits 0; `dist/style.css` now exists.

Run: `test -f dist/style.css && grep -q -- '--fnb-bg' dist/style.css && grep -q '\.dark' dist/style.css && echo OK`
Expected: prints `OK`.

Confirm project tokens did NOT leak in:

Run: `grep -c -- '--pixiv-' dist/style.css; echo "(expect 0)"`
Expected: prints `0`.

- [ ] **Step 6: Commit**

```bash
git add src/styles src/index.ts
git commit -m "feat(styles): add --fnb-* tokens (light/dark) and scss mixins"
```

---

### Task 3: `FnbButton` vertical slice (TDD) + plugin install + dist verification

Port `FnbButton` (Pug + SCSS), drive it with Vitest, wire it into `src/index.ts` with a Vue `install` plugin, and add a comprehensive `dist` verification script. This closes the loop: component → tree-shakeable ESM + single `style.css` + typed `.d.ts`.

> **Pug note:** the template below is ported verbatim from a working PixivNow SFC, so no new Pug authoring is needed. If you adjust the template, first consult the `pug-vue-pitfalls` skill.

**Files:**

- Create: `tests/FnbButton.spec.ts`
- Create: `src/components/FnbButton.vue`
- Create: `scripts/verify-dist.mjs`
- Modify: `src/index.ts` (export `FnbButton` + default plugin)
- Modify: `package.json` (add `verify` script)

**Interfaces:**

- Consumes: mixins from `src/styles/_fnb.scss` (Task 2) via `@use '../styles/fnb' as *;`.
- Produces:
  - `FnbButton` — Vue SFC. Props: `variant?: 'default' | 'primary' | 'success' | 'danger'` (default `'default'`), `size?: 'sm' | 'md' | 'lg'` (default `'md'`), `loading?: boolean`, `disabled?: boolean`, `tag?: string`, `href?: string`. Slots: `default`, `icon`.
  - `src/index.ts` named export `FnbButton` and a default export `FnbUI: Plugin` whose `install(app)` registers all components globally. Later tasks extend the `components` map and named re-exports.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbButton.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbButton } from '../src'

describe('FnbButton', () => {
  it('renders default slot content with the base class', () => {
    const w = mount(FnbButton, { slots: { default: 'Click' } })
    expect(w.text()).toContain('Click')
    expect(w.classes()).toContain('fnb-button')
  })

  it('applies variant and size modifier classes', () => {
    const w = mount(FnbButton, { props: { variant: 'primary', size: 'lg' } })
    expect(w.classes()).toContain('fnb-button--primary')
    expect(w.classes()).toContain('fnb-button--lg')
  })

  it('renders an <a> element when href is provided', () => {
    const w = mount(FnbButton, { props: { href: 'https://example.com' } })
    expect(w.element.tagName).toBe('A')
  })

  it('shows the spinner and marks loading when loading', () => {
    const w = mount(FnbButton, { props: { loading: true } })
    expect(w.find('.fnb-button__spinner').exists()).toBe(true)
    expect(w.classes()).toContain('fnb-button--loading')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `FnbButton` is not exported from `../src` (import resolves to `undefined`; mount throws).

- [ ] **Step 3: Create `src/components/FnbButton.vue`**

Ported from PixivNow, with the explicit mixin `@use` added and `:deep(.fnb-icon)` left intact.

```vue
<template lang="pug">
component.fnb-button(
  :is='tag || (href ? "a" : "button")',
  :class='[`fnb-button--${variant}`, `fnb-button--${size}`, { "fnb-button--disabled": disabled || loading, "fnb-button--loading": loading }]',
  :disabled='tag === "button" || !tag ? disabled || loading : undefined',
  :href='href',
  v-bind='$attrs'
)
  span.fnb-button__spinner(v-if='loading')
    svg.spin(viewBox='0 0 24 24', width='1em', height='1em')
      circle(
        cx='12',
        cy='12',
        r='10',
        fill='none',
        stroke='currentColor',
        stroke-width='3',
        stroke-dasharray='31.4 31.4',
        stroke-linecap='round'
      )
  slot(name='icon', v-if='!loading')
  slot
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'success' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    tag?: string
    href?: string
  }>(),
  {
    variant: 'default',
    size: 'md',
  }
)
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-button {
  @include fnb-btn;

  &--primary {
    background: var(--fnb-brand);
    color: var(--fnb-on-brand);
  }

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }

  &--danger {
    background: var(--fnb-danger);
    color: var(--fnb-on-brand);
  }

  &--sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 700;
    border-width: 2px;
    box-shadow: var(--fnb-shadow-sm);
  }

  &--lg {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;

    &:hover,
    &:active {
      transform: none;
      box-shadow: var(--fnb-shadow);
    }
  }

  &--loading {
    cursor: wait;
  }

  &__spinner {
    display: inline-flex;
    animation: spin 1s linear infinite;
  }

  // Icon slot: slightly larger than text for visual balance (≈ 18/14)
  :deep(.fnb-icon) {
    font-size: 1.25em;
  }
}
</style>
```

> Note: `@keyframes spin` is referenced by `.fnb-button__spinner` and the inline `svg.spin`. PixivNow defines `spin` in a global animation stylesheet that is out of scope here. Add it scoped to the component so the spinner animates standalone — see Step 4.

- [ ] **Step 4: Add the `spin` keyframes to the component style**

Append inside the `<style scoped lang="scss">` block, after the `.fnb-button { … }` rule:

```scss
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 5: Wire `FnbButton` into `src/index.ts` with a plugin**

Replace the contents of `src/index.ts` with:

```ts
import './styles/index.scss'
import type { App, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'

export { FnbButton }

const components: Record<string, Plugin | unknown> = { FnbButton }

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component as never)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all four `FnbButton` cases green.

- [ ] **Step 7: Create the dist verification script**

```js
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
```

- [ ] **Step 8: Add the `verify` script to `package.json`**

In `package.json` `scripts`, add:

```jsonc
"verify": "pnpm build && node scripts/verify-dist.mjs"
```

- [ ] **Step 9: Run the full build + dist verification**

Run: `pnpm verify`
Expected: build exits 0, then prints `verify-dist OK`.

> **Risk gate (spec §12):** manually open `dist/index.js`, `dist/style.css`, `dist/index.d.ts` and eyeball them — confirm `vue` is an external `import` (not inlined), `style.css` holds both the `:root --fnb-*` tokens and the `.fnb-button` rules, and `index.d.ts` declares `FnbButton`'s prop types. This is the spec's mandated human core-check.

- [ ] **Step 10: Run lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/components/FnbButton.vue src/index.ts tests/FnbButton.spec.ts scripts/verify-dist.mjs package.json
git commit -m "feat(button): add FnbButton with vitest + dist verification"
```

---

### Task 4: `FnbIcon` icon primitive (TDD)

Port + API-ify PixivNow's `FnbIcon` (currently a prop-less `i.fnb-icon` wrapper) into a naive `NIcon`-style primitive. Idiomatic Vue 3: `<component :is>` OR default slot, `computed` inline style, `inheritAttrs: false` with `$attrs` overriding the default `aria-hidden`.

> **Styling = naive route** (confirmed): the wrapper sets `font-size`/`color` + `fill: currentColor`; it does NOT force `stroke` and adds NO per-icon-set special case. Stroke-based sets (tabler) keep their own `fill="none"` presentation attribute, which wins over the inherited CSS `fill`. Reference: `../naive-ui/src/icon/src/Icon.ts` + `styles/index.cssr.ts`.
>
> **Pug note:** the template introduces a `<component :is>` + `slot` branch — if anything behaves oddly, consult the `pug-vue-pitfalls` skill.

**Files:**

- Create: `tests/FnbIcon.spec.ts`
- Create: `src/components/FnbIcon.vue`
- Modify: `src/index.ts` (export `FnbIcon` + add to `components` map)

**Interfaces:**

- Consumes: nothing from `src/styles` (self-contained scoped styles); registered alongside `FnbButton` in `src/index.ts`.
- Produces:
  - `FnbIcon` — Vue SFC. Props: `size?: number | string` (number → `${n}px`, string passthrough; unset → inherits `1em`), `color?: string`, `component?: Component` (rendered in place of the default slot). Default slot used when `component` is absent. `inheritAttrs: false`; renders `<i class="fnb-icon">` with a default `aria-hidden="true"` that `$attrs` can override.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbIcon.spec.ts
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbIcon } from '../src'

describe('FnbIcon', () => {
  it('wraps the default slot in i.fnb-icon', () => {
    const w = mount(FnbIcon, { slots: { default: () => h('svg') } })
    expect(w.element.tagName).toBe('I')
    expect(w.classes()).toContain('fnb-icon')
    expect(w.find('svg').exists()).toBe(true)
  })

  it('renders the component prop instead of the slot', () => {
    const Star = { name: 'Star', render: () => h('svg', { class: 'star' }) }
    const w = mount(FnbIcon, { props: { component: Star } })
    expect(w.find('svg.star').exists()).toBe(true)
  })

  it('applies size as px for numbers and passes strings through', () => {
    const wNum = mount(FnbIcon, { props: { size: 18 } })
    expect(wNum.attributes('style')).toContain('font-size: 18px')
    const wStr = mount(FnbIcon, { props: { size: '1.5em' } })
    expect(wStr.attributes('style')).toContain('font-size: 1.5em')
  })

  it('applies color', () => {
    const w = mount(FnbIcon, { props: { color: 'rgb(255, 0, 0)' } })
    expect(w.attributes('style')).toContain('color: rgb(255, 0, 0)')
  })

  it('defaults aria-hidden=true and lets $attrs override it', () => {
    expect(mount(FnbIcon).attributes('aria-hidden')).toBe('true')
    const w = mount(FnbIcon, {
      attrs: { 'aria-hidden': 'false', 'aria-label': 'star' },
    })
    expect(w.attributes('aria-hidden')).toBe('false')
    expect(w.attributes('aria-label')).toBe('star')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `FnbIcon` is not exported from `../src`.

- [ ] **Step 3: Create `src/components/FnbIcon.vue`**

```vue
<template lang="pug">
i.fnb-icon(aria-hidden='true', :style='iconStyle', v-bind='$attrs')
  component(v-if='component', :is='component')
  slot(v-else)
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  size?: number | string
  color?: string
  component?: Component
}>()

// Number sizes become px; string sizes pass through. Unset -> inherit 1em.
const iconStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color,
}))
</script>

<style scoped lang="scss">
.fnb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  width: 1em;
  height: 1em;
  line-height: 1;
  // Default fill for icon sets that rely on currentColor. Stroke-based sets
  // (tabler) keep their own fill="none" attribute, which wins over this.
  fill: currentColor;
  vertical-align: -0.125em;

  > svg,
  > img {
    width: 1em;
    height: 1em;
  }
}
</style>
```

> Note: `aria-hidden='true'` is listed before `v-bind='$attrs'` on purpose — Vue fallthrough merges later-declared attributes last, so a caller-supplied `aria-hidden` overrides the default.

- [ ] **Step 4: Register `FnbIcon` in `src/index.ts`**

Update `src/index.ts` to import, named-export, and register `FnbIcon` alongside `FnbButton`:

```ts
import './styles/index.scss'
import type { App, Component, Plugin } from 'vue'
import FnbButton from './components/FnbButton.vue'
import FnbIcon from './components/FnbIcon.vue'

export { FnbButton, FnbIcon }

const components: Record<string, Component> = { FnbButton, FnbIcon }

const FnbUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

export const version = import.meta.env.__VERSION__
export default FnbUI
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `FnbIcon` and `FnbButton` cases green.

- [ ] **Step 6: Build + verify dist still healthy and includes FnbIcon types**

Run: `pnpm verify`
Expected: build exits 0, then `verify-dist OK`.

Run: `grep -q 'FnbIcon' dist/index.d.ts && echo OK`
Expected: prints `OK`.

- [ ] **Step 7: Run lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/components/FnbIcon.vue src/index.ts tests/FnbIcon.spec.ts
git commit -m "feat(icon): add FnbIcon primitive (naive NIcon-style)"
```

---

## Self-Review

**Spec coverage (this plan targets spec §11 phases 1–2 + a phase-3 sample):**

- §3 toolchain (Vite 8/Rolldown, plugin-vue, dts, vue-tsc + pug language plugin, sass-embedded, oxlint, prettier+pug) → Task 1. Vitest added per user decision (not originally in §3 table).
- §4 build & artifacts (ESM-only, `external: ['vue']`, single `style.css`, dts, exports) → Task 1 (config) + Task 3 (verification). `exports` already in `package.json`.
- §7 token model (two-layer; `--fnb-*` only; `.dark` trigger) → Task 2.
- §5 `FnbIcon` (naive `NIcon`-style primitive; the icon the `:deep(.fnb-icon)` rule targets) → Task 4.
- §10 directory structure (`src/components`, `src/styles`, `src/index.ts`) → Tasks 1–4. (`composables/`, `providers/`, `nuxt/`, `website/` are later plans.)
- §12 risks (Rolldown library output, Pug→dts) → Task 1 Step 8 gate + Task 3 Step 9 gate.
- Out of scope (later plans): remaining 20 components, `FnbMbox`→`FnbAlert` rename, Tabs composables, Provider/Hook system, docs site, Nuxt module, publish.

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to Task N" — all code is complete and inline.

**Type consistency:** `FnbButton`/`FnbIcon` prop types are identical in the test usage, the SFC `defineProps`, and the Interfaces blocks. `src/index.ts` evolves consistently across Tasks 1→2→3→4 (`version` const preserved; style import added in Task 2; `FnbButton` + `FnbUI` plugin added in Task 3; `FnbIcon` added to the named exports + `components` map in Task 4). The `components` map and `install` loop names match across the plugin definition.

---

## Roadmap (subsequent plans — not in this plan)

Written as separate plans once this foundation is green:

2. **Direct-port components** — the §5 first-class list (`FnbCard`, `FnbInput`, `FnbSelect`, `FnbTag`, `FnbTable`, `FnbPagination`, `FnbProgress`, `FnbSkeleton`, `FnbSpin`, `FnbScrollbar`, `FnbImage`, `FnbFloatButton`, `FnbEllipsis`, `FnbResult`) + the `FnbMbox`→`FnbAlert` rename. Each: add `@use '../styles/fnb' as *;`, drop auto-import, port, Vitest, register in `index.ts`.
3. **API refactor** — `FnbTabs`/`FnbTabPane` (composables) + Provider/Hook system (`FnbConfigProvider`, `FnbMessageProvider`+`useMessage`, `FnbDialogProvider`+`useDialog`, aggregate `FnbProvider`).
4. **Docs site** — VitePress + `vitepress-demo-plugin` in **`website/`** (not `docs/`).
5. **Nuxt module + first publish** — optional `fnb-ui/nuxt` subpath, then `0.x` to npm.
