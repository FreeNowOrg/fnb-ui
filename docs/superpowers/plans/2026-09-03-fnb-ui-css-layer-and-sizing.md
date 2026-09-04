# fnb-ui monorepo 拆分与 CSS 层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 fnb-ui 拆成 `@fnb-ui/core`（CSS + tokens + 框架无关逻辑）与 `@fnb-ui/vue`（薄封装）两个包，将全部样式从 SFC 外提到 core 的 CSS 层，并建立 size/weight 正交的尺寸系统。

**Architecture:** pnpm monorepo。core 双入口——`@fnb-ui/core/style.css` 是零 JS 的纯 CSS，`@fnb-ui/core` 提供 token 常量、类型与框架无关逻辑。vue 包不含任何 CSS 文件，包边界物理上强制「CSS 是产品」。控件几何由两组 CSS 变量驱动（`--fnb-control-*` 尺寸、`--fnb-weight-*` 视觉重量），size 经 CSS 继承传递。

**Tech Stack:** TypeScript, Vue 3.5, Vite 8 (library mode), Vitest 4 + @vue/test-utils, pnpm workspace, Pug 模板

**Spec:** `docs/superpowers/specs/2026-09-03-fnb-ui-design-system-design.md`

## Global Constraints

- **第一原则**：CSS 是产品，Vue 是薄封装。**任何 SFC 不得含 `<style>` 块**；**`packages/vue/dist` 不得出现任何 `.css` 文件**。
- **命名**：组件 `Fnb*`；CSS 变量 `--fnb-*`；CSS 类 `fnb-` 前缀 + BEM（`fnb-block__element--modifier`）；`@keyframes` 一律 `fnb-` 前缀。
- **border 与 shadow 必须成对变更**，禁止单独调整其一。
- **`FnbConfigProvider` 不得写入 `document.documentElement`**（SSR 闪烁 / 破坏 Provider 嵌套 / 污染宿主）。
- **单行控件禁止用 `padding-block` 撑高**，一律显式 `height` + `padding-inline` + `box-sizing: border-box`。
- **breakpoint 不生成 CSS 变量**（`@media (min-width: var(--x))` 静默失效），只生成 SCSS 变量与 TS 常量。
- 代码注释用英文；Prettier：无分号、单引号、2 空格缩进、es5 尾逗号。
- Commit message 用英文 Conventional Commits。
- 不写向后兼容层；不引入新的运行时依赖。

---

## File Structure

| 路径                                          | 责任                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm-workspace.yaml`                         | **修改**。`packages: ['packages/*', 'website']`                   |
| `package.json`（根）                          | **修改**。变为 private workspace root，只留跨包脚本与共享 devDeps |
| `packages/core/package.json`                  | **新建**。`@fnb-ui/core`，双入口 exports                          |
| `packages/core/src/tokens/index.ts`           | **新建**。token 唯一真源 + 类型                                   |
| `packages/core/src/themes/index.ts`           | **新建**。`pixivTheme` / `picaTheme` 预设（纯数据）               |
| `packages/core/src/styles/tokens.css`         | **生成物**，勿手改                                                |
| `packages/core/src/styles/_breakpoints.scss`  | **生成物**，勿手改                                                |
| `packages/core/src/styles/base.css`           | **新建**。`.fnb-prose` 排版层 + `<hr>`                            |
| `packages/core/src/styles/components.css`     | **新建**。全部组件样式（外提自 19 个 SFC）                        |
| `packages/core/src/styles/index.css`          | **新建**。汇总入口                                                |
| `packages/core/src/logic/`                    | **新建**。框架无关逻辑（本计划内先放 `scroll-lock.ts`）           |
| `packages/core/src/index.ts`                  | **新建**。导出 tokens / themes / types / logic                    |
| `packages/core/scripts/gen-tokens.mjs`        | **新建**。真源 → tokens.css + _breakpoints.scss                   |
| `packages/vue/package.json`                   | **新建**。`@fnb-ui/vue`，依赖 `@fnb-ui/core`                      |
| `packages/vue/src/components/*.vue`           | **迁移 + 修改** ×19。删 `<style>`；`FnbSelect` 类名改 BEM         |
| `packages/vue/src/providers/*.vue`            | **迁移 + 修改**。删 `<style>`；Teleport 根元素接主题              |
| `packages/vue/src/providers/useThemeScope.ts` | **新建**。Teleport 内容的主题作用域                               |
| `packages/vue/tests/*.spec.ts`                | **迁移**。22 个现有 spec 原样迁入                                 |
| `scripts/verify-dist.mjs`                     | **修改**。改为逐包校验，补 CSS 层与包边界断言                     |
| `src/`（旧）                                  | **删除**（内容已分流至两个包）                                    |

**测试策略**：尺寸对齐在新架构下**由构造保证**（所有控件引用同一组变量），故用**静态 CSS 断言**验证（解析 CSS 文本，断言变量引用与无硬编码），不引入浏览器测试依赖。组件行为沿用现有 `@vue/test-utils` 单测。

---

## Task 1: monorepo 脚手架与代码分流

纯搬迁任务，**不改任何行为**。验收标准是现有 22 个 spec 文件全部继续通过。

**Files:**

- Modify: `pnpm-workspace.yaml`, `package.json`
- Create: `packages/core/package.json`, `packages/core/vite.config.ts`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`, `packages/core/src/styles/index.scss`
- Create: `packages/vue/package.json`, `packages/vue/vite.config.ts`, `packages/vue/tsconfig.json`
- Move: `src/styles/*` → `packages/core/src/styles/`
- Move: `src/components/`, `src/providers/`, `src/composables/`, `src/index.ts`, `src/env.d.ts` → `packages/vue/src/`
- Move: `tests/*` → `packages/vue/tests/`

**Interfaces:**

- Produces: 工作区包 `@fnb-ui/core`、`@fnb-ui/vue`；vue 包经 `workspace:*` 依赖 core

- [ ] **Step 1: 建立包目录并搬迁文件**

```bash
mkdir -p packages/core/src/{styles,tokens,themes,logic} packages/core/scripts
mkdir -p packages/vue/src packages/vue/tests
git mv src/styles/_fnb.scss src/styles/_variables.scss src/styles/index.scss packages/core/src/styles/
git mv src/components src/providers src/composables src/index.ts src/env.d.ts packages/vue/src/
git mv tests/* packages/vue/tests/
rmdir src tests
```

- [ ] **Step 2: 改写 workspace 与根 package.json**

`pnpm-workspace.yaml` 首行的 `packages:` 段改为：

```yaml
packages:
  - 'packages/*'
  - 'website'
```

（文件其余的 `allowBuilds` / `minimumReleaseAgeExclude` 段保持不动。）

根 `package.json` 替换为工作区根，只保留跨包脚本与共享 devDeps：

```json
{
  "name": "fnb-ui-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.1.3",
  "engines": { "node": ">=22.6.0" },
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "verify": "pnpm build && node scripts/verify-dist.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "pnpm -r --filter './packages/*' typecheck",
    "lint": "oxlint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "gen:tokens": "node --experimental-strip-types packages/core/scripts/gen-tokens.mjs",
    "docs:dev": "vitepress dev website",
    "docs:build": "vitepress build website",
    "docs:preview": "vitepress preview website"
  },
  "devDependencies": {
    "@prettier/plugin-pug": "^3.4.2",
    "@types/node": "^24.0.0",
    "@vitejs/plugin-vue": "^6.0.7",
    "@vue/language-plugin-pug": "^3.3.5",
    "@vue/test-utils": "^2.4.11",
    "jsdom": "^29.1.1",
    "oxlint": "^1.72.0",
    "prettier": "^3.9.4",
    "pug": "^3.0.4",
    "sass-embedded": "^1.100.0",
    "typescript": "^5.7.0",
    "vite": "^8.1.1",
    "vite-plugin-dts": "^5.0.3",
    "vitepress": "^1.6.4",
    "vitepress-demo-plugin": "^1.5.1",
    "vitest": "^4.1.9",
    "vue": "^3.5.18",
    "vue-tsc": "^3.3.5"
  }
}
```

- [ ] **Step 3: 写 core 包**

`packages/core/package.json`：

```json
{
  "name": "@fnb-ui/core",
  "version": "0.0.0",
  "description": "Free Neubrutalism — CSS-first design system core",
  "type": "module",
  "license": "MIT",
  "author": "FreeNowOrg",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/FreeNowOrg/fnb-ui.git",
    "directory": "packages/core"
  },
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./style.css": "./dist/style.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

`packages/core/src/index.ts`（本任务先只作占位导出，Task 2/3 填充）：

```ts
export {}
```

`packages/core/vite.config.ts`：

```ts
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
```

`packages/core/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

> 不要设 `emitDeclarationOnly`：它与 `typecheck` 脚本的 `tsc --noEmit` 互斥，tsc 会直接报错。`.d.ts` 由 `vite-plugin-dts` 在构建时产出，不需要 tsc 发射。

- [ ] **Step 4: 写 vue 包**

`packages/vue/package.json`：

```json
{
  "name": "@fnb-ui/vue",
  "version": "0.0.0",
  "description": "Free Neubrutalism — Vue 3 bindings",
  "type": "module",
  "license": "MIT",
  "author": "FreeNowOrg",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/FreeNowOrg/fnb-ui.git",
    "directory": "packages/vue"
  },
  "files": ["dist"],
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "vite build",
    "typecheck": "vue-tsc --noEmit"
  },
  "peerDependencies": { "vue": "^3.5.0" },
  "dependencies": { "@fnb-ui/core": "workspace:*" }
}
```

`packages/vue/vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { version } from './package.json'

export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json', include: ['src'] })],
  define: { 'import.meta.env.__VERSION__': JSON.stringify(version) },
  build: {
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { external: ['vue', '@fnb-ui/core'] },
  },
})
```

`packages/vue/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 5: 断开 vue 对样式的直接引用**

`packages/vue/src/index.ts` 的第一行 `import './styles/index.scss'` **删除**。样式由使用方显式引入 `@fnb-ui/core/style.css`——这正是包边界要强制的事。

同时把该文件里的 SFC 内 `@use '../styles/fnb' as *;` 引用留待 Task 4-8 随样式外提一并删除；本任务为让构建通过，在 `packages/vue/` 下建一个过渡用的 `src/styles/` 符号引用：

```bash
mkdir -p packages/vue/src/styles
cp packages/core/src/styles/_fnb.scss packages/vue/src/styles/
```

**只复制 `_fnb.scss` 这一个文件。** 不要另建 `fnb.scss`——`@use '../styles/fnb'` 会同时匹配 `_fnb.scss` 与 `fnb.scss`，两者并存时 SCSS 报 ambiguous import 直接构建失败。也不要复制 `_variables.scss`：token 由 `tokens.css` 提供，SFC 里的 mixin 只引用 `var(--fnb-*)`，不需要 SCSS 变量。

> 这个过渡文件在 Task 10 删除。它的存在期就是「样式还没外提完」的期限。

- [ ] **Step 6: 根 vitest 配置**

创建根 `vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/*/tests/**/*.spec.ts'],
  },
})
```

删除旧根 `vite.config.ts`（其职责已分流到两个包）。

- [ ] **Step 7: 修正测试导入路径**

22 个 spec 文件中的 `from '../src'` 全部仍然正确（`packages/vue/tests/` 相对 `packages/vue/src/`）。执行一次确认：

Run: `grep -rl "from '\.\./src'" packages/vue/tests/ | wc -l`
Expected: 22（`-l` 数文件；用 `-n` 数的是匹配行数，会大于 22）

- [ ] **Step 8: 安装并验证全绿**

Run: `pnpm install && pnpm test && pnpm build && pnpm typecheck`
Expected: 22 个 spec 文件全部 PASS；两个包各产出 `dist/`；typecheck 无错误

若 `pnpm test` 报找不到 `@fnb-ui/core`，确认 Step 8 的 `pnpm install` 已把 workspace 链接建好。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "refactor: split into @fnb-ui/core and @fnb-ui/vue packages"
```

---

## Task 2: token 真源与生成脚本

**Files:**

- Create: `packages/core/src/tokens/index.ts`
- Create: `packages/core/scripts/gen-tokens.mjs`
- Create: `packages/core/tests/tokens.spec.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Produces: `tokens` 常量对象；类型 `FnbTokenName`（可覆写 token 名的联合类型）、`FnbBreakpoint`；常量 `breakpoints: Record<'sm'|'md'|'lg'|'xl', number>`
- Produces: 生成物 `packages/core/src/styles/tokens.css`、`packages/core/src/styles/_breakpoints.scss`

- [ ] **Step 1: 写失败测试**

创建 `packages/core/tests/tokens.spec.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tokens, breakpoints } from '../src/tokens'

const css = () =>
  readFileSync(resolve(import.meta.dirname, '../src/styles/tokens.css'), 'utf8')

describe('tokens', () => {
  it('exposes the two orthogonal dimensions', () => {
    expect(tokens.control.md).toEqual({ h: '36px', font: '14px', px: '14px' })
    expect(tokens.weight.w1).toEqual({ border: '2px', shadow: '3px' })
    expect(tokens.weight.w3).toEqual({ border: '3px', shadow: '6px' })
  })

  it('drops the Pixiv-specific bookmark token', () => {
    expect(css()).not.toContain('--fnb-bookmark')
  })

  it('derives brand-hover and dark shadow from brand via color-mix', () => {
    expect(css()).toContain(
      '--fnb-brand-hover: color-mix(in oklab, var(--fnb-brand), #fff 17%)'
    )
    expect(css()).toContain(
      '--fnb-shadow-color: color-mix(in oklab, var(--fnb-brand), #000 27%)'
    )
  })

  it('never emits breakpoints as CSS variables', () => {
    expect(css()).not.toContain('--fnb-bp')
    expect(breakpoints.md).toBe(768)
  })
})
```

同时把根 `vitest.config.ts` 的 `include` 确认为 `['packages/*/tests/**/*.spec.ts']`（Task 1 已设）。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/core/tests/tokens.spec.ts`
Expected: FAIL — `Cannot find module '../src/tokens'`

- [ ] **Step 3: 写 token 真源**

创建 `packages/core/src/tokens/index.ts`：

```ts
// Single source of truth for all design tokens.
// `scripts/gen-tokens.mjs` reads this file and emits src/styles/tokens.css.
// Never hand-edit the generated CSS.

/** Colors a theme may override. Semantic values derive from these. */
export const color = {
  bg: '#eef2ff',
  bgAlt: '#f0f0f0',
  brand: '#4993ff',
  accent: '#a78bfa',
  success: '#7fd957',
  highlight: '#ffe066',
  danger: '#ff5555',
  border: '#000',
  surface: '#fff',
  text: '#1a1a1a',
  textMuted: '#666',
  onBrand: '#fff',
  onLight: '#1a1a1a',
  skeleton: '#e8e8e8',
  divider: '#dedede',
  gridLine: 'rgba(0, 0, 0, 0.03)',
  silver: '#d1d5db',
  bronze: '#f0b27a',
} as const

/** Dark-mode overrides. Only keys that actually differ are listed. */
export const colorDark = {
  bg: '#14151b',
  bgAlt: '#1d2029',
  border: '#4c5160',
  surface: '#1e222b',
  text: '#eef0f3',
  textMuted: '#9aa1ac',
  skeleton: '#2a2e38',
  divider: '#343a45',
  gridLine: 'rgba(255, 255, 255, 0.04)',
} as const

/** Dimension one: size. Governs geometry of single-line controls. */
export const control = {
  sm: { h: '28px', font: '13px', px: '10px' },
  md: { h: '36px', font: '14px', px: '14px' },
  lg: { h: '44px', font: '16px', px: '18px' },
} as const

/**
 * Dimension two: visual weight. border and shadow ALWAYS move together —
 * they jointly form one step of visual weight in this design language.
 * Element type picks the tier, not size alone: a Tag stays w1 at any size.
 */
export const weight = {
  w1: { border: '2px', shadow: '3px' },
  w2: { border: '2px', shadow: '4px' },
  w3: { border: '3px', shadow: '6px' },
  w4: { border: '3px', shadow: '8px' },
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const

export const motion = {
  durationFast: '150ms',
  duration: '250ms',
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/** Explicit stacking order. Never hand-pick a z-index outside this scale. */
export const zIndex = {
  base: '1',
  stickyHeader: '100',
  siderOverlay: '200',
  sider: '210',
  dialogOverlay: '300',
  dialog: '310',
  message: '400',
  imagePreview: '500',
} as const

export const font = {
  sans: "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif",
  display: "'Archivo Black', 'Noto Sans SC', system-ui, sans-serif",
  mono: "'Space Grotesk', ui-monospace, monospace",
} as const

/** Layout sizes multiple components must agree on. */
export const layout = {
  headerHeight: '56px',
} as const

/**
 * Breakpoints are NOT emitted as CSS variables: `@media (min-width: var(--x))`
 * silently fails, and `@custom-media` is not usable yet. The generator emits
 * SCSS variables for `@media`; TS consumers import this constant instead.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export const tokens = {
  color,
  colorDark,
  control,
  weight,
  spacing,
  motion,
  zIndex,
  font,
  layout,
} as const

export type FnbBreakpoint = keyof typeof breakpoints

/** camelCase -> kebab-case at the type level, e.g. 'bgAlt' -> 'bg-alt' */
type Kebab<S extends string> = S extends `${infer H}${infer T}`
  ? T extends Uncapitalize<T>
    ? `${Lowercase<H>}${Kebab<T>}`
    : `${Lowercase<H>}-${Kebab<T>}`
  : S

export type FnbTokenName =
  | Kebab<keyof typeof color>
  | 'brand-hover'
  | 'shadow-color'
  | 'radius'
  | `font-${keyof typeof font}`
  | Kebab<keyof typeof layout>
```

- [ ] **Step 4: 写生成脚本**

创建 `packages/core/scripts/gen-tokens.mjs`：

```js
// Generates src/styles/tokens.css and src/styles/_breakpoints.scss from
// src/tokens/index.ts. Run via `pnpm gen:tokens`. CI asserts no diff.
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  color,
  colorDark,
  control,
  weight,
  spacing,
  motion,
  zIndex,
  font,
  layout,
  breakpoints,
} from '../src/tokens/index.ts'

const root = resolve(import.meta.dirname, '..')
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
const lines = []
const push = (name, value) => lines.push(`  --fnb-${name}: ${value};`)

lines.push('/* GENERATED by scripts/gen-tokens.mjs — do not edit by hand. */')
lines.push(':root {')

lines.push('  /* Colors */')
for (const [k, v] of Object.entries(color)) push(kebab(k), v)

lines.push('')
lines.push('  /* Derived. Overriding --fnb-brand re-derives these. */')
push('brand-hover', 'color-mix(in oklab, var(--fnb-brand), #fff 17%)')
push('shadow-color', 'var(--fnb-border)')

lines.push('')
lines.push('  /* Fonts */')
for (const [k, v] of Object.entries(font)) push(`font-${k}`, v)

lines.push('')
lines.push(
  '  /* Zero radius is intrinsic to this design language — one variable,'
)
lines.push(
  '     not a scale: there is no size/weight dimension for corners. */'
)
push('radius', '0')

lines.push('')
lines.push('  /* Dimension one: size. Bare names default to md. */')
for (const [k, v] of Object.entries(control.md)) push(`control-${k}`, v)
for (const [size, vals] of Object.entries(control))
  for (const [k, v] of Object.entries(vals)) push(`control-${k}-${size}`, v)

lines.push('')
lines.push('  /* Dimension two: weight. Bare names default to w3. */')
for (const [k, v] of Object.entries(weight.w3)) push(`weight-${k}`, v)
for (const [w, vals] of Object.entries(weight))
  for (const [k, v] of Object.entries(vals)) push(`${w}-${k}`, v)

lines.push('')
lines.push('  /* Spacing, motion, stacking, layout */')
for (const [k, v] of Object.entries(spacing)) push(`space-${k}`, v)
for (const [k, v] of Object.entries(motion)) push(kebab(k), v)
for (const [k, v] of Object.entries(zIndex)) push(`z-${kebab(k)}`, v)
for (const [k, v] of Object.entries(layout)) push(kebab(k), v)

lines.push('}')
lines.push('')
lines.push('.dark {')
for (const [k, v] of Object.entries(colorDark)) push(kebab(k), v)
lines.push(
  '  /* Keep the hard shadow visible on dark ground; derives from brand */'
)
push('shadow-color', 'color-mix(in oklab, var(--fnb-brand), #000 27%)')
lines.push('}')
lines.push('')

writeFileSync(resolve(root, 'src/styles/tokens.css'), lines.join('\n'))

const scss = [
  '// GENERATED by scripts/gen-tokens.mjs — do not edit by hand.',
  '// CSS variables do not work inside @media conditions; use these instead.',
  ...Object.entries(breakpoints).map(([k, v]) => `$fnb-bp-${k}: ${v}px;`),
  '',
].join('\n')
writeFileSync(resolve(root, 'src/styles/_breakpoints.scss'), scss)

console.log('gen-tokens OK')
```

- [ ] **Step 5: 从 core 导出**

`packages/core/src/index.ts` 替换为：

```ts
export {
  tokens,
  breakpoints,
  color,
  colorDark,
  control,
  weight,
  spacing,
  motion,
  zIndex,
  font,
  layout,
} from './tokens'
export type { FnbTokenName, FnbBreakpoint } from './tokens'
```

- [ ] **Step 6: 生成并验证通过**

Run: `pnpm gen:tokens && pnpm vitest run packages/core/tests/tokens.spec.ts`
Expected: `gen-tokens OK`，随后 4 个用例全部 PASS

- [ ] **Step 7: 提交**

```bash
git add packages/core/src/tokens packages/core/scripts packages/core/src/styles/tokens.css packages/core/src/styles/_breakpoints.scss packages/core/src/index.ts packages/core/tests/tokens.spec.ts
git commit -m "feat(core): add TS token source of truth with CSS generator"
```

---

## Task 3: 主题类型收紧与预设

**Files:**

- Create: `packages/core/src/themes/index.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/vue/src/providers/config-context.ts`
- Modify: `packages/vue/src/index.ts`
- Create: `packages/vue/tests/themes.spec.ts`

**Interfaces:**

- Consumes: Task 2 的 `FnbTokenName`
- Produces: core 导出 `FnbThemeOverrides = Partial<Record<FnbTokenName, string>>`、`pixivTheme`、`picaTheme`；vue 包重导出三者

- [ ] **Step 1: 写失败测试**

创建 `packages/vue/tests/themes.spec.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbConfigProvider, picaTheme, pixivTheme } from '../src'

describe('themes', () => {
  it('ships presets for both first-party projects', () => {
    expect(picaTheme).toEqual({ brand: '#ff5c8a', bg: '#fff0f3' })
    expect(pixivTheme).toEqual({ brand: '#4993ff', bg: '#eef2ff' })
  })

  it('maps overrides onto scoped CSS variables', () => {
    const w = mount(FnbConfigProvider, { props: { themeOverrides: picaTheme } })
    const style = w.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #ff5c8a')
    expect(style).toContain('--fnb-bg: #fff0f3')
  })

  it('never writes to the document root', () => {
    const before = document.documentElement.getAttribute('style')
    mount(FnbConfigProvider, { props: { themeOverrides: picaTheme } })
    expect(document.documentElement.getAttribute('style')).toBe(before)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/vue/tests/themes.spec.ts`
Expected: FAIL — `picaTheme` is not exported

- [ ] **Step 3: 在 core 写类型与预设**

创建 `packages/core/src/themes/index.ts`：

```ts
import type { FnbTokenName } from '../tokens'

/** Only real token names are accepted; typos fail at compile time. */
export type FnbThemeOverrides = Partial<Record<FnbTokenName, string>>

// Both projects share the same palette structure; only brand and the
// brand-tinted background differ. Everything else derives or is shared.
export const pixivTheme: FnbThemeOverrides = {
  brand: '#4993ff',
  bg: '#eef2ff',
}

export const picaTheme: FnbThemeOverrides = {
  brand: '#ff5c8a',
  bg: '#fff0f3',
}
```

在 `packages/core/src/index.ts` 追加：

```ts
export { pixivTheme, picaTheme } from './themes'
export type { FnbThemeOverrides } from './themes'
```

- [ ] **Step 4: vue 包改为消费 core 的类型**

`packages/vue/src/providers/config-context.ts` 中，删除本地的 `export type FnbThemeOverrides = Record<string, string>`，改为：

```ts
import type { FnbThemeOverrides } from '@fnb-ui/core'

export type { FnbThemeOverrides }
```

（文件其余的 `FnbConfigContext` 与 `fnbConfigKey` 保持不变。）

在 `packages/vue/src/index.ts` 的导出区追加：

```ts
export { pixivTheme, picaTheme, tokens, breakpoints } from '@fnb-ui/core'
export type { FnbTokenName, FnbBreakpoint } from '@fnb-ui/core'
```

- [ ] **Step 5: 验证通过**

Run: `pnpm vitest run packages/vue/tests/themes.spec.ts && pnpm typecheck`
Expected: 3 个用例 PASS；typecheck 无错误

补充手动验证类型收紧确实生效——临时写入下面一行后跑 `pnpm typecheck`，应报错，确认后删除：

```ts
const bad: FnbThemeOverrides = { brnad: '#000' } // 应报 TS2353
```

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/themes packages/core/src/index.ts packages/vue/src/providers/config-context.ts packages/vue/src/index.ts packages/vue/tests/themes.spec.ts
git commit -m "feat(core): narrow FnbThemeOverrides to token names, add presets"
```

---

## Task 4: 控件基线与 size/weight 落地

本任务建立 `components.css` 并外提 4 个控件类组件。它们是尺寸系统的承载者，必须先于其余组件完成。

**Files:**

- Create: `packages/core/src/styles/components.css`
- Create: `packages/core/src/styles/index.css`
- Modify: `packages/vue/src/components/FnbButton.vue`（删 `<style>`）
- Modify: `packages/vue/src/components/FnbInput.vue`（删 `<style>`）
- Modify: `packages/vue/src/components/FnbTag.vue`（删 `<style>`）
- Modify: `packages/vue/src/components/FnbSelect.vue`（删 `<style>`；类名改 BEM）
- Create: `packages/core/tests/sizing.spec.ts`

**Interfaces:**

- Consumes: Task 2 生成的 `tokens.css` 变量
- Produces: CSS 类 `.fnb-button`、`.fnb-input`、`.fnb-tag`、`.fnb-select` / `.fnb-select__trigger` / `.fnb-select__dropdown`（BEM 化后的名字，Task 5 的 group 依赖它们）

- [ ] **Step 1: 写失败测试**

创建 `packages/core/tests/sizing.spec.ts`。测试解析 CSS 文本而非渲染——新架构下三维对齐由构造保证，断言「都引用同一组变量、无硬编码几何值」即可：

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
)

/** Extract the declaration block of a single top-level rule. */
function block(selector: string): string {
  const re = new RegExp(
    `(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`
  )
  const m = css.match(re)
  if (!m) throw new Error(`selector not found: ${selector}`)
  return m[2]
}

const CONTROLS = ['.fnb-button', '.fnb-input', '.fnb-select__trigger']

describe('control sizing', () => {
  it('every control drives geometry from the same variables', () => {
    for (const sel of CONTROLS) {
      const b = block(sel)
      expect(b, sel).toContain('height: var(--fnb-control-h)')
      expect(b, sel).toContain('padding-inline: var(--fnb-control-px)')
      expect(b, sel).toContain('font-size: var(--fnb-control-font)')
      expect(b, sel).toContain('border: var(--fnb-weight-border)')
      expect(b, sel).toContain('var(--fnb-weight-shadow)')
      expect(b, sel).toContain('box-sizing: border-box')
    }
  })

  it('never grows controls with vertical padding', () => {
    for (const sel of CONTROLS) {
      const b = block(sel)
      expect(b, sel).not.toMatch(/padding-block/)
      expect(b, sel).not.toMatch(/padding:\s/)
    }
  })

  it('keeps Tag on w1 and out of the control size scale', () => {
    const b = block('.fnb-tag')
    expect(b).toContain('--fnb-weight-border: var(--fnb-w1-border)')
    expect(b).toContain('--fnb-weight-shadow: var(--fnb-w1-shadow)')
    expect(b).not.toContain('var(--fnb-control-h)')
  })

  it('size modifiers switch both dimensions together', () => {
    const sm = block('.fnb-button--sm')
    expect(sm).toContain('--fnb-control-h: var(--fnb-control-h-sm)')
    expect(sm).toContain('--fnb-weight-border: var(--fnb-w2-border)')
    expect(sm).toContain('--fnb-weight-shadow: var(--fnb-w2-shadow)')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/core/tests/sizing.spec.ts`
Expected: FAIL — `ENOENT: components.css`

- [ ] **Step 3: 写控件基线 CSS**

创建 `packages/core/src/styles/components.css`：

```css
/* ==========================================================================
   Controls
   Geometry comes from two orthogonal variable groups:
     --fnb-control-*  size   (height / font-size / padding-inline)
     --fnb-weight-*   weight (border-width + shadow offset, always paired)
   Never grow a single-line control with padding-block: line-height differences
   between components then push them out of alignment.
   ========================================================================== */

.fnb-button,
.fnb-input,
.fnb-select__trigger {
  box-sizing: border-box;
  height: var(--fnb-control-h);
  padding-inline: var(--fnb-control-px);
  font-size: var(--fnb-control-font);
  font-family: inherit;
  border: var(--fnb-weight-border) solid var(--fnb-border);
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
  border-radius: var(--fnb-radius);
  color: var(--fnb-text);
}

/* --- Button --------------------------------------------------------------- */

.fnb-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  background: var(--fnb-bg);
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform var(--fnb-duration-fast),
    box-shadow var(--fnb-duration-fast);
}

.fnb-button:hover,
.fnb-button:active {
  transform: translate(1.5px, 1.5px);
  box-shadow: 0 0 0 0 var(--fnb-border);
}

.fnb-button--primary {
  background: var(--fnb-brand);
  color: var(--fnb-on-brand);
}

.fnb-button--success {
  background: var(--fnb-success);
  color: var(--fnb-on-light);
}

.fnb-button--danger {
  background: var(--fnb-danger);
  color: var(--fnb-on-brand);
}

.fnb-button--sm {
  --fnb-control-h: var(--fnb-control-h-sm);
  --fnb-control-font: var(--fnb-control-font-sm);
  --fnb-control-px: var(--fnb-control-px-sm);
  --fnb-weight-border: var(--fnb-w2-border);
  --fnb-weight-shadow: var(--fnb-w2-shadow);
  font-weight: 700;
}

.fnb-button--lg {
  --fnb-control-h: var(--fnb-control-h-lg);
  --fnb-control-font: var(--fnb-control-font-lg);
  --fnb-control-px: var(--fnb-control-px-lg);
  --fnb-weight-border: var(--fnb-w4-border);
  --fnb-weight-shadow: var(--fnb-w4-shadow);
}

.fnb-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.fnb-button--loading {
  cursor: wait;
}

.fnb-button__spinner {
  display: inline-flex;
  animation: fnb-spin 1s linear infinite;
}

/* Icon slot reads slightly larger than text for optical balance */
.fnb-button .fnb-icon {
  font-size: 1.25em;
}

/* --- Input ---------------------------------------------------------------- */

.fnb-input {
  width: 100%;
  background: var(--fnb-surface);
  outline: none;
  transition: box-shadow var(--fnb-duration-fast);
}

.fnb-input:focus {
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-brand);
}

.fnb-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Tag ------------------------------------------------------------------
   A Tag is an inline marker, not a control: it stays on w1 at every size and
   never joins the control height scale. Do not "align" it with Button/Card.
   -------------------------------------------------------------------------- */

.fnb-tag {
  --fnb-weight-border: var(--fnb-w1-border);
  --fnb-weight-shadow: var(--fnb-w1-shadow);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding-inline: var(--fnb-space-2);
  font-size: 12px;
  font-family: inherit;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  border: var(--fnb-weight-border) solid var(--fnb-border);
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
  border-radius: var(--fnb-radius);
  transition:
    transform var(--fnb-duration-fast),
    box-shadow var(--fnb-duration-fast);
}

.fnb-tag--active {
  background: var(--fnb-highlight);
  color: var(--fnb-on-light);
  font-weight: 700;
}

.fnb-tag--clickable {
  cursor: pointer;
}

.fnb-tag--clickable:hover,
.fnb-tag--clickable:active {
  transform: translate(1.5px, 1.5px);
  box-shadow: 0 0 0 0 var(--fnb-border);
}

/* --- Select --------------------------------------------------------------- */

.fnb-select {
  position: relative;
  display: inline-block;
  min-width: 6rem;
}

.fnb-select__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4em;
  background: var(--fnb-surface);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform var(--fnb-duration-fast),
    box-shadow var(--fnb-duration-fast);
}

.fnb-select__trigger:hover {
  transform: translate(1.5px, 1.5px);
  box-shadow: none;
}

.fnb-select__arrow {
  font-size: 0.6em;
  transition: transform var(--fnb-duration);
}

.fnb-select__arrow--flipped {
  transform: rotate(180deg);
}

@keyframes fnb-spin {
  to {
    transform: rotate(360deg);
  }
}
```

> `.fnb-select__dropdown` 及其选项样式在 Task 7 随 Select 剩余部分一并外提；本任务只处理 trigger（它是控件基线的一员）。

创建 `packages/core/src/styles/index.css`：

```css
/* Importing this file emits the whole design system into one stylesheet. */
@import './tokens.css';
@import './components.css';
```

（`base.css` 于 Task 9 加入此处。）

- [ ] **Step 4: 删除 4 个 SFC 的 style 块并改名**

对 `FnbButton.vue`、`FnbInput.vue`、`FnbTag.vue` 三个文件，删除整个 `<style scoped lang="scss">…</style>` 块，模板与脚本不动。

对 `FnbSelect.vue`：删除 `<style>` 块，并把模板中的类名改为 BEM：

- `.fnb-select-trigger` → `.fnb-select__trigger`
- `.fnb-select-label` → `.fnb-select__label`
- `.fnb-select-arrow` → `.fnb-select__arrow`，其 `:class='{ flipped: open }'` 改为 `:class='{ "fnb-select__arrow--flipped": open }'`
- `.fnb-select-dropdown` → `.fnb-select__dropdown`
- `.fnb-select-option` → `.fnb-select__option`
- 根元素 `:class='{ open }'` 改为 `:class='{ "fnb-select--open": open }'`

同步更新 `packages/vue/tests/FnbSelect.spec.ts` 中引用到的旧类名。

- [ ] **Step 5: 验证通过**

Run: `pnpm vitest run packages/core/tests/sizing.spec.ts packages/vue/tests/FnbButton.spec.ts packages/vue/tests/FnbInput.spec.ts packages/vue/tests/FnbTag.spec.ts packages/vue/tests/FnbSelect.spec.ts`
Expected: 全部 PASS

Run: `grep -c "<style" packages/vue/src/components/FnbButton.vue packages/vue/src/components/FnbInput.vue packages/vue/src/components/FnbTag.vue packages/vue/src/components/FnbSelect.vue`
Expected: 四个文件均为 `0`

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/styles/components.css packages/core/src/styles/index.css packages/core/tests/sizing.spec.ts packages/vue/src/components packages/vue/tests
git commit -m "feat(core): add control baseline with orthogonal size/weight"
```

---

## Task 5: `.fnb-input-group` 拼接

**Files:**

- Modify: `packages/core/src/styles/components.css`
- Create: `packages/core/tests/input-group.spec.ts`
- Create: `packages/vue/src/components/FnbInputGroup.vue`
- Modify: `packages/vue/src/index.ts`

**Interfaces:**

- Consumes: Task 4 的控件基线与 `--fnb-weight-border`
- Produces: 类 `.fnb-input-group` / `--sm` / `--lg`；组件 `FnbInputGroup`（props: `size?: 'sm' | 'md' | 'lg'`）

- [ ] **Step 1: 写失败测试**

创建 `packages/core/tests/input-group.spec.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
)

describe('.fnb-input-group', () => {
  it('merges adjacent borders using the weight variable', () => {
    expect(css).toContain(
      'margin-inline-start: calc(-1 * var(--fnb-weight-border))'
    )
  })

  it('zeroes member shadows and lifts the shadow to the group', () => {
    expect(css).toMatch(/\.fnb-input-group > \*[^{]*\{[^}]*box-shadow: none/)
  })

  it('suppresses the press transform inside a group', () => {
    expect(css).toMatch(/\.fnb-input-group > \*[^{]*\{[^}]*transform: none/)
  })

  it('uses an inset outline for focus so seams do not break', () => {
    expect(css).toContain('outline-offset: -2px')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/core/tests/input-group.spec.ts`
Expected: FAIL — 4 个断言均未命中

- [ ] **Step 3: 写 group 样式**

追加到 `packages/core/src/styles/components.css`：

```css
/* --- Input group ----------------------------------------------------------
   Joins controls into one pill. Members must share the same border width for
   the negative margin to land exactly on the seam — guaranteed because every
   member reads --fnb-weight-border from this group.
   -------------------------------------------------------------------------- */

.fnb-input-group {
  display: inline-flex;
  align-items: stretch;
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
}

/* Members drop their own shadow — hard shadows would occlude each other —
   and drop the press transform, which would tear the seam open. */
.fnb-input-group > * {
  box-shadow: none;
  transform: none;
}

.fnb-input-group > * + * {
  margin-inline-start: calc(-1 * var(--fnb-weight-border));
}

.fnb-input-group > *:hover {
  transform: none;
  box-shadow: none;
}

/* Focus must not use box-shadow here (see above): an inset outline keeps the
   seam intact and does not affect layout. z-index lifts it over neighbours. */
.fnb-input-group > *:focus,
.fnb-input-group > *:focus-visible {
  outline: 2px solid var(--fnb-brand);
  outline-offset: -2px;
  position: relative;
  z-index: var(--fnb-z-base);
}

.fnb-input-group--sm {
  --fnb-control-h: var(--fnb-control-h-sm);
  --fnb-control-font: var(--fnb-control-font-sm);
  --fnb-control-px: var(--fnb-control-px-sm);
  --fnb-weight-border: var(--fnb-w2-border);
  --fnb-weight-shadow: var(--fnb-w2-shadow);
}

.fnb-input-group--lg {
  --fnb-control-h: var(--fnb-control-h-lg);
  --fnb-control-font: var(--fnb-control-font-lg);
  --fnb-control-px: var(--fnb-control-px-lg);
  --fnb-weight-border: var(--fnb-w4-border);
  --fnb-weight-shadow: var(--fnb-w4-shadow);
}
```

- [ ] **Step 4: 写 Vue 薄封装**

创建 `packages/vue/src/components/FnbInputGroup.vue`：

```vue
<template lang="pug">
.fnb-input-group(
  :class='size !== "md" ? `fnb-input-group--${size}` : undefined'
)
  slot
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
</script>
```

在 `packages/vue/src/index.ts` 中，按字母序把 `FnbInputGroup` 加入 import、`export {}` 列表与 `components` 映射（紧随 `FnbInput` 之后）。

- [ ] **Step 5: 验证通过**

Run: `pnpm vitest run packages/core/tests/input-group.spec.ts && pnpm typecheck`
Expected: 4 个用例 PASS；typecheck 无错误

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/styles/components.css packages/core/tests/input-group.spec.ts packages/vue/src/components/FnbInputGroup.vue packages/vue/src/index.ts
git commit -m "feat: add .fnb-input-group for seamless control joining"
```

---

## Task 6: 外提展示类组件样式

8 个纯外观组件：`Card`、`Alert`、`Result`、`Skeleton`、`Spin`、`Progress`、`Icon`、`Ellipsis`。

**Files:**

- Modify: `packages/core/src/styles/components.css`
- Modify: `packages/vue/src/components/{FnbCard,FnbAlert,FnbResult,FnbSkeleton,FnbSpin,FnbProgress,FnbIcon,FnbEllipsis}.vue`（删 `<style>`）

**Interfaces:**

- Consumes: `tokens.css` 变量；Task 4 已定义的 `@keyframes fnb-spin`
- Produces: 类 `.fnb-card` `.fnb-alert` `.fnb-result` `.fnb-skeleton` `.fnb-spin` `.fnb-progress` `.fnb-icon` `.fnb-ellipsis` 及其修饰类

**外提转换规则**（逐个组件机械套用）：

1. 把 SFC `<style scoped>` 内的规则原样搬入 `components.css`，展开 SCSS 嵌套为完整选择器（`.fnb-card { &__header {} }` → `.fnb-card__header {}`）。
2. 删除 `@use '../styles/fnb' as *;`。
3. 把 `@include` 按下表展开为显式声明。
4. `@keyframes` 加 `fnb-` 前缀并去重（全库只保留一份）。
5. **圆角变量收敛**：把遇到的 `var(--fnb-radius-sm)`（实扫 6 处）与 `var(--fnb-radius-lg)` 一律替换为 `var(--fnb-radius)`。生成器只产出这一个圆角变量——零圆角是本设计语言的固有属性，不存在 size/weight 那样的分档。
6. 删除 SFC 中的整个 `<style>` 块。

**mixin → weight 映射**（本表是决策，不要另行判断）：

| 组件          | 原 mixin                       | 目标 weight                 | 变化             |
| ------------- | ------------------------------ | --------------------------- | ---------------- |
| `FnbCard`     | `fnb-border` + `fnb-shadow`    | **w3**                      | 无               |
| `FnbAlert`    | `fnb-border` + `fnb-shadow-sm` | **w3**                      | shadow 4px → 6px |
| `FnbProgress` | `fnb-border-sm`                | **w1** 的 border，无 shadow | 无               |
| 其余 5 个     | 无 mixin                       | —                           | 无               |

`FnbCard` 原本还按 props 切换 `fnb-shadow-sm` / `fnb-shadow-lg`，改为切换 weight 变量：

```css
.fnb-card {
  box-sizing: border-box;
  background: var(--fnb-surface);
  border: var(--fnb-weight-border) solid var(--fnb-border);
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
  border-radius: var(--fnb-radius);
  transition: all var(--fnb-duration-fast);
}

.fnb-card--sm {
  --fnb-weight-border: var(--fnb-w2-border);
  --fnb-weight-shadow: var(--fnb-w2-shadow);
}

.fnb-card--lg {
  --fnb-weight-border: var(--fnb-w4-border);
  --fnb-weight-shadow: var(--fnb-w4-shadow);
}
```

**keyframes 去重**：`spin` 当前在 `FnbButton.vue` 与 `FnbSpin.vue` 各定义一次。Task 4 已在 `components.css` 定义了唯一的 `@keyframes fnb-spin`；本任务只需把 `FnbSpin` 的 `animation: spin …` 改为 `animation: fnb-spin …`，**不要再定义一份**。`FnbSkeleton` 的 `imgProgress` 改名为 `fnb-img-progress`，定义搬入 `components.css` 一次。

- [ ] **Step 1: 记录基线，供外提后比对**

Run: `pnpm vitest run packages/vue/tests/FnbCard.spec.ts packages/vue/tests/FnbAlert.spec.ts packages/vue/tests/FnbResult.spec.ts packages/vue/tests/FnbSkeleton.spec.ts packages/vue/tests/FnbSpin.spec.ts packages/vue/tests/FnbProgress.spec.ts packages/vue/tests/FnbIcon.spec.ts packages/vue/tests/FnbEllipsis.spec.ts`
Expected: 全部 PASS（这是外提前的基线；外提只动样式，这些行为测试必须始终保持绿）

- [ ] **Step 2: 逐个外提**

按上述 5 条规则处理 8 个组件。每个组件搬完后立刻跑它自己的 spec，确认仍然 PASS 再处理下一个。

- [ ] **Step 3: 验证 style 块清零且 keyframes 唯一**

Run: `grep -l "<style" packages/vue/src/components/{FnbCard,FnbAlert,FnbResult,FnbSkeleton,FnbSpin,FnbProgress,FnbIcon,FnbEllipsis}.vue`
Expected: 无输出

Run: `grep -c "@keyframes" packages/core/src/styles/components.css`
Expected: `2`（`fnb-spin` 与 `fnb-img-progress` 各一次）

Run: `grep -rn "@keyframes" packages/vue/src/`
Expected: 无输出

- [ ] **Step 4: 全量跑测试**

Run: `pnpm test`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add packages/core/src/styles/components.css packages/vue/src/components
git commit -m "refactor: extract presentational component styles into core CSS"
```

---

## Task 7: 外提复合类组件样式

6 个组件：`Tabs`、`Table`、`Pagination`、`Scrollbar`、`Image`、`FloatButton`，外加 Task 4 未处理的 `Select` 下拉部分。

**Files:**

- Modify: `packages/core/src/styles/components.css`
- Modify: `packages/vue/src/components/{FnbTabs,FnbTable,FnbPagination,FnbScrollbar,FnbImage,FnbFloatButton}.vue`（删 `<style>`）

**Interfaces:**

- Consumes: `tokens.css` 变量；Task 4 的控件基线
- Produces: 类 `.fnb-tabs` `.fnb-table` `.fnb-pagination` `.fnb-scrollbar` `.fnb-image` `.fnb-float-button` `.fnb-select__dropdown` 及修饰类

沿用 Task 6 的 5 条转换规则，另加两条本任务特有的处理：

**`:deep()` 移除**（scoped 撤销后 `:deep()` 无意义）：

| 位置       | 原写法                 | 改为                           |
| ---------- | ---------------------- | ------------------------------ |
| `FnbTable` | `:deep(th), :deep(td)` | `.fnb-table th, .fnb-table td` |
| `FnbTable` | `:deep(th)`            | `.fnb-table th`                |
| `FnbTable` | `:deep(tr:hover td)`   | `.fnb-table tr:hover td`       |

（`FnbButton` 的 `:deep(.fnb-icon)` 已在 Task 4 处理为 `.fnb-button .fnb-icon`。）

**mixin → weight 映射**：

| 组件             | 原 mixin                                        | 目标                                                                         |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `FnbTabs`        | `fnb-border`                                    | **w3**                                                                       |
| `FnbTable`       | `fnb-border-sm`                                 | **w1** 的 border（结构线，无 shadow）                                        |
| `FnbPagination`  | `fnb-border-sm` + `fnb-shadow-xs` + `fnb-press` | 页码按钮走**控件基线**（`--fnb-control-*` + `--fnb-weight-*`），默认 `sm` 档 |
| `FnbFloatButton` | `fnb-border` + `fnb-shadow-sm` + `fnb-press`    | **w3**                                                                       |
| `FnbSelect` 下拉 | `fnb-border-sm` + `fnb-shadow-sm`               | **w2**                                                                       |

`FnbPagination` 的页码按钮改用控件基线，使其与 Button/Input 天然同高：

```css
.fnb-pagination__item {
  --fnb-control-h: var(--fnb-control-h-sm);
  --fnb-control-font: var(--fnb-control-font-sm);
  --fnb-control-px: var(--fnb-control-px-sm);
  --fnb-weight-border: var(--fnb-w2-border);
  --fnb-weight-shadow: var(--fnb-w2-shadow);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--fnb-control-h);
  height: var(--fnb-control-h);
  padding-inline: var(--fnb-space-1);
  font-size: var(--fnb-control-font);
  font-family: inherit;
  border: var(--fnb-weight-border) solid var(--fnb-border);
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
  background: var(--fnb-surface);
  cursor: pointer;
  transition:
    transform var(--fnb-duration-fast),
    box-shadow var(--fnb-duration-fast);
}
```

**z-index 归入 scale**：`FnbImage` 预览层原有的硬编码 z-index 改为 `var(--fnb-z-image-preview)`；`FnbSelect` 下拉改为 `var(--fnb-z-base)`。

- [ ] **Step 1: 记录基线**

Run: `pnpm vitest run packages/vue/tests/FnbTabs.spec.ts packages/vue/tests/FnbTable.spec.ts packages/vue/tests/FnbPagination.spec.ts packages/vue/tests/FnbScrollbar.spec.ts packages/vue/tests/FnbImage.spec.ts packages/vue/tests/FnbFloatButton.spec.ts packages/vue/tests/FnbSelect.spec.ts`
Expected: 全部 PASS

- [ ] **Step 2: 逐个外提**

按规则处理 6 个组件 + Select 下拉。每个组件搬完立刻跑其 spec 确认 PASS 再继续。

- [ ] **Step 3: 验证**

Run: `grep -rn "<style\|:deep(" packages/vue/src/components/`
Expected: 无输出

Run: `pnpm test`
Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add packages/core/src/styles/components.css packages/vue/src/components
git commit -m "refactor: extract composite component styles into core CSS"
```

---

## Task 8: 外提 Provider 样式并修复 Teleport 主题逃逸

**Files:**

- Modify: `packages/core/src/styles/components.css`
- Create: `packages/core/src/logic/scroll-lock.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/vue/src/providers/useThemeScope.ts`
- Modify: `packages/vue/src/providers/{FnbDialogProvider,FnbMessageProvider}.vue`
- Modify: `packages/vue/src/components/FnbImage.vue`
- Modify: `packages/vue/src/providers/config-context.ts`
- Create: `packages/vue/tests/theme-scope.spec.ts`

**Interfaces:**

- Consumes: Task 3 的 `FnbThemeOverrides`
- Produces: core 导出 `lockScroll(): () => void`；vue 导出内部 composable `useThemeScope(): { class: ComputedRef<string[]>, style: ComputedRef<CSSProperties> }`
- Produces: `FnbConfigContext` 新增字段 `cssVars: ComputedRef<CSSProperties>`

**背景**：`FnbConfigProvider` 把 `--fnb-*` 与 `dark` class 施加在自身 div 上，而 `FnbMessageProvider`、`FnbDialogProvider`、`FnbImage` 预览层均 `Teleport(to='body')`——传送出去的内容同时拿不到主题变量与暗色 class。粉色主题 + 暗色下开弹窗会看到蓝色阴影的亮色弹窗。

- [ ] **Step 1: 写失败测试**

创建 `packages/vue/tests/theme-scope.spec.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import {
  FnbConfigProvider,
  FnbDialogProvider,
  useDialog,
  picaTheme,
} from '../src'

const Opener = defineComponent({
  setup() {
    const dialog = useDialog()
    return () =>
      h(
        'button',
        { onClick: () => dialog.confirm({ title: 'x', content: 'y' }) },
        'open'
      )
  },
})

describe('teleported content theme scope', () => {
  it('carries theme vars and dark class onto the teleported root', async () => {
    mount(FnbConfigProvider, {
      props: { themeOverrides: picaTheme, dark: true },
      slots: {
        default: () => h(FnbDialogProvider, null, { default: () => h(Opener) }),
      },
      attachTo: document.body,
    })
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await new Promise((r) => setTimeout(r))

    const overlay = document.querySelector('.fnb-dialog-overlay') as HTMLElement
    expect(overlay).toBeTruthy()
    expect(overlay.style.getPropertyValue('--fnb-brand')).toBe('#ff5c8a')
    expect(overlay.classList.contains('dark')).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/vue/tests/theme-scope.spec.ts`
Expected: FAIL — `--fnb-brand` 为空字符串（变量未随 Teleport 传出）

- [ ] **Step 3: 在 context 中下发 cssVars**

`packages/vue/src/providers/config-context.ts` 的 `FnbConfigContext` 接口加一个字段：

```ts
cssVars: ComputedRef<CSSProperties>
```

（需 `import type { CSSProperties } from 'vue'`。）

`FnbConfigProvider.vue` 的 `provide` 调用改为一并传出已有的 `cssVars`：

```ts
provide(fnbConfigKey, {
  themeOverrides: mergedOverrides,
  dark: mergedDark,
  cssVars,
})
```

- [ ] **Step 4: 写 useThemeScope**

创建 `packages/vue/src/providers/useThemeScope.ts`：

```ts
import { computed, inject } from 'vue'
import type { ComputedRef, CSSProperties } from 'vue'
import { fnbConfigKey } from './config-context'

/**
 * Teleported content leaves the provider's subtree, so it inherits neither the
 * theme CSS variables nor the `dark` class. Bind both onto the teleported root
 * element. Never solve this by writing to document.documentElement: that breaks
 * provider nesting and does not render on the server.
 */
export function useThemeScope(): {
  themeClass: ComputedRef<Record<string, boolean>>
  themeStyle: ComputedRef<CSSProperties>
} {
  const config = inject(fnbConfigKey, null)
  return {
    themeClass: computed(() => ({ dark: config?.dark.value ?? false })),
    themeStyle: computed(() => config?.cssVars.value ?? {}),
  }
}
```

- [ ] **Step 5: 绑到三处 Teleport 根元素**

`FnbDialogProvider.vue`：在 setup 中 `const { themeClass, themeStyle } = useThemeScope()`，模板里 `.fnb-dialog-overlay` 改为：

```pug
.fnb-dialog-overlay(
  v-if='state',
  :class='themeClass',
  :style='themeStyle',
  @click.self='resolve(false)'
)
```

`FnbMessageProvider.vue`：`TransitionGroup.fnb-message-container` 加同样的 `:class='themeClass'` 与 `:style='themeStyle'`。

`FnbImage.vue`：其 `Teleport(to='body')` 下的预览层根元素加同样两项。

- [ ] **Step 6: 把 scroll-lock 提到 core**

创建 `packages/core/src/logic/scroll-lock.ts`：

```ts
/**
 * Framework-agnostic scroll lock. Returns the release function.
 * Nested calls are reference-counted, so a dialog opened over a sider does not
 * unlock the page when only the inner one closes.
 */
let depth = 0
let previousOverflow = ''

export function lockScroll(): () => void {
  if (depth === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  depth += 1
  let released = false
  return () => {
    if (released) return
    released = true
    depth -= 1
    if (depth === 0) document.body.style.overflow = previousOverflow
  }
}
```

在 `packages/core/src/index.ts` 追加：

```ts
export { lockScroll } from './logic/scroll-lock'
```

把 `FnbDialogProvider.vue` 中原有的内联 scroll-lock 逻辑替换为 `lockScroll()` 调用，在关闭/卸载时调用其返回的释放函数。

- [ ] **Step 7: 外提 Provider 样式**

按 Task 6 的规则外提两个 Provider 的样式。mixin 映射：

| 组件                 | 原 mixin                          | 目标 weight |
| -------------------- | --------------------------------- | ----------- |
| `FnbDialogProvider`  | `fnb-border` + `fnb-shadow-lg`    | **w4**      |
| `FnbMessageProvider` | `fnb-border-sm` + `fnb-shadow-sm` | **w3**      |

同时把两者的硬编码 z-index 换成 `var(--fnb-z-dialog-overlay)`、`var(--fnb-z-dialog)`、`var(--fnb-z-message)`。

- [ ] **Step 8: 验证通过**

Run: `pnpm vitest run packages/vue/tests/theme-scope.spec.ts packages/vue/tests/useDialog.spec.ts packages/vue/tests/useMessage.spec.ts packages/vue/tests/FnbImage.spec.ts`
Expected: 全部 PASS

Run: `grep -rn "<style" packages/vue/src/`
Expected: 无输出（全库 SFC style 块归零）

- [ ] **Step 9: 提交**

```bash
git add packages/core/src/logic packages/core/src/index.ts packages/core/src/styles/components.css packages/vue/src
git commit -m "fix: carry theme scope into teleported content, extract provider styles"
```

---

## Task 9: base.css 排版层

**Files:**

- Create: `packages/core/src/styles/base.css`
- Modify: `packages/core/src/styles/index.css`
- Create: `packages/core/tests/base.spec.ts`

**Interfaces:**

- Produces: 类 `.fnb-prose`（作用域根）、`.fnb-link` / `.fnb-link--plain`、`hr` 默认样式

**约束**：排版层**不得裸改** `h1` / `p` / `a` 等元素选择器——那会污染宿主页面。一切限定在 `.fnb-prose` 内，唯一例外是 `.fnb-link` 这种显式类。

- [ ] **Step 1: 写失败测试**

创建 `packages/core/tests/base.spec.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/base.css'),
  'utf8'
)

describe('base.css', () => {
  it('scopes every element selector under .fnb-prose', () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((chunk) => chunk.split('{')[0].trim())
      .filter(Boolean)
      .flatMap((s) => s.split(',').map((x) => x.trim()))
      .filter(Boolean)

    for (const sel of selectors) {
      const scoped = sel.startsWith('.fnb-prose') || sel.startsWith('.fnb-link')
      expect(scoped, `bare selector leaks into host page: "${sel}"`).toBe(true)
    }
  })

  it('provides both underlined and plain link styles', () => {
    expect(css).toContain('.fnb-link')
    expect(css).toContain('.fnb-link--plain')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/core/tests/base.spec.ts`
Expected: FAIL — `ENOENT: base.css`

- [ ] **Step 3: 写 base.css**

创建 `packages/core/src/styles/base.css`。内容取自 PixivNow `app/assets/styles/_elements.scss` 的排版部分，全部收进 `.fnb-prose` 作用域：

```css
/* ==========================================================================
   Prose typography
   Scoped to .fnb-prose on purpose: bare element selectors would leak into the
   host page. The only unscoped names here are explicit .fnb-* classes.
   ========================================================================== */

.fnb-prose {
  color: var(--fnb-text);
  line-height: 1.7;
}

.fnb-prose h1,
.fnb-prose h2,
.fnb-prose h3,
.fnb-prose h4 {
  font-family: var(--fnb-font-display, inherit);
  font-weight: 900;
  line-height: 1.25;
  margin: 1.5em 0 0.5em;
}

.fnb-prose h1 {
  font-size: 2rem;
}
.fnb-prose h2 {
  font-size: 1.5rem;
}
.fnb-prose h3 {
  font-size: 1.25rem;
}
.fnb-prose h4 {
  font-size: 1.1rem;
}

.fnb-prose p,
.fnb-prose ul,
.fnb-prose ol {
  margin: 0.5em 0;
}

.fnb-prose ul,
.fnb-prose ol {
  padding-inline-start: 1.5em;
}

.fnb-prose pre {
  overflow: auto;
  background: var(--fnb-skeleton);
  padding: var(--fnb-space-1);
  border: var(--fnb-w1-border) solid var(--fnb-border);
}

.fnb-prose table {
  border-collapse: collapse;
  width: 100%;
}

.fnb-prose th,
.fnb-prose td {
  border: var(--fnb-w1-border) solid var(--fnb-divider);
  padding: var(--fnb-space-2);
  text-align: start;
}

.fnb-prose hr,
.fnb-divider {
  border: none;
  border-top: 1px solid var(--fnb-divider);
  margin: var(--fnb-space-6) 0;
}

/* --- Links ----------------------------------------------------------------
   Usable on a bare <a> or on a framework's router link component — adding the
   class is all it takes. That is the point of keeping CSS as the product.
   -------------------------------------------------------------------------- */

.fnb-link {
  color: var(--fnb-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
  transition: color var(--fnb-duration-fast);
}

.fnb-link:hover {
  color: var(--fnb-brand);
}

.fnb-link--plain {
  text-decoration: none;
}

.fnb-prose a {
  color: var(--fnb-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
}

.fnb-prose a:hover {
  color: var(--fnb-brand);
}
```

`packages/core/src/styles/index.css` 改为：

```css
/* Importing this file emits the whole design system into one stylesheet. */
@import './tokens.css';
@import './base.css';
@import './components.css';
```

- [ ] **Step 4: 验证通过**

Run: `pnpm vitest run packages/core/tests/base.spec.ts`
Expected: 2 个用例 PASS

- [ ] **Step 5: 提交**

```bash
git add packages/core/src/styles/base.css packages/core/src/styles/index.css packages/core/tests/base.spec.ts
git commit -m "feat(core): add scoped prose typography layer"
```

---

## Task 10: 清理与收口

**Files:**

- Delete: `packages/vue/src/styles/`（Task 1 的过渡文件）
- Delete: `packages/core/src/styles/_fnb.scss`、`packages/core/src/styles/_variables.scss`、`packages/core/src/styles/index.scss`
- Modify: `packages/core/src/index.ts`（顶部 import 样式入口）
- Modify: `scripts/verify-dist.mjs`
- Modify: `README.md`

**Interfaces:**

- Produces: `packages/core/dist/style.css`（完整设计系统单文件）、`packages/vue/dist/index.js`（不含任何 CSS）

- [ ] **Step 1: 删除过渡与废弃文件**

```bash
rm -rf packages/vue/src/styles
rm packages/core/src/styles/_fnb.scss packages/core/src/styles/_variables.scss packages/core/src/styles/index.scss
```

Run: `grep -rn "@use\|@include\|styles/fnb" packages/vue/src/`
Expected: 无输出（SCSS 依赖彻底断开）

- [ ] **Step 2: 让 core 构建产出 style.css**

`packages/core/vite.config.ts` 的 lib entry 之外，在 `packages/core/src/index.ts` 顶部加入：

```ts
import './styles/index.css'
```

这样 `@fnb-ui/core` 的 JS 入口会带上样式；而 `@fnb-ui/core/style.css` 仍可单独引用，纯 CSS 用户零 JS。

> 注：`sideEffects: ["**/*.css"]` 已在 Task 1 的 core package.json 中声明，打包器不会误删这行 import。

- [ ] **Step 3: 改写构建校验**

`scripts/verify-dist.mjs` 中的检查段（`present`/`contains`/`absent` 三个辅助函数保留不动）替换为：

```js
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
```

并在文件末尾的错误汇总之前追加一条包边界断言：

```js
// The vue package must not ship any stylesheet at all.
import { readdirSync } from 'node:fs'
const vueDist = resolve(root, 'packages/vue/dist')
if (existsSync(vueDist)) {
  const stray = readdirSync(vueDist).filter((f) => f.endsWith('.css'))
  if (stray.length)
    errors.push(`packages/vue/dist ships CSS: ${stray.join(', ')}`)
}
```

（把这段的 `import` 提到文件顶部与其它 import 并列。）

- [ ] **Step 4: 更新 README 的安装与用法**

`README.md` 的用法段替换为：

````markdown
## 安装

```bash
pnpm add @fnb-ui/core @fnb-ui/vue
```

## 使用

样式与框架绑定是分开的——CSS 是核心，框架封装是外围：

```ts
import '@fnb-ui/core/style.css'
import FnbUI from '@fnb-ui/vue'

app.use(FnbUI)
```

不用 Vue 也可以，只引样式即可获得全部外观：

```html
<link rel="stylesheet" href="node_modules/@fnb-ui/core/dist/style.css" />
<button class="fnb-button fnb-button--primary">按钮</button>
```
````

- [ ] **Step 5: 全量验证**

Run: `pnpm install && pnpm gen:tokens && pnpm test && pnpm build && pnpm verify && pnpm typecheck && pnpm lint`
Expected: 全部通过，`verify-dist OK`

Run: `git diff --exit-code packages/core/src/styles/tokens.css`
Expected: 无 diff（生成物与真源一致）

Run: `grep -rc "<style" packages/vue/src/ | grep -v ":0" || echo "SFC style 块数量为 0"`
Expected: `SFC style 块数量为 0`

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: drop SCSS layer, enforce package boundary in verify-dist"
```

---

## Self-Review 结果

**1. Spec 覆盖检查**

| Spec 章节                                               | 对应任务                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| §3 包结构、core 双入口、logic 范围                      | Task 1、Task 8 Step 6、Task 10 Step 2                      |
| §4.1 真源与生成                                         | Task 2                                                     |
| §4.2 原始层→语义层、color-mix 派生                      | Task 2 Step 4（比例经浏览器实测：white 17%、black 27%）    |
| §4.3 补齐 scale（spacing/motion/z-index/header-height） | Task 2 Step 3；z-index 落地于 Task 7 Step 2、Task 8 Step 7 |
| §4.4 breakpoint 不生成 CSS 变量                         | Task 2 Step 4 + 测试断言                                   |
| §4.5 类型收紧                                           | Task 3                                                     |
| §4.6 只做全局 token 粒度                                | Task 3（`Partial<Record<FnbTokenName, string>>` 即平铺）   |
| §4.7 业务 token 出库                                    | Task 2 测试断言 + Task 10 verify 断言                      |
| §4.8 主题预设                                           | Task 3                                                     |
| §5.2 size/weight 正交                                   | Task 2（token）+ Task 4（落地）                            |
| §5.3 实现约束（显式 height、禁 padding-block）          | Task 4 Step 1 测试 + Step 3 注释                           |
| §5.4 `.fnb-input-group`（含焦点内描边）                 | Task 5                                                     |
| §5.5 破坏性变更                                         | Task 4、6、7、8 的 weight 映射表逐条落实                   |
| §6.1 外提范围                                           | Task 4、6、7、8 合计 19 个 SFC                             |
| §6.2 `:deep()` / keyframes 去重 / 前缀                  | Task 6 Step 3、Task 7 `:deep()` 表                         |
| §6.3 base.css                                           | Task 9                                                     |
| §7.6 Teleport 主题逃逸                                  | Task 8                                                     |
| §8 验证标准 1–10                                        | Task 10 Step 5 + 各任务测试                                |

**未覆盖（有意）**：§7.1–§7.5 的布局层（`FnbLayout` / `FnbHeader` / `FnbSider` / `FnbDropdown` / `FnbDivider` / `FnbLoadingBar` / `FnbLink` 组件形态 / `FnbBackToTop`）属阶段③，由后续 plan 承接。本 plan 只在 Task 9 提供了 `.fnb-link` 与 `.fnb-divider` 的**样式**，Vue 组件留给阶段③。

**2. 占位符扫描**：无 TBD / TODO / "类似 Task N" / 无代码的代码步骤。Task 6、7 的外提以「5 条转换规则 + 完整 mixin→weight 映射表 + `:deep()` 逐条对照表」替代逐行罗列 800 行搬运代码——执行者无需做任何判断，所有决策点均已给出具体答案。

**3. 类型一致性检查**

| 名称                                             | 定义处                              | 使用处                                     | 一致 |
| ------------------------------------------------ | ----------------------------------- | ------------------------------------------ | ---- |
| `FnbTokenName`                                   | Task 2 `core/src/tokens`            | Task 3 `FnbThemeOverrides`、Task 10 verify | ✓    |
| `FnbThemeOverrides`                              | Task 3 `core/src/themes`            | Task 3 vue 重导出、Task 8 context          | ✓    |
| `breakpoints`                                    | Task 2                              | Task 2 测试、Task 3 vue 重导出             | ✓    |
| `lockScroll()`                                   | Task 8 `core/src/logic/scroll-lock` | Task 8 DialogProvider                      | ✓    |
| `useThemeScope()` → `{ themeClass, themeStyle }` | Task 8                              | Task 8 三处 Teleport 绑定                  | ✓    |
| `cssVars`                                        | Task 8 `FnbConfigContext`           | Task 8 `useThemeScope`                     | ✓    |
| `.fnb-select__trigger`                           | Task 4                              | Task 4 sizing 测试、Task 7 下拉            | ✓    |
| `--fnb-weight-border` / `--fnb-weight-shadow`    | Task 2 生成                         | Task 4/5/6/7/8                             | ✓    |
| `@keyframes fnb-spin`                            | Task 4                              | Task 6 `FnbSpin` 引用                      | ✓    |
