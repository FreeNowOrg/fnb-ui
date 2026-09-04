# fnb-ui Direct-Port Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the 14 zero-business-coupling `Fnb*` components from PixivNow into `fnb-ui`, plus rename `FnbMbox` → `FnbAlert`, each with Vitest coverage and registered in the library entry.

**Architecture:** Each component is copied from its PixivNow source SFC and made standalone by three mechanical transforms: (1) add `@use '../styles/fnb' as *;` to any `<style>` that uses `@include fnb-*` mixins (no global SCSS injection exists in the library), (2) replace Nuxt auto-imports (`ref`/`computed`/vueuse) with explicit `import`s, (3) inline any animation/transition CSS the source inherited from PixivNow's global `_animate.scss` (same scoped-style limitation FnbButton hit). Pug templates, scoped SCSS, and prop types are preserved verbatim. Each component is named-exported and added to the `FnbUI` plugin's `components` map in `src/index.ts`.

**Tech Stack:** Vue 3.5 `<script setup>` + Pug + scoped SCSS, Vitest + `@vue/test-utils` (jsdom). Build/test/lint/format toolchain already established by the foundation.

## Global Constraints

- **These are direct ports — preserve visual/interaction behavior verbatim** (spec §6.3). Do not redesign; the source SFC is the source of truth for markup, styles, and prop types.
- **Component prefix `Fnb`**; ESM-only library; Vue is a peer dependency (never bundled).
- **Only `--fnb-*` tokens** may appear; if any `var(--pixiv-*)` is found in a source, STOP and report (none are expected).
- **Mixins are consumed per-component** via `@use '../styles/fnb' as *;` as the FIRST line of the component's `<style scoped lang="scss">` — only for components whose style uses `@include fnb-*`. There is NO global `additionalData` injection.
- **No new runtime dependencies.** In particular, do NOT add `@vueuse/core`; FnbSelect's click-outside is reimplemented internally (Task 15).
- **Animation/transition CSS that the source inherited from a global sheet must be inlined** into the component's scoped style (Tasks 11, 12, 13), following the precedent set by FnbButton (`@keyframes spin` inlined scoped).
- **Cosmetic Chinese aria-labels** in the sources (e.g. `分页导航`, `关闭`) are kept as-is — they are not business coupling.
- **Vue composition APIs import from `'vue'`** (`import { ref, computed } from 'vue'`) — the sources rely on Nuxt auto-import and have no import line.
- **Code style (Prettier):** no semicolons, single quotes, 2-space, es5 trailing commas. Template Pug, style SCSS, English comments. The `@prettier/plugin-pug` may rewrite Pug attribute spacing/commas — that is expected and fine.
- After authoring, run `pnpm prettier --check` on the files you created and reflow only those (never `prettier --write .`).

---

## Shared Port Procedure

Every component task below follows this procedure. Each task states the source path, the component's public contract, any component-specific notes, and the full test code.

1. **Write the failing test first** (the task gives it), run it, confirm it FAILS because the component is not yet exported (`import { FnbX } from '../src'` → undefined). This is the RED step.
2. **Create `src/components/FnbX.vue`** by copying the PixivNow source at the given path, then applying:
   - **(a) Mixins:** if the `<style>` uses `@include fnb-*`, add `@use '../styles/fnb' as *;` as the first line of the `<style scoped lang="scss">` block.
   - **(b) Imports:** add `import { ... } from 'vue'` for every composition API used without import (the task names them). Replace any `~/`/`@/` auto-import with an explicit import or the internal implementation the task specifies.
   - **(c) Inherited animation/transition CSS:** inline what the task specifies.
   - Keep the Pug template, scoped SCSS rules, prop types, emits, slots, and `defineOptions` exactly as in the source (apart from the transforms above).
3. **Register in `src/index.ts`:** add `import FnbX from './components/FnbX.vue'`, add `FnbX` to the `export { ... }` list, and add `FnbX` to the `const components: Record<string, Component> = { ... }` map. (The entry file already imports `Component` from `'vue'` and iterates the map in `install`.)
4. **Run the test → GREEN.** If an assertion about a modifier class fails, reconcile against the actual source class name (the source is authoritative for ported visuals).
5. **Verify & commit:** `pnpm test` (full suite green), `pnpm lint && pnpm typecheck` (exit 0), `pnpm prettier --check` on your new files. Then `pnpm verify` (build + dist gate still OK). Commit the component, its test, and `src/index.ts`.

> **`src/index.ts` starting point** (after the foundation): it imports `FnbButton`, `FnbIcon`, exports them, and registers them in `const components: Record<string, Component>`. Each task appends one component to the import block, the `export { ... }`, and that map — nothing else changes.

> **Test note:** for pure-styling modifier props where the exact BEM class string is not certain, tests use a **differential** assertion (two prop values must yield different class lists) rather than hardcoding a class name. For behavior (emitted events, v-model, inline styles, slot rendering) tests assert the exact contract.

---

### Task 1: FnbCard

**Files:**

- Create: `src/components/FnbCard.vue`
- Test: `tests/FnbCard.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbCard.vue`

**Contract:** Props `color?: 'white' | 'brand' | 'highlight' | 'success'` (default `'white'`), `shadow?: 'sm' | 'md' | 'lg' | 'none'` (default `'md'`). Default slot. No emits.

**Notes:** Style uses `@include fnb-border`, `fnb-shadow-sm`, `fnb-shadow`, `fnb-shadow-lg` → add `@use '../styles/fnb' as *;`. No script imports needed (no ref/computed). No animation deps.

**Interfaces — Produces:** `FnbCard` (named export + registered).

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbCard } from '../src'

describe('FnbCard', () => {
  it('renders default slot inside the card root', () => {
    const w = mount(FnbCard, { slots: { default: 'Body' } })
    expect(w.classes()).toContain('fnb-card')
    expect(w.text()).toContain('Body')
  })

  it('color prop changes the class list', () => {
    const white = mount(FnbCard, { props: { color: 'white' } })
    const brand = mount(FnbCard, { props: { color: 'brand' } })
    expect(white.classes()).not.toEqual(brand.classes())
  })

  it('shadow prop changes the class list', () => {
    const md = mount(FnbCard, { props: { shadow: 'md' } })
    const none = mount(FnbCard, { props: { shadow: 'none' } })
    expect(md.classes()).not.toEqual(none.classes())
  })
})
```

- [ ] **Step 2: Run test, confirm RED**

Run: `pnpm test tests/FnbCard.spec.ts`
Expected: FAIL — `FnbCard` not exported.

- [ ] **Step 3: Port the component + register** (Shared Port Procedure steps 2–3)

- [ ] **Step 4: Run test, confirm GREEN**

Run: `pnpm test tests/FnbCard.spec.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Verify + commit**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm verify`
Then:

```bash
git add src/components/FnbCard.vue tests/FnbCard.spec.ts src/index.ts
git commit -m "feat(card): port FnbCard from PixivNow"
```

---

### Task 2: FnbTag

**Files:**

- Create: `src/components/FnbTag.vue`
- Test: `tests/FnbTag.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbTag.vue`

**Contract:** Props `color?: string`, `active?: boolean`, `clickable?: boolean` (default `false`). Emits `click: [event: Event]` (only when `clickable`). Default slot. Sets `role`/`tabindex` conditionally when clickable.

**Notes:** Uses `computed` → `import { computed } from 'vue'`. Style uses `@include fnb-tag`, `fnb-press` → add `@use '../styles/fnb' as *;`. `color` prop drives an inline `background-color`.

**Interfaces — Produces:** `FnbTag`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbTag.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbTag } from '../src'

describe('FnbTag', () => {
  it('renders default slot', () => {
    const w = mount(FnbTag, { slots: { default: 'R-18' } })
    expect(w.classes()).toContain('fnb-tag')
    expect(w.text()).toContain('R-18')
  })

  it('emits click only when clickable', async () => {
    const plain = mount(FnbTag, { props: { clickable: false } })
    await plain.trigger('click')
    expect(plain.emitted('click')).toBeUndefined()

    const clickable = mount(FnbTag, { props: { clickable: true } })
    await clickable.trigger('click')
    expect(clickable.emitted('click')).toHaveLength(1)
  })

  it('applies the color prop as an inline background-color', () => {
    const w = mount(FnbTag, { props: { color: 'rgb(255, 0, 0)' } })
    expect(w.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
  })

  it('active prop changes the class list', () => {
    const off = mount(FnbTag, { props: { active: false } })
    const on = mount(FnbTag, { props: { active: true } })
    expect(off.classes()).not.toEqual(on.classes())
  })
})
```

- [ ] **Step 2: Run test, confirm RED** — `pnpm test tests/FnbTag.spec.ts` → FAIL (not exported).
- [ ] **Step 3: Port + register.**
- [ ] **Step 4: Run test, confirm GREEN** — `pnpm test tests/FnbTag.spec.ts` → PASS (4/4).
- [ ] **Step 5: Verify + commit**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm verify`

```bash
git add src/components/FnbTag.vue tests/FnbTag.spec.ts src/index.ts
git commit -m "feat(tag): port FnbTag from PixivNow"
```

---

### Task 3: FnbInput

**Files:**

- Create: `src/components/FnbInput.vue`
- Test: `tests/FnbInput.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbInput.vue`

**Contract:** Props `modelValue?: string`, `placeholder?: string`, `type?: string` (default `'text'`), `disabled?: boolean`, `readonly?: boolean`. Emits `update:modelValue: [value: string]` (v-model). No slots.

**Notes:** No script imports beyond the emit/props macros. Style uses `@include fnb-input` → add `@use '../styles/fnb' as *;`.

**Interfaces — Produces:** `FnbInput`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbInput.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbInput } from '../src'

describe('FnbInput', () => {
  it('renders an input reflecting modelValue', () => {
    const w = mount(FnbInput, { props: { modelValue: 'hello' } })
    expect(w.find('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const w = mount(FnbInput, { props: { modelValue: '' } })
    const input = w.find('input')
    input.element.value = 'world'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toEqual([['world']])
  })

  it('forwards type, placeholder, disabled, readonly to the input', () => {
    const w = mount(FnbInput, {
      props: {
        type: 'password',
        placeholder: 'pw',
        disabled: true,
        readonly: true,
      },
    })
    const el = w.find('input').element
    expect(el.type).toBe('password')
    expect(el.placeholder).toBe('pw')
    expect(el.disabled).toBe(true)
    expect(el.readOnly).toBe(true)
  })
})
```

- [ ] **Step 2: RED** — `pnpm test tests/FnbInput.spec.ts` → FAIL.
- [ ] **Step 3: Port + register.**
- [ ] **Step 4: GREEN** — `pnpm test tests/FnbInput.spec.ts` → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbInput.vue tests/FnbInput.spec.ts src/index.ts
git commit -m "feat(input): port FnbInput from PixivNow"
```

---

### Task 4: FnbProgress

**Files:**

- Create: `src/components/FnbProgress.vue`
- Test: `tests/FnbProgress.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbProgress.vue`

**Contract:** Props `percentage?: number` (default `0`), `color?: string`, `height?: number` (default `6`), `showValue?: boolean`. No emits/slots. Clamps percentage to 0–100 for the fill width; optional rounded `%` label.

**Notes:** Uses `computed` → `import { computed } from 'vue'`. Style uses `@include fnb-border-sm` → add `@use '../styles/fnb' as *;`.

**Interfaces — Produces:** `FnbProgress`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbProgress.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbProgress } from '../src'

describe('FnbProgress', () => {
  it('renders the root track', () => {
    const w = mount(FnbProgress)
    expect(w.classes()).toContain('fnb-progress')
  })

  it('sets the fill width from percentage', () => {
    const w = mount(FnbProgress, { props: { percentage: 50 } })
    expect(w.html()).toContain('width: 50%')
  })

  it('clamps percentage above 100 to 100%', () => {
    const w = mount(FnbProgress, { props: { percentage: 150 } })
    expect(w.html()).toContain('width: 100%')
    expect(w.html()).not.toContain('width: 150%')
  })

  it('shows the rounded value label when showValue is set', () => {
    const w = mount(FnbProgress, {
      props: { percentage: 42.6, showValue: true },
    })
    expect(w.text()).toContain('43%')
  })
})
```

- [ ] **Step 2: RED** — `pnpm test tests/FnbProgress.spec.ts` → FAIL.
- [ ] **Step 3: Port + register.**
- [ ] **Step 4: GREEN** — PASS (4/4). (If the root class differs from `fnb-progress`, reconcile to the source.)
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbProgress.vue tests/FnbProgress.spec.ts src/index.ts
git commit -m "feat(progress): port FnbProgress from PixivNow"
```

---

### Task 5: FnbScrollbar

**Files:**

- Create: `src/components/FnbScrollbar.vue`
- Test: `tests/FnbScrollbar.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbScrollbar.vue`

**Contract:** Prop `xScrollable?: boolean`. Default slot. No emits. Styled `-webkit-scrollbar`; x-only mode toggles overflow axes.

**Notes:** No script imports. No mixins (no `@use` needed). No animation deps.

**Interfaces — Produces:** `FnbScrollbar`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbScrollbar.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbScrollbar } from '../src'

describe('FnbScrollbar', () => {
  it('renders default slot in the scrollbar root', () => {
    const w = mount(FnbScrollbar, { slots: { default: 'content' } })
    expect(w.classes()).toContain('fnb-scrollbar')
    expect(w.text()).toContain('content')
  })

  it('xScrollable changes the class list', () => {
    const off = mount(FnbScrollbar, { props: { xScrollable: false } })
    const on = mount(FnbScrollbar, { props: { xScrollable: true } })
    expect(off.classes()).not.toEqual(on.classes())
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (2/2).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbScrollbar.vue tests/FnbScrollbar.spec.ts src/index.ts
git commit -m "feat(scrollbar): port FnbScrollbar from PixivNow"
```

---

### Task 6: FnbEllipsis

**Files:**

- Create: `src/components/FnbEllipsis.vue`
- Test: `tests/FnbEllipsis.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbEllipsis.vue`

**Contract:** Prop `lineClamp?: number` (default `1`). Default slot. No emits. Multi-line truncation via inline `-webkit-box` + `-webkit-line-clamp` (computed inline style; **no `<style>` block**).

**Notes:** Uses `computed` → `import { computed } from 'vue'`. No mixins, no `@use`.

**Interfaces — Produces:** `FnbEllipsis`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbEllipsis.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbEllipsis } from '../src'

describe('FnbEllipsis', () => {
  it('renders default slot', () => {
    const w = mount(FnbEllipsis, { slots: { default: 'long text' } })
    expect(w.text()).toContain('long text')
  })

  it('applies the line-clamp from the prop', () => {
    const w = mount(FnbEllipsis, { props: { lineClamp: 3 } })
    expect(w.attributes('style')).toContain('-webkit-line-clamp: 3')
  })

  it('defaults line-clamp to 1', () => {
    const w = mount(FnbEllipsis)
    expect(w.attributes('style')).toContain('-webkit-line-clamp: 1')
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbEllipsis.vue tests/FnbEllipsis.spec.ts src/index.ts
git commit -m "feat(ellipsis): port FnbEllipsis from PixivNow"
```

---

### Task 7: FnbTable

**Files:**

- Create: `src/components/FnbTable.vue`
- Test: `tests/FnbTable.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbTable.vue`

**Contract:** No props/emits. Default slot (consumer supplies `thead`/`tbody`). Styling-only wrapper around a native `<table>`; styles descendant cells via `:deep`. No `<script>` block in the source.

**Notes:** Style uses `@include fnb-border-sm` → add `@use '../styles/fnb' as *;`. Keep it scriptless (or add an empty `<script setup lang="ts">` only if needed for the SFC to compile — prefer matching the source exactly).

**Interfaces — Produces:** `FnbTable`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbTable.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbTable } from '../src'

describe('FnbTable', () => {
  it('renders a table wrapper around slotted content', () => {
    const w = mount(FnbTable, {
      slots: { default: '<tbody><tr><td>cell</td></tr></tbody>' },
    })
    expect(w.find('table').exists()).toBe(true)
    expect(w.text()).toContain('cell')
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (1/1). (If the root is a wrapper `div` around `<table>`, the `find('table')` still holds.)
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbTable.vue tests/FnbTable.spec.ts src/index.ts
git commit -m "feat(table): port FnbTable from PixivNow"
```

---

### Task 8: FnbResult

**Files:**

- Create: `src/components/FnbResult.vue`
- Test: `tests/FnbResult.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbResult.vue`

**Contract:** Props `status?: 'warning' | '500' | 'error' | 'info' | 'success' | '404' | '403' | '418'` (default `'warning'`), `title?: string`, `description?: string`. Slots: default, named `footer`. No emits. Maps `status` to an emoji/code glyph.

**Notes:** Uses `computed` → `import { computed } from 'vue'`. No mixins. Does NOT import FnbButton (footer is a slot).

**Interfaces — Produces:** `FnbResult`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbResult.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbResult } from '../src'

describe('FnbResult', () => {
  it('renders title and description', () => {
    const w = mount(FnbResult, {
      props: { title: 'Not found', description: 'gone' },
    })
    expect(w.text()).toContain('Not found')
    expect(w.text()).toContain('gone')
  })

  it('renders the footer slot', () => {
    const w = mount(FnbResult, { slots: { footer: '<button>retry</button>' } })
    expect(w.find('button').text()).toBe('retry')
  })

  it('different status values render different glyphs', () => {
    const e404 = mount(FnbResult, { props: { status: '404' } })
    const ok = mount(FnbResult, { props: { status: 'success' } })
    expect(e404.text()).not.toEqual(ok.text())
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbResult.vue tests/FnbResult.spec.ts src/index.ts
git commit -m "feat(result): port FnbResult from PixivNow"
```

---

### Task 9: FnbAlert (renamed from FnbMbox)

**Files:**

- Create: `src/components/FnbAlert.vue`
- Test: `tests/FnbAlert.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbMbox.vue`

**Contract (renamed):** Component name/file/class become `FnbAlert` / `fnb-alert`. Props `type?: 'info' | 'success' | 'warning' | 'error'` (default `'info'`), `header?: string`, `closable?: boolean`. Emits `close: []`. Slots: default, named `header`.

**Notes (rename specifics):** This is the §5 rename `FnbMbox → FnbAlert`. When porting: rename the root class and all `fnb-mbox*` BEM classes to `fnb-alert*` (template + scoped style together), and the file/export to `FnbAlert`. Style uses `@include fnb-border`, `fnb-shadow-sm` → add `@use '../styles/fnb' as *;`. No script imports (no ref/computed). Keep the Chinese `关闭` aria-label.

**Interfaces — Produces:** `FnbAlert`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbAlert.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbAlert } from '../src'

describe('FnbAlert', () => {
  it('renders default slot in the alert root', () => {
    const w = mount(FnbAlert, { slots: { default: 'Heads up' } })
    expect(w.classes()).toContain('fnb-alert')
    expect(w.text()).toContain('Heads up')
  })

  it('renders header from prop and from slot', () => {
    const viaProp = mount(FnbAlert, { props: { header: 'Title' } })
    expect(viaProp.text()).toContain('Title')
    const viaSlot = mount(FnbAlert, { slots: { header: 'SlotTitle' } })
    expect(viaSlot.text()).toContain('SlotTitle')
  })

  it('type prop changes the class list', () => {
    const info = mount(FnbAlert, { props: { type: 'info' } })
    const error = mount(FnbAlert, { props: { type: 'error' } })
    expect(info.classes()).not.toEqual(error.classes())
  })

  it('shows a close button that emits close when closable', async () => {
    const w = mount(FnbAlert, { props: { closable: true } })
    await w.find('button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + rename `fnb-mbox*`→`fnb-alert*` + register `FnbAlert`. **Step 4: GREEN** → PASS (4/4).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbAlert.vue tests/FnbAlert.spec.ts src/index.ts
git commit -m "feat(alert): port FnbMbox from PixivNow as FnbAlert"
```

---

### Task 10: FnbFloatButton

**Files:**

- Create: `src/components/FnbFloatButton.vue`
- Test: `tests/FnbFloatButton.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbFloatButton.vue`

**Contract:** Props `bottom?: number`, `right?: number`. Emits `click: [event: Event]`. Slots: default, named `menu`. `defineOptions({ inheritAttrs: false })` — forwards `$attrs` onto the inner main button. `bottom`/`right` → inline `px` positions.

**Notes:** Uses `computed` → `import { computed } from 'vue'`. Style uses `@include fnb-border`, `fnb-shadow-sm`, `fnb-press` → add `@use '../styles/fnb' as *;`. Preserve `inheritAttrs: false`.

**Interfaces — Produces:** `FnbFloatButton`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbFloatButton.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbFloatButton } from '../src'

describe('FnbFloatButton', () => {
  it('renders default slot and emits click', async () => {
    const w = mount(FnbFloatButton, { slots: { default: '+' } })
    expect(w.text()).toContain('+')
    await w.find('button').trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('renders the menu slot', () => {
    const w = mount(FnbFloatButton, {
      slots: { menu: '<a class="m">menu-item</a>' },
    })
    expect(w.find('a.m').exists()).toBe(true)
  })

  it('applies bottom/right as inline px positions', () => {
    const w = mount(FnbFloatButton, { props: { bottom: 40, right: 20 } })
    const html = w.html()
    expect(html).toContain('bottom: 40px')
    expect(html).toContain('right: 20px')
  })
})
```

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbFloatButton.vue tests/FnbFloatButton.spec.ts src/index.ts
git commit -m "feat(float-button): port FnbFloatButton from PixivNow"
```

---

### Task 11: FnbSkeleton

**Files:**

- Create: `src/components/FnbSkeleton.vue`
- Test: `tests/FnbSkeleton.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbSkeleton.vue`

**Contract:** Props `width?: string`, `height?: string`, `circle?: boolean`, `block?: boolean`, `text?: boolean`, `repeat?: number` (default `1`). No emits/slots. Renders `repeat` copies (v-for) or a single span; circle/block/text modifiers.

**Notes (animation dep):** The shimmer uses `animation: imgProgress ...`. `@keyframes imgProgress` is defined in PixivNow's global `_animate.scss`, NOT in the component. Because the style is scoped, the animation will not run unless ported. **Inline `@keyframes imgProgress` into this component's scoped `<style>`** (copy it from `/Users/xiaoyujun/GitRepositories/PixivNow/app/assets/styles/_animate.scss`; it uses `color-mix(...)` with `--fnb-skeleton`). Uses `computed` → `import { computed } from 'vue'`. No mixins.

**Interfaces — Produces:** `FnbSkeleton`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbSkeleton.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSkeleton } from '../src'

describe('FnbSkeleton', () => {
  it('renders a single skeleton by default', () => {
    const w = mount(FnbSkeleton)
    expect(w.findAll('.fnb-skeleton').length).toBeGreaterThanOrEqual(1)
  })

  it('renders `repeat` copies', () => {
    const w = mount(FnbSkeleton, { props: { repeat: 3 } })
    expect(w.findAll('.fnb-skeleton').length).toBe(3)
  })

  it('applies width/height from props', () => {
    const w = mount(FnbSkeleton, { props: { width: '120px', height: '20px' } })
    const html = w.html()
    expect(html).toContain('width: 120px')
    expect(html).toContain('height: 20px')
  })

  it('circle modifier changes the class list', () => {
    const plain = mount(FnbSkeleton)
    const circle = mount(FnbSkeleton, { props: { circle: true } })
    expect(plain.html()).not.toEqual(circle.html())
  })
})
```

> If the per-item class is not exactly `.fnb-skeleton` (e.g. the root wraps items with a different item class), reconcile the selector in the first two tests to the source's actual item class.

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + inline `@keyframes imgProgress` + register. **Step 4: GREEN** → PASS (4/4).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbSkeleton.vue tests/FnbSkeleton.spec.ts src/index.ts
git commit -m "feat(skeleton): port FnbSkeleton from PixivNow (inline imgProgress keyframes)"
```

---

### Task 12: FnbSpin

**Files:**

- Create: `src/components/FnbSpin.vue`
- Test: `tests/FnbSpin.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbSpin.vue`

**Contract:** Props `show?: boolean`, `size?: 'small' | 'medium' | 'large'` (default `'medium'`). Default slot (content overlaid). No emits. Wraps slot, dims it when `show`, overlays a centered SVG spinner sized by `size`.

**Notes (animation dep — critical):** The spinner SVG has class `spin`, but BOTH the rule `svg.spin { animation: spin 2s linear infinite; }` AND `@keyframes spin` live in PixivNow's global `_animate.scss`, not in the component. Scoped styling means it will silently not rotate unless ported. **Inline both into this component's scoped `<style>`** — the `svg.spin { animation: spin 2s linear infinite; }` rule and the `@keyframes spin { to { transform: rotate(360deg); } }` (matching the form FnbButton already uses). Uses `computed` → `import { computed } from 'vue'`. No mixins.

**Interfaces — Produces:** `FnbSpin`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbSpin.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSpin } from '../src'

describe('FnbSpin', () => {
  it('renders the wrapped default slot', () => {
    const w = mount(FnbSpin, { slots: { default: '<p class="c">content</p>' } })
    expect(w.find('p.c').exists()).toBe(true)
  })

  it('renders the spinner svg when show is true', () => {
    const w = mount(FnbSpin, { props: { show: true } })
    expect(w.find('svg.spin').exists()).toBe(true)
  })

  it('size prop changes the class list', () => {
    const md = mount(FnbSpin, { props: { show: true, size: 'medium' } })
    const lg = mount(FnbSpin, { props: { show: true, size: 'large' } })
    expect(md.html()).not.toEqual(lg.html())
  })
})
```

> If the source renders the spinner unconditionally (and only toggles visibility via class) rather than with `v-if`, change the second test to assert the overlay/active class appears when `show` is true instead.

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + inline `svg.spin` rule + `@keyframes spin` + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbSpin.vue tests/FnbSpin.spec.ts src/index.ts
git commit -m "feat(spin): port FnbSpin from PixivNow (inline spin keyframes)"
```

---

### Task 13: FnbImage

**Files:**

- Create: `src/components/FnbImage.vue`
- Test: `tests/FnbImage.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbImage.vue`

**Contract:** Props `src: string` (required), `alt?: string`, `previewSrc?: string`, `fallback?: string`. No emits/slots. Click opens a `Teleport(to='body')` full-screen preview (uses `previewSrc` else `src`); `@error` swaps `src` to `fallback`.

**Notes (transition dep):** The preview overlay uses `<Transition name="dialog">`, whose enter/leave CSS lived in PixivNow's `FnbDialog.vue`/`index.vue` (not yet ported). To keep FnbImage self-contained, **rename the transition to a component-local name (e.g. `fnb-image-preview`) and add the matching scoped transition CSS** (a simple opacity fade: `.fnb-image-preview-enter-active, .fnb-image-preview-leave-active { transition: opacity .2s } .fnb-image-preview-enter-from, .fnb-image-preview-leave-to { opacity: 0 }`). Uses `ref` → `import { ref } from 'vue'`. `Teleport`/`Transition` are Vue built-ins (no import). No mixins.

**Interfaces — Produces:** `FnbImage`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbImage.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbImage } from '../src'

describe('FnbImage', () => {
  it('renders an img with src and alt', () => {
    const w = mount(FnbImage, { props: { src: '/a.png', alt: 'pic' } })
    const img = w.find('img').element
    expect(img.getAttribute('src')).toBe('/a.png')
    expect(img.getAttribute('alt')).toBe('pic')
  })

  it('swaps to fallback on error', async () => {
    const w = mount(FnbImage, {
      props: { src: '/broken.png', fallback: '/fallback.png' },
    })
    await w.find('img').trigger('error')
    expect(w.find('img').element.getAttribute('src')).toBe('/fallback.png')
  })

  it('opens the teleported preview on click', async () => {
    const w = mount(FnbImage, {
      props: { src: '/a.png', previewSrc: '/big.png' },
      attachTo: document.body,
    })
    await w.find('img').trigger('click')
    const preview = document.body.querySelector('img[src="/big.png"]')
    expect(preview).not.toBeNull()
    w.unmount()
  })
})
```

> The third test relies on the click handler opening the preview synchronously after a tick. If the source guards the preview behind `previewSrc` only, this holds; if it always uses `src`, assert `img[src="/a.png"]` appears twice instead.

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + rename transition + add scoped fade CSS + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbImage.vue tests/FnbImage.spec.ts src/index.ts
git commit -m "feat(image): port FnbImage from PixivNow (self-contained preview transition)"
```

---

### Task 14: FnbPagination

**Files:**

- Create: `src/components/FnbPagination.vue`
- Test: `tests/FnbPagination.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbPagination.vue`

**Contract:** Props `page?: number` (default `1`), `itemCount: number` (required), `pageSize: number` (required), `pageSlot?: number` (default `7`). Emits `update:page: [value: number]` (v-model:page). No slots. Renders its own native `<button>`s (does NOT use FnbButton/FnbSelect). Computes total pages and a windowed visible-page array with `'...'` ellipsis around the current page; clamps `goTo`.

**Notes:** Uses `computed` → `import { computed } from 'vue'`. Style uses `@include fnb-border-sm`, `fnb-shadow-xs`, `fnb-press` → add `@use '../styles/fnb' as *;`. Keep Chinese aria-labels (`分页导航`/`上一页`/`下一页`).

**Interfaces — Produces:** `FnbPagination`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbPagination.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbPagination } from '../src'

describe('FnbPagination', () => {
  it('renders a button for each page when total is small', () => {
    // 30 items / 10 per page = 3 pages
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toContain('1')
    expect(labels).toContain('2')
    expect(labels).toContain('3')
  })

  it('emits update:page when a page button is clicked', async () => {
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const pageTwo = w.findAll('button').find((b) => b.text() === '2')!
    await pageTwo.trigger('click')
    expect(w.emitted('update:page')).toEqual([[2]])
  })

  it('shows an ellipsis when pages exceed pageSlot', () => {
    // 200 items / 10 = 20 pages, default pageSlot 7
    const w = mount(FnbPagination, {
      props: { page: 10, itemCount: 200, pageSize: 10 },
    })
    expect(w.text()).toContain('...')
  })

  it('does not emit when clicking the current page', async () => {
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const pageOne = w.findAll('button').find((b) => b.text() === '1')!
    await pageOne.trigger('click')
    // clamped/no-op: either no event or emits the same page — assert it never moves off 1
    const emitted = w.emitted('update:page') as number[][] | undefined
    if (emitted) expect(emitted.every(([p]) => p === 1)).toBe(true)
  })
})
```

> If the prev/next controls also render as `<button>`s with text other than digits, the digit-text filters above still select the numbered pages correctly. If clicking the current page is a hard no-op (no handler), the fourth test's `if (emitted)` guard passes trivially.

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + register. **Step 4: GREEN** → PASS (4/4).
- [ ] **Step 5: Verify + commit**

```bash
git add src/components/FnbPagination.vue tests/FnbPagination.spec.ts src/index.ts
git commit -m "feat(pagination): port FnbPagination from PixivNow"
```

---

### Task 15: FnbSelect

**Files:**

- Create: `src/components/FnbSelect.vue`
- Test: `tests/FnbSelect.spec.ts`
- Modify: `src/index.ts`

**Source:** `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/FnbSelect.vue`

**Contract:** Props `options: { label: string; value: string }[]` (required), `modelValue: string` (required). Emits `update:modelValue: [value: string]` (v-model). No slots. Custom listbox combobox: keyboard nav (ArrowUp/Down wrap, Enter/Space, Escape), `aria-activedescendant`, click-outside to close.

**Notes (dependency removal — important):** The source uses `onClickOutside` from `@vueuse/core` (Nuxt auto-import). **Do NOT add `@vueuse/core`.** Replace it with a tiny internal implementation: a `document` `'click'`/`'pointerdown'` listener added on mount and removed on unmount that closes the dropdown when the click target is outside the component root. Wire it with a `ref` to the root element. Pattern:

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue'

const rootEl = ref<HTMLElement | null>(null)

function onDocPointerDown(e: PointerEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', onDocPointerDown)
)
```

Bind `ref="rootEl"` on the component's root element (replacing whatever element the source passed to `onClickOutside`). Also add explicit `import { ref, computed } from 'vue'` for the other composition APIs the source uses. Style uses `@include fnb-border-sm`, `fnb-shadow-xs`, `fnb-shadow-sm` → add `@use '../styles/fnb' as *;`. Keep the source's keyboard/ARIA logic and the local `fnb-select-dropdown` Transition (its CSS is already scoped in the source).

**Interfaces — Produces:** `FnbSelect`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbSelect.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSelect } from '../src'

const options = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

describe('FnbSelect', () => {
  it('shows the selected option label', () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'dark' } })
    expect(w.text()).toContain('Dark')
  })

  it('opens the listbox on trigger click and lists options', async () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'light' } })
    await w
      .find('[role="combobox"], button, .fnb-select__trigger')
      .trigger('click')
    expect(w.text()).toContain('Light')
    expect(w.text()).toContain('Dark')
  })

  it('emits update:modelValue when an option is chosen', async () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'light' } })
    await w
      .find('[role="combobox"], button, .fnb-select__trigger')
      .trigger('click')
    const darkOption = w
      .findAll('[role="option"], li')
      .find((n) => n.text().includes('Dark'))!
    await darkOption.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['dark']])
  })
})
```

> The selectors above are tolerant of the source's exact markup (combobox role / button / trigger class; option role / `li`). During GREEN, narrow them to the source's actual trigger and option elements if a selector matches the wrong node.

- [ ] **Step 2: RED** → FAIL. **Step 3:** Port + replace `onClickOutside` with the internal listener + register. **Step 4: GREEN** → PASS (3/3).
- [ ] **Step 5: Verify + commit**

Run full gates (`pnpm test && pnpm lint && pnpm typecheck && pnpm verify`).

```bash
git add src/components/FnbSelect.vue tests/FnbSelect.spec.ts src/index.ts
git commit -m "feat(select): port FnbSelect from PixivNow (internal click-outside, no vueuse)"
```

---

## Self-Review

**Spec coverage (this plan targets spec §5 "直接移植" + the `FnbMbox→FnbAlert` rename):**

- Direct-port list (FnbCard, FnbInput, FnbSelect, FnbTag, FnbTable, FnbPagination, FnbProgress, FnbSkeleton, FnbSpin, FnbScrollbar, FnbImage, FnbFloatButton, FnbEllipsis, FnbResult) → Tasks 1–8, 10–15. All 14 present.
- Rename `FnbMbox → FnbAlert` → Task 9.
- Spec §6.3 behavior fidelity → enforced in Global Constraints + the "preserve verbatim" port procedure.
- Spec §7 token model (only `--fnb-*`, mixins per-component) → Global Constraints + per-task `@use` notes.
- Out of scope (later plans): FnbTabs/Provider/Hook (Plan 3), docs site (Plan 4), Nuxt + publish (Plan 5), ThemeToggle (stays in consuming projects).

**Decisions baked in (flagged for the executor):**

- No `@vueuse/core` dependency — FnbSelect uses an internal click-outside listener (Task 15).
- Inherited animations/transitions are inlined per-component (Tasks 11 imgProgress, 12 spin, 13 preview fade), matching FnbButton's precedent — no global animation sheet, no foundation churn.

**Placeholder scan:** No TBD/TODO. The component bodies are "copy source at exact path + apply the stated transforms" — the source paths are exact and the transforms are concrete; the NEW code (every test, the click-outside snippet) is complete inline. Reconciliation notes (modifier class names, exact markup selectors) are explicit GREEN-step instructions, not deferred work.

**Type/contract consistency:** Every task's test uses the props/emits/slots from the analyzed source contracts; emit names (`update:modelValue`, `update:page`, `click`, `close`) match the sources. `src/index.ts` grows by exactly one import + one export entry + one map entry per task, consistent across all 15.

---

## Roadmap (after this plan)

3. **API refactor** — `FnbTabs`/`FnbTabPane` (composable) + Provider/Hook system (`FnbConfigProvider`, `FnbMessageProvider`+`useMessage`, `FnbDialogProvider`+`useDialog`, aggregate `FnbProvider`), grounded on `../naive-ui` source. Replaces PixivNow's `FnbTabs`/`FnbDialog`/`FnbToast`/`FnbProvider`.
4. **Docs site** — VitePress + demos in `website/`.
5. **Nuxt module + first publish.**
