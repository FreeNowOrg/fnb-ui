# fnb-ui API Refactor (Tabs + Provider/Hook) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the spec §6 API-refactor components — compositional `FnbTabs`/`FnbTabPane`, and the Provider/Hook system (`FnbConfigProvider`, `FnbMessageProvider`+`useMessage`, `FnbDialogProvider`+`useDialog`, aggregate `FnbProvider`) — replacing PixivNow's flat-prop Tabs and module-singleton toast/dialog with idiomatic Vue 3 provide/inject.

**Architecture:** Each subsystem uses a typed `InjectionKey` + provide/inject (no module-level singletons). Tabs: `FnbTabPane`s self-register into a reactive registry provided by `FnbTabs`; the parent renders the nav (supporting a rich `#tab` slot), each pane renders its own `v-show`-gated panel. Message/Dialog: a Provider owns reactive state and `provide`s an `api`; `useMessage()`/`useDialog()` inject it (throw if no provider); overlays render via `Teleport` to body. Dialog confirm returns a `Promise<boolean>` (spec §6.2). Config: `FnbConfigProvider` applies `theme-overrides` as inline `--fnb-*` CSS variables on its root element + a `.dark` class. Behavior/visuals match the existing PixivNow components (spec §6.3); only the API shape changes.

**Tech Stack:** Vue 3.5 `<script setup>` + Pug + scoped SCSS, Vitest + `@vue/test-utils` (jsdom). Reference: `../naive-ui/src/{tabs,message,dialog,config-provider}`.

## Global Constraints

- **Component prefix `Fnb`**; ESM-only; Vue is a peer dependency (never bundled).
- **No module-level singleton state** — all cross-component state flows through provide/inject (this is the whole point of the refactor; the old `useToast`/`useDialog` module singletons are NOT ported).
- **`useMessage()` / `useDialog()` throw** a clear error when called with no matching Provider above them.
- **Behavior & visual fidelity (spec §6.3):** neubrutalism look, type→color maps, transitions, placement must match the existing PixivNow `Fnb*` — only the API changes. Source references: `/Users/xiaoyujun/GitRepositories/PixivNow/app/components/ui/{FnbTabs,FnbToast,FnbDialog}.vue` and `app/composables/{useToast,useDialog}.ts`.
- **Mixins per-component** via `@use '../styles/fnb' as *;` where `@include fnb-*` is used. **Only `--fnb-*` tokens.** No `--pixiv-*`. No new runtime dependencies.
- **Dialog confirm is Promise-based** (`useDialog().confirm(opts): Promise<boolean>`) per spec §6.2 — NOT naive's callback style.
- **Code style (Prettier):** no semicolons, single quotes, 2-space, es5 trailing commas. Pug template, SCSS, English comments. `@prettier/plugin-pug` may rewrite Pug attribute spacing — expected. After authoring, run `pnpm prettier --check` on only your new files.
- **Strict typing:** the library typechecks under `vue-tsc`; computed inline-style objects that use vendor-prefixed keys need `computed<CSSProperties>` (`import type { CSSProperties } from 'vue'`).
- **Gates per task:** `pnpm test` (full suite green), `pnpm lint && pnpm typecheck` (exit 0), `pnpm prettier --check` (your files), `pnpm verify` (`verify-dist OK`).

## Design Decisions (resolved up front)

1. **Tabs = self-registration** (spec §6.1): `FnbTabPane` registers `{ name, tab, tabSlot }` into a reactive registry on the `FnbTabs` context; `FnbTabs` renders the nav from the registry (rendering the registered `#tab` slot when present, else the `tab` string); each `FnbTabPane` renders its own `v-show`-gated panel. (Differs from naive's slot-vnode filtering, but fits Pug SFCs and matches the spec text; supports the rich `#tab` slot the spec requires.)
2. **Dialog = Promise** (spec §6.2): `confirm()` returns `Promise<boolean>`; positive→`true`, negative/overlay/close→`false`. Single dialog at a time (matches PixivNow).
3. **Message = provider-scoped setTimeout model** (PixivNow's simple model, moved off the module singleton into provider provide/inject). `useMessage().{info,success,warning,error}(content, { duration? })` → handle with `.destroy()`.
4. **theme-overrides shape:** `Record<string, string>` keyed by token name WITHOUT the `--fnb-` prefix (e.g. `{ brand: '#ff5577' }`); the provider emits `--fnb-${key}` inline CSS variables on its root element.
5. **Teleport caveat (documented, accepted for v1):** `FnbMessageProvider`/`FnbDialogProvider` teleport overlays to `body`, escaping `FnbConfigProvider`'s subtree, so scoped `theme-overrides`/`dark` do NOT restyle messages/dialogs — those follow the global `:root`/`.dark` tokens. Global theming (spec §7 layer 1) is unaffected.

---

### Task 1: FnbTabs + FnbTabPane (compositional, self-registering)

**Files:**
- Create: `src/components/tabs-context.ts`
- Create: `src/components/FnbTabs.vue`
- Create: `src/components/FnbTabPane.vue`
- Test: `tests/FnbTabs.spec.ts`
- Modify: `src/index.ts`

**Interfaces — Produces:**
- `tabs-context.ts`: `FnbTabPaneInfo` (`{ name: string; tab?: string; tabSlot?: Slot }`), `FnbTabsContext` (`{ activeName: ComputedRef<string | undefined>; registerPane(p: FnbTabPaneInfo): void; unregisterPane(name: string): void }`), `fnbTabsKey: InjectionKey<FnbTabsContext>`.
- `FnbTabs`: props `value?: string` (v-model:value), `type?: 'line' | 'segment'` (default `'line'`), `size?: 'small' | 'medium' | 'large'` (default `'medium'`); emits `update:value: [value: string]`; default slot holds `FnbTabPane`s.
- `FnbTabPane`: props `name: string` (required), `tab?: string`; default slot = panel; named slot `tab` = rich nav label.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbTabs.spec.ts
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbTabs, FnbTabPane } from '../src'

function mountTabs(props = {}) {
  return mount(FnbTabs, {
    props: { value: 'a', ...props },
    slots: {
      default: () => [
        h(FnbTabPane, { name: 'a', tab: 'Apple' }, { default: () => 'Panel A' }),
        h(FnbTabPane, { name: 'b', tab: 'Banana' }, { default: () => 'Panel B' }),
      ],
    },
  })
}

describe('FnbTabs', () => {
  it('renders a nav button per pane from the tab prop', () => {
    const w = mountTabs()
    const labels = w.findAll('.fnb-tabs__tab').map((b) => b.text())
    expect(labels).toEqual(['Apple', 'Banana'])
  })

  it('shows only the active pane panel', () => {
    const w = mountTabs({ value: 'a' })
    expect(w.text()).toContain('Panel A')
    // Panel B is rendered but v-show-hidden
    const panelB = w.findAll('.fnb-tabs__panel')[1]
    expect(panelB.attributes('style')).toContain('display: none')
  })

  it('marks the active tab and emits update:value on click', async () => {
    const w = mountTabs({ value: 'a' })
    const tabs = w.findAll('.fnb-tabs__tab')
    expect(tabs[0].classes()).toContain('fnb-tabs__tab--active')
    await tabs[1].trigger('click')
    expect(w.emitted('update:value')).toEqual([['b']])
  })

  it('applies type and size modifier classes', () => {
    const w = mountTabs({ type: 'segment', size: 'small' })
    expect(w.classes()).toContain('fnb-tabs--segment')
    expect(w.classes()).toContain('fnb-tabs--small')
  })

  it('renders a rich #tab slot when provided', () => {
    const w = mount(FnbTabs, {
      props: { value: 'x' },
      slots: {
        default: () => [
          h(FnbTabPane, { name: 'x' }, { tab: () => h('span', { class: 'ico' }, '★'), default: () => 'PX' }),
        ],
      },
    })
    expect(w.find('.fnb-tabs__tab .ico').text()).toBe('★')
  })

  it('FnbTabPane throws when used outside FnbTabs', () => {
    expect(() => mount(FnbTabPane, { props: { name: 'a' } })).toThrow(/FnbTabs/)
  })
})
```

- [ ] **Step 2: Run test, confirm RED**

Run: `pnpm test tests/FnbTabs.spec.ts`
Expected: FAIL — `FnbTabs`/`FnbTabPane` not exported.

- [ ] **Step 3: Create `src/components/tabs-context.ts`**

```ts
import type { ComputedRef, InjectionKey, Slot } from 'vue'

export interface FnbTabPaneInfo {
  name: string
  tab?: string
  // Optional rich nav label (the FnbTabPane's `#tab` slot).
  tabSlot?: Slot
}

export interface FnbTabsContext {
  activeName: ComputedRef<string | undefined>
  registerPane: (pane: FnbTabPaneInfo) => void
  unregisterPane: (name: string) => void
}

export const fnbTabsKey: InjectionKey<FnbTabsContext> = Symbol('fnb-tabs')
```

- [ ] **Step 4: Create `src/components/FnbTabs.vue`**

```vue
<template lang="pug">
.fnb-tabs(:class='[`fnb-tabs--${type}`, `fnb-tabs--${size}`]')
  .fnb-tabs__nav(role='tablist')
    button.fnb-tabs__tab(
      v-for='pane in panes'
      :key='pane.name'
      type='button'
      role='tab'
      :aria-selected='pane.name === activeName'
      :class='{ "fnb-tabs__tab--active": pane.name === activeName }'
      @click='select(pane.name)'
    )
      component(v-if='pane.tabSlot' :is='{ render: pane.tabSlot }')
      template(v-else) {{ pane.tab ?? pane.name }}
  .fnb-tabs__panels
    slot
</template>

<script lang="ts" setup>
import { computed, provide, reactive } from 'vue'
import { fnbTabsKey } from './tabs-context'
import type { FnbTabPaneInfo } from './tabs-context'

const props = withDefaults(
  defineProps<{
    value?: string
    type?: 'line' | 'segment'
    size?: 'small' | 'medium' | 'large'
  }>(),
  { type: 'line', size: 'medium' }
)

const emit = defineEmits<{ 'update:value': [value: string] }>()

// Panes self-register in slot/mount order.
const panes = reactive<FnbTabPaneInfo[]>([])

const activeName = computed(() => props.value ?? panes[0]?.name)

function select(name: string) {
  if (name !== props.value) emit('update:value', name)
}

provide(fnbTabsKey, {
  activeName,
  registerPane(pane) {
    if (!panes.some((p) => p.name === pane.name)) panes.push(pane)
  },
  unregisterPane(name) {
    const i = panes.findIndex((p) => p.name === name)
    if (i !== -1) panes.splice(i, 1)
  },
})
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-tabs__nav {
  display: flex;
  gap: 3px;
}

.fnb-tabs__tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  color: var(--fnb-text-muted);
  background: transparent;
  border: 3px solid transparent;
  cursor: pointer;
  transition:
    color 150ms,
    background 150ms;

  &:hover:not(.fnb-tabs__tab--active) {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &--active {
    color: var(--fnb-on-brand);
    font-weight: 900;
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}

.fnb-tabs__panels {
  margin-top: 1rem;
}

// segment: boxed equal-width nav (the PixivNow look)
.fnb-tabs--segment .fnb-tabs__nav {
  @include fnb-border;
  padding: 3px;
  background: var(--fnb-surface);
}

// line: underline-style nav
.fnb-tabs--line {
  .fnb-tabs__nav {
    border-bottom: 3px solid var(--fnb-border);
    gap: 0;
  }

  .fnb-tabs__tab {
    flex: 0 0 auto;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -3px;

    &--active {
      color: var(--fnb-brand);
      background: transparent;
      border-bottom-color: var(--fnb-brand);
    }

    &:hover:not(.fnb-tabs__tab--active) {
      background: transparent;
      color: var(--fnb-text);
    }
  }
}

// sizes
.fnb-tabs--small .fnb-tabs__tab {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.fnb-tabs--large .fnb-tabs__tab {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}
</style>
```

- [ ] **Step 5: Create `src/components/FnbTabPane.vue`**

```vue
<template lang="pug">
.fnb-tabs__panel(v-show='isActive' role='tabpanel')
  slot
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, useSlots } from 'vue'
import { fnbTabsKey } from './tabs-context'

const props = defineProps<{ name: string; tab?: string }>()
const slots = useSlots()

const ctx = inject(fnbTabsKey)
if (!ctx) {
  throw new Error('[fnb-ui] FnbTabPane must be used inside FnbTabs')
}

const isActive = computed(() => ctx.activeName.value === props.name)

onMounted(() => {
  ctx.registerPane({ name: props.name, tab: props.tab, tabSlot: slots.tab })
})
onBeforeUnmount(() => {
  ctx.unregisterPane(props.name)
})
</script>
```

- [ ] **Step 6: Register in `src/index.ts`**

Add to the import block, the `export { ... }` list, and the `components` map: `FnbTabs`, `FnbTabPane`. Also re-export the public types:

```ts
import FnbTabs from './components/FnbTabs.vue'
import FnbTabPane from './components/FnbTabPane.vue'
// ...add FnbTabs, FnbTabPane to `export { ... }` and the `components` map...
export type { FnbTabPaneInfo, FnbTabsContext } from './components/tabs-context'
```

- [ ] **Step 7: Run test, confirm GREEN**

Run: `pnpm test tests/FnbTabs.spec.ts`
Expected: PASS (6/6).

- [ ] **Step 8: Gates + commit**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm verify`
```bash
git add src/components/tabs-context.ts src/components/FnbTabs.vue src/components/FnbTabPane.vue tests/FnbTabs.spec.ts src/index.ts
git commit -m "feat(tabs): add compositional FnbTabs + FnbTabPane"
```

---

### Task 2: FnbConfigProvider (theme-overrides + dark)

**Files:**
- Create: `src/providers/config-context.ts`
- Create: `src/providers/FnbConfigProvider.vue`
- Test: `tests/FnbConfigProvider.spec.ts`
- Modify: `src/index.ts`

**Interfaces — Produces:**
- `config-context.ts`: `FnbThemeOverrides` (`Record<string, string>`), `FnbConfigContext` (`{ themeOverrides: ComputedRef<FnbThemeOverrides>; dark: ComputedRef<boolean> }`), `fnbConfigKey: InjectionKey<FnbConfigContext>`.
- `FnbConfigProvider`: props `themeOverrides?: FnbThemeOverrides` (token names without `--fnb-` prefix), `dark?: boolean`; renders a `<div class="fnb-config-provider">` with inline `--fnb-*` vars + `.dark` class; merges over any parent `FnbConfigProvider` and re-provides the merged config.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbConfigProvider.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbConfigProvider } from '../src'

describe('FnbConfigProvider', () => {
  it('emits theme-overrides as inline --fnb-* css variables', () => {
    const w = mount(FnbConfigProvider, {
      props: { themeOverrides: { brand: '#ff5577', surface: '#fafafa' } },
      slots: { default: 'child' },
    })
    const style = w.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #ff5577')
    expect(style).toContain('--fnb-surface: #fafafa')
    expect(w.text()).toContain('child')
  })

  it('toggles the dark class', () => {
    const light = mount(FnbConfigProvider, { props: {}, slots: { default: 'x' } })
    expect(light.classes()).not.toContain('dark')
    const dark = mount(FnbConfigProvider, { props: { dark: true }, slots: { default: 'x' } })
    expect(dark.classes()).toContain('dark')
  })

  it('merges nested config providers (child overrides win, parent inherited)', () => {
    const Parent = {
      components: { FnbConfigProvider },
      template: `
        <FnbConfigProvider :theme-overrides="{ brand: '#111111', surface: '#222222' }">
          <FnbConfigProvider :theme-overrides="{ brand: '#999999' }" class="inner">
            <span>n</span>
          </FnbConfigProvider>
        </FnbConfigProvider>
      `,
    }
    const w = mount(Parent)
    const inner = w.find('.inner')
    const style = inner.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #999999') // child wins
    expect(style).toContain('--fnb-surface: #222222') // inherited from parent
  })
})
```

- [ ] **Step 2: Run test, confirm RED** — `pnpm test tests/FnbConfigProvider.spec.ts` → FAIL.

- [ ] **Step 3: Create `src/providers/config-context.ts`**

```ts
import type { ComputedRef, InjectionKey } from 'vue'

export type FnbThemeOverrides = Record<string, string>

export interface FnbConfigContext {
  themeOverrides: ComputedRef<FnbThemeOverrides>
  dark: ComputedRef<boolean>
}

export const fnbConfigKey: InjectionKey<FnbConfigContext> = Symbol('fnb-config')
```

- [ ] **Step 4: Create `src/providers/FnbConfigProvider.vue`**

```vue
<template lang="pug">
.fnb-config-provider(:class='{ dark: mergedDark }' :style='cssVars')
  slot
</template>

<script lang="ts" setup>
import { computed, inject, provide } from 'vue'
import type { CSSProperties } from 'vue'
import { fnbConfigKey } from './config-context'
import type { FnbThemeOverrides } from './config-context'

const props = defineProps<{
  themeOverrides?: FnbThemeOverrides
  dark?: boolean
}>()

const parent = inject(fnbConfigKey, null)

// Child overrides win; missing keys inherit from a parent provider.
const mergedOverrides = computed<FnbThemeOverrides>(() => ({
  ...(parent?.themeOverrides.value ?? {}),
  ...(props.themeOverrides ?? {}),
}))

const mergedDark = computed(() => props.dark ?? parent?.dark.value ?? false)

const cssVars = computed<CSSProperties>(() => {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(mergedOverrides.value)) {
    vars[`--fnb-${key}`] = value
  }
  return vars as CSSProperties
})

provide(fnbConfigKey, {
  themeOverrides: mergedOverrides,
  dark: mergedDark,
})
</script>
```

- [ ] **Step 5: Register in `src/index.ts`** — add `FnbConfigProvider` to imports, `export { ... }`, and the `components` map; re-export types:

```ts
import FnbConfigProvider from './providers/FnbConfigProvider.vue'
export type { FnbThemeOverrides, FnbConfigContext } from './providers/config-context'
```

- [ ] **Step 6: Run test, confirm GREEN** — `pnpm test tests/FnbConfigProvider.spec.ts` → PASS (3/3).

- [ ] **Step 7: Gates + commit**

```bash
git add src/providers/config-context.ts src/providers/FnbConfigProvider.vue tests/FnbConfigProvider.spec.ts src/index.ts
git commit -m "feat(config-provider): add FnbConfigProvider (theme-overrides + dark)"
```

---

### Task 3: FnbMessageProvider + useMessage

**Files:**
- Create: `src/providers/message-context.ts`
- Create: `src/providers/FnbMessageProvider.vue`
- Create: `src/composables/useMessage.ts`
- Test: `tests/useMessage.spec.ts`
- Modify: `src/index.ts`

**Interfaces — Produces:**
- `message-context.ts`: `FnbMessageType` (`'info' | 'success' | 'warning' | 'error'`), `FnbMessageOptions` (`{ duration?: number }`), `FnbMessageHandle` (`{ destroy: () => void }`), `FnbMessageApi` (`{ info; success; warning; error }`, each `(content: string, options?: FnbMessageOptions) => FnbMessageHandle`), `fnbMessageKey: InjectionKey<FnbMessageApi>`.
- `FnbMessageProvider`: no props; renders default slot + a teleported top-center stack.
- `useMessage(): FnbMessageApi` — injects the api; throws if no provider.

- [ ] **Step 1: Write the failing test**

```ts
// tests/useMessage.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbMessageProvider, useMessage } from '../src'

const Child = defineComponent({
  setup(_, { expose }) {
    const message = useMessage()
    expose({ message })
    return () => h('div', 'child')
  },
})

function mountWithProvider() {
  return mount(FnbMessageProvider, {
    attachTo: document.body,
    slots: { default: () => h(Child, { ref: 'child' }) },
  })
}

describe('useMessage', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders a success message in a teleported container', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).message.success('Saved')
    await w.vm.$nextTick()
    const el = document.body.querySelector('.fnb-message--success')
    expect(el).not.toBeNull()
    expect(el!.textContent).toContain('Saved')
  })

  it('auto-dismisses after the duration', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).message.info('Hi', { duration: 1000 })
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).not.toBeNull()
    vi.advanceTimersByTime(1100)
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).toBeNull()
  })

  it('handle.destroy() removes the message early', async () => {
    const w = mountWithProvider()
    const handle = (w.vm.$refs.child as any).message.error('Boom')
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message--error')).not.toBeNull()
    handle.destroy()
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).toBeNull()
  })

  it('useMessage throws without a provider', () => {
    const Lonely = defineComponent({
      setup() {
        useMessage()
        return () => h('div')
      },
    })
    expect(() => mount(Lonely)).toThrow(/FnbMessageProvider/)
  })
})
```

- [ ] **Step 2: Run test, confirm RED** — `pnpm test tests/useMessage.spec.ts` → FAIL.

- [ ] **Step 3: Create `src/providers/message-context.ts`**

```ts
import type { InjectionKey } from 'vue'

export type FnbMessageType = 'info' | 'success' | 'warning' | 'error'

export interface FnbMessageOptions {
  // Auto-dismiss delay in ms (default 3000).
  duration?: number
}

export interface FnbMessageHandle {
  destroy: () => void
}

export type FnbMessageApi = {
  [K in FnbMessageType]: (content: string, options?: FnbMessageOptions) => FnbMessageHandle
}

export const fnbMessageKey: InjectionKey<FnbMessageApi> = Symbol('fnb-message')
```

- [ ] **Step 4: Create `src/composables/useMessage.ts`**

```ts
import { inject } from 'vue'
import { fnbMessageKey } from '../providers/message-context'
import type { FnbMessageApi } from '../providers/message-context'

export function useMessage(): FnbMessageApi {
  const api = inject(fnbMessageKey, null)
  if (!api) {
    throw new Error('[fnb-ui] useMessage() requires an outer <FnbMessageProvider>')
  }
  return api
}
```

- [ ] **Step 5: Create `src/providers/FnbMessageProvider.vue`**

Visuals ported from PixivNow `FnbToast.vue` (top-center stack, type colors, slide+fade TransitionGroup).

```vue
<template lang="pug">
slot
Teleport(to='body')
  TransitionGroup.fnb-message-container(name='fnb-message' tag='div')
    .fnb-message(
      v-for='m in messages'
      :key='m.id'
      :class='`fnb-message--${m.type}`'
      role='alert'
    ) {{ m.content }}
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { provide } from 'vue'
import { fnbMessageKey } from './message-context'
import type {
  FnbMessageApi,
  FnbMessageHandle,
  FnbMessageOptions,
  FnbMessageType,
} from './message-context'

interface MessageItem {
  id: number
  content: string
  type: FnbMessageType
}

const messages = reactive<MessageItem[]>([])
let nextId = 0

function remove(id: number) {
  const i = messages.findIndex((m) => m.id === id)
  if (i !== -1) messages.splice(i, 1)
}

function create(
  content: string,
  type: FnbMessageType,
  options?: FnbMessageOptions
): FnbMessageHandle {
  const id = nextId++
  messages.push({ id, content, type })
  const duration = options?.duration ?? 3000
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  return { destroy: () => remove(id) }
}

const api: FnbMessageApi = {
  info: (content, options) => create(content, 'info', options),
  success: (content, options) => create(content, 'success', options),
  warning: (content, options) => create(content, 'warning', options),
  error: (content, options) => create(content, 'error', options),
}

provide(fnbMessageKey, api)
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-message-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.fnb-message {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  max-width: 80vw;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  pointer-events: auto;

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }

  &--warning {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }

  &--error {
    background: var(--fnb-danger);
    color: var(--fnb-on-brand);
  }
}

.fnb-message-enter-active,
.fnb-message-leave-active {
  transition:
    transform 250ms ease-out,
    opacity 250ms ease-out;
}

.fnb-message-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fnb-message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

- [ ] **Step 6: Register in `src/index.ts`** — add `FnbMessageProvider` to imports/`export`/`components` map; export `useMessage` and the message types:

```ts
import FnbMessageProvider from './providers/FnbMessageProvider.vue'
export { useMessage } from './composables/useMessage'
export type {
  FnbMessageApi,
  FnbMessageType,
  FnbMessageOptions,
  FnbMessageHandle,
} from './providers/message-context'
```

- [ ] **Step 7: Run test, confirm GREEN** — `pnpm test tests/useMessage.spec.ts` → PASS (4/4).

- [ ] **Step 8: Gates + commit**

```bash
git add src/providers/message-context.ts src/providers/FnbMessageProvider.vue src/composables/useMessage.ts tests/useMessage.spec.ts src/index.ts
git commit -m "feat(message): add FnbMessageProvider + useMessage"
```

---

### Task 4: FnbDialogProvider + useDialog (Promise-based confirm)

**Files:**
- Create: `src/providers/dialog-context.ts`
- Create: `src/providers/FnbDialogProvider.vue`
- Create: `src/composables/useDialog.ts`
- Test: `tests/useDialog.spec.ts`
- Modify: `src/index.ts`

**Interfaces — Produces:**
- `dialog-context.ts`: `FnbDialogOptions` (`{ title: string; content: string; positiveText?: string; negativeText?: string }`), `FnbDialogApi` (`{ confirm(options: FnbDialogOptions): Promise<boolean> }`), `fnbDialogKey: InjectionKey<FnbDialogApi>`.
- `FnbDialogProvider`: no props; renders default slot + a teleported overlay dialog using `FnbButton`.
- `useDialog(): FnbDialogApi` — injects; throws if no provider.

- [ ] **Step 1: Write the failing test**

```ts
// tests/useDialog.spec.ts
import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbDialogProvider, useDialog } from '../src'

const Child = defineComponent({
  setup(_, { expose }) {
    const dialog = useDialog()
    expose({ dialog })
    return () => h('div', 'child')
  },
})

function mountWithProvider() {
  return mount(FnbDialogProvider, {
    attachTo: document.body,
    slots: { default: () => h(Child, { ref: 'child' }) },
  })
}

describe('useDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens a dialog showing title and content', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).dialog.confirm({ title: 'Delete?', content: 'Sure?' })
    await w.vm.$nextTick()
    const el = document.body.querySelector('.fnb-dialog')
    expect(el).not.toBeNull()
    expect(el!.textContent).toContain('Delete?')
    expect(el!.textContent).toContain('Sure?')
  })

  it('resolves true on positive click', async () => {
    const w = mountWithProvider()
    const p = (w.vm.$refs.child as any).dialog.confirm({ title: 't', content: 'c' })
    await w.vm.$nextTick()
    const positive = document.body.querySelector('.fnb-dialog__footer .fnb-button--primary') as HTMLElement
    positive.click()
    await w.vm.$nextTick()
    await expect(p).resolves.toBe(true)
    expect(document.body.querySelector('.fnb-dialog')).toBeNull()
  })

  it('resolves false on negative click', async () => {
    const w = mountWithProvider()
    const p = (w.vm.$refs.child as any).dialog.confirm({ title: 't', content: 'c', negativeText: 'Cancel' })
    await w.vm.$nextTick()
    const buttons = [...document.body.querySelectorAll('.fnb-dialog__footer .fnb-button')] as HTMLElement[]
    const negative = buttons.find((b) => b.textContent?.includes('Cancel'))!
    negative.click()
    await w.vm.$nextTick()
    await expect(p).resolves.toBe(false)
  })

  it('useDialog throws without a provider', () => {
    const Lonely = defineComponent({
      setup() {
        useDialog()
        return () => h('div')
      },
    })
    expect(() => mount(Lonely)).toThrow(/FnbDialogProvider/)
  })
})
```

- [ ] **Step 2: Run test, confirm RED** — `pnpm test tests/useDialog.spec.ts` → FAIL.

- [ ] **Step 3: Create `src/providers/dialog-context.ts`**

```ts
import type { InjectionKey } from 'vue'

export interface FnbDialogOptions {
  title: string
  content: string
  positiveText?: string
  negativeText?: string
}

export interface FnbDialogApi {
  confirm: (options: FnbDialogOptions) => Promise<boolean>
}

export const fnbDialogKey: InjectionKey<FnbDialogApi> = Symbol('fnb-dialog')
```

- [ ] **Step 4: Create `src/composables/useDialog.ts`**

```ts
import { inject } from 'vue'
import { fnbDialogKey } from '../providers/dialog-context'
import type { FnbDialogApi } from '../providers/dialog-context'

export function useDialog(): FnbDialogApi {
  const api = inject(fnbDialogKey, null)
  if (!api) {
    throw new Error('[fnb-ui] useDialog() requires an outer <FnbDialogProvider>')
  }
  return api
}
```

- [ ] **Step 5: Create `src/providers/FnbDialogProvider.vue`**

Visuals ported from PixivNow `FnbDialog.vue` (overlay, neubrutalist card, display-font header, FnbButton footer, scoped scale+fade transition, body scroll lock). State is provider-scoped (not a module singleton); `confirm()` returns a Promise.

```vue
<template lang="pug">
slot
Teleport(to='body')
  Transition(name='fnb-dialog')
    .fnb-dialog-overlay(v-if='state' @click.self='resolve(false)')
      .fnb-dialog(role='dialog' aria-modal='true')
        button.fnb-dialog__close(type='button' aria-label='关闭' @click='resolve(false)') ×
        .fnb-dialog__header {{ state.title }}
        .fnb-dialog__body {{ state.content }}
        .fnb-dialog__footer
          FnbButton(v-if='state.negativeText' @click='resolve(false)') {{ state.negativeText }}
          FnbButton(variant='primary' @click='resolve(true)') {{ state.positiveText ?? '确定' }}
</template>

<script lang="ts" setup>
import { provide, ref, watch } from 'vue'
import FnbButton from '../components/FnbButton.vue'
import { fnbDialogKey } from './dialog-context'
import type { FnbDialogApi, FnbDialogOptions } from './dialog-context'

interface DialogState extends FnbDialogOptions {
  resolve: (value: boolean) => void
}

const state = ref<DialogState | null>(null)

function resolve(value: boolean) {
  state.value?.resolve(value)
  state.value = null
}

const api: FnbDialogApi = {
  confirm(options) {
    // Resolve any currently-open dialog as cancelled before opening a new one.
    state.value?.resolve(false)
    return new Promise<boolean>((res) => {
      state.value = { ...options, resolve: res }
    })
  },
}

provide(fnbDialogKey, api)

// Lock body scroll while a dialog is open.
watch(
  () => state.value !== null,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog {
  @include fnb-border;
  @include fnb-shadow-lg;
  position: relative;
  width: 400px;
  max-width: 86vw;
  max-height: 80vh;
  overflow: auto;
  padding: 1.5rem;
  background: var(--fnb-surface);
  color: var(--fnb-text);

  &__close {
    position: absolute;
    top: 0.5rem;
    right: 0.75rem;
    font-size: 1.5rem;
    line-height: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--fnb-text-muted);
  }

  &__header {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  &__body {
    color: var(--fnb-text);
    margin-bottom: 1.5rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
}

.fnb-dialog-enter-active,
.fnb-dialog-leave-active {
  transition: opacity 200ms ease;
}

.fnb-dialog-enter-active .fnb-dialog,
.fnb-dialog-leave-active .fnb-dialog {
  transition: transform 200ms ease;
}

.fnb-dialog-enter-from,
.fnb-dialog-leave-to {
  opacity: 0;
}

.fnb-dialog-enter-from .fnb-dialog {
  transform: scale(0.9) translateY(10px);
}

.fnb-dialog-leave-to .fnb-dialog {
  transform: scale(0.95);
}
</style>
```

- [ ] **Step 6: Register in `src/index.ts`** — add `FnbDialogProvider` to imports/`export`/`components`; export `useDialog` + types:

```ts
import FnbDialogProvider from './providers/FnbDialogProvider.vue'
export { useDialog } from './composables/useDialog'
export type { FnbDialogApi, FnbDialogOptions } from './providers/dialog-context'
```

- [ ] **Step 7: Run test, confirm GREEN** — `pnpm test tests/useDialog.spec.ts` → PASS (4/4).

- [ ] **Step 8: Gates + commit**

```bash
git add src/providers/dialog-context.ts src/providers/FnbDialogProvider.vue src/composables/useDialog.ts tests/useDialog.spec.ts src/index.ts
git commit -m "feat(dialog): add FnbDialogProvider + useDialog (promise confirm)"
```

---

### Task 5: FnbProvider (aggregate config + message + dialog)

**Files:**
- Create: `src/providers/FnbProvider.vue`
- Test: `tests/FnbProvider.spec.ts`
- Modify: `src/index.ts`

**Interfaces — Produces:**
- `FnbProvider`: props `themeOverrides?: FnbThemeOverrides`, `dark?: boolean` (passed through to `FnbConfigProvider`); nests `FnbConfigProvider > FnbMessageProvider > FnbDialogProvider > slot`, so a single wrap enables `useMessage`/`useDialog` and config.

- [ ] **Step 1: Write the failing test**

```ts
// tests/FnbProvider.spec.ts
import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbProvider, useMessage, useDialog } from '../src'

const Child = defineComponent({
  setup() {
    // Both hooks must resolve inside FnbProvider without throwing.
    const message = useMessage()
    const dialog = useDialog()
    message.success('ready')
    return () => h('div', { class: 'ok' }, typeof dialog.confirm === 'function' ? 'ok' : 'bad')
  },
})

describe('FnbProvider', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('provides message + dialog + config from a single wrapper', async () => {
    const w = mount(FnbProvider, {
      attachTo: document.body,
      props: { themeOverrides: { brand: '#abcdef' } },
      slots: { default: () => h(Child) },
    })
    await w.vm.$nextTick()
    expect(w.find('.ok').text()).toBe('ok')
    expect(document.body.querySelector('.fnb-message--success')).not.toBeNull()
    // config provider applied the override on its root
    const style = w.find('.fnb-config-provider').attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #abcdef')
  })
})
```

- [ ] **Step 2: Run test, confirm RED** — `pnpm test tests/FnbProvider.spec.ts` → FAIL.

- [ ] **Step 3: Create `src/providers/FnbProvider.vue`**

```vue
<template lang="pug">
FnbConfigProvider(:theme-overrides='themeOverrides' :dark='dark')
  FnbMessageProvider
    FnbDialogProvider
      slot
</template>

<script lang="ts" setup>
import FnbConfigProvider from './FnbConfigProvider.vue'
import FnbMessageProvider from './FnbMessageProvider.vue'
import FnbDialogProvider from './FnbDialogProvider.vue'
import type { FnbThemeOverrides } from './config-context'

defineProps<{
  themeOverrides?: FnbThemeOverrides
  dark?: boolean
}>()
</script>
```

- [ ] **Step 4: Register in `src/index.ts`** — add `FnbProvider` to imports, `export { ... }`, and the `components` map.

- [ ] **Step 5: Run test, confirm GREEN** — `pnpm test tests/FnbProvider.spec.ts` → PASS (1/1).

- [ ] **Step 6: Full gates + commit**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm verify`
```bash
git add src/providers/FnbProvider.vue tests/FnbProvider.spec.ts src/index.ts
git commit -m "feat(provider): add aggregate FnbProvider (config + message + dialog)"
```

---

## Self-Review

**Spec coverage (spec §6 + §7 layer-2):**
- §6.1 Tabs composable (`FnbTabs`+`FnbTabPane`, `value`/`type`/`size`, `name`/`tab`, rich `#tab` slot) → Task 1.
- §6.2 Provider/Hook: `FnbConfigProvider` (theme-overrides + dark) → Task 2; `FnbMessageProvider`+`useMessage` → Task 3; `FnbDialogProvider`+`useDialog` (Promise) → Task 4; aggregate `FnbProvider` → Task 5. `useMessage`/`useDialog` read inject, throw without provider → Tasks 3/4.
- §6.3 behavior fidelity → visuals ported from PixivNow `FnbTabs`/`FnbToast`/`FnbDialog` in each task; only API changed.
- §7 layer-2 scoped theme-overrides as inline CSS variables → Task 2 (Teleport caveat documented).
- `createDiscreteApi` (setup-外调用) → explicitly OUT of scope (spec §6.2 lists it as optional/later).
- Out of scope (later plans): docs site (Plan 4), Nuxt module + publish (Plan 5).

**Placeholder scan:** No TBD/TODO. Every component and test is complete inline.

**Type/contract consistency:** Injection keys (`fnbTabsKey`, `fnbConfigKey`, `fnbMessageKey`, `fnbDialogKey`) and their context types are defined in Task N's `*-context.ts` and consumed consistently. `useMessage`/`useDialog` return the exact `FnbMessageApi`/`FnbDialogApi` the providers `provide`. `confirm` returns `Promise<boolean>` everywhere. `src/index.ts` grows by imports + exports + `components` map entries (and `export {}`/`export type {}` for hooks/types) per task; `useMessage`/`useDialog` are exported as functions (NOT added to the `components` map). FnbProvider nests the three providers using the exact component names.

**Note for the executor:** `FnbConfigProvider`/`FnbMessageProvider`/`FnbDialogProvider`/`FnbProvider` ARE components (registered in the `components` map for the plugin), but `useMessage`/`useDialog` are composables exported as plain functions — do not put them in the map.

---

## Roadmap (after this plan)

4. **Docs site** — VitePress + `vitepress-demo-plugin` in `website/`, covering all components + Provider/Hook + theme-overrides + Nuxt guide; absorbs PixivNow's `/_debug/components` showcase.
5. **Nuxt module + first publish** — optional `fnb-ui/nuxt` subpath (auto-register components, auto-import `useMessage`/`useDialog`, inject `style.css`), then `0.x` to npm. Also: the deferred library-wide a11y pass (FnbSelect `aria-activedescendant`, FnbButton disabled-anchor) from Plan 1/2 reviews.
