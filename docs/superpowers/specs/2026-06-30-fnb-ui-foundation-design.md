# fnb-ui 基础设计 spec

- **日期**：2026-06-30
- **状态**：设计定稿，待实现
- **作者**：FreeNowOrg / Dragon-Fish（设计），Claude（整理）

---

## 1. 背景与目标

### 背景

`Fnb`（**F**ree **N**eu**b**rutalism）是 FreeNowOrg 旗下多个姊妹项目共用的**野兽派（neubrutalism）设计语言**：硬阴影、零圆角、`Archivo Black` 展示字体、`--fnb-*` CSS 变量驱动主题。这套语言最早在 [PicaComicNow](https://github.com/FreeNowOrg/PicaComicNow) 落地，随后被 [PixivNow](https://github.com/FreeNowOrg/PixivNow) 等项目沿用。

目前这套组件以 SFC 形式散落在各项目内部（例如 PixivNow 的 `app/components/ui/Fnb*.vue`），各项目各自维护、互相拷贝，缺少统一来源。

### 目标

把这套设计语言抽取、重构为一个**独立、框架无关的 Vue 3 组件库 `fnb-ui`**，发布到 npm，供所有姊妹项目共用。借这次抽取的机会，**对标 naive-ui 的 API 品质重新设计接口**，而非照搬现有实现。

### 非目标（本期不做）

- **不迁移 PixivNow / PicaComicNow**。本期只把 `fnb-ui` 立起来并发布；现有项目改用该包是后续独立任务（见 §13）。各项目内现有的 `Fnb*` 组件保持原样，不在本期改动。
- **不引入 css-in-js 主题系统**（不抄 naive 的运行时主题，理由见 §7）。
- **不做 createDiscreteApi**（setup 外调用飘条/对话框）。当前各项目调用点全在 setup 内，无刚需，列为可选后续（§6.2）。
- 不附带任何向后兼容/降级层。

---

## 2. 项目身份

| 项          | 值                                          |
| ----------- | ------------------------------------------- |
| npm 包名    | `fnb-ui`（无 scope，已确认 npm 上未被占用） |
| GitHub 仓库 | `FreeNowOrg/fnb-ui`                         |
| 组件前缀    | `Fnb`（承载 Free Neubrutalism，保留）       |
| License     | MIT（public）                               |
| 包管理器    | pnpm                                        |

---

## 3. 工具链选型

> 调研时点 2026-06-30，版本均经 `registry.npmjs.org` 实时查询。用户要求尽量采用 Vite 团队的 Rust 工具链（Vite 8 / Rolldown / Oxc），下表为务实落地结论。

| 用途         | 包                                  | 版本                | 说明 / 坑                                                                              |
| ------------ | ----------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| 构建/打包    | `vite`                              | `^8.1.1`            | **Rolldown 已内置为默认打包器**，无需 `rolldown-vite` 或 override。Node ≥20.19/22.12   |
| Vue SFC      | `@vitejs/plugin-vue`                | `^6.0.7`            | peer 已含 `vite ^8`                                                                    |
| 类型声明     | `vite-plugin-dts`                   | `^5.0.3`            | 5.x 已转 `unplugin-dts` 内核、适配 Rolldown/Vue。**构建后必须人工核验 `.d.ts` 完整性** |
| 类型检查器   | `vue-tsc`                           | `^3.3.5`            | Volar 系；与下方 Pug 插件同版本线                                                      |
| Pug 类型检查 | `@vue/language-plugin-pug`          | `^3.3.5`            | 模板用 Pug **必须**挂这个，否则 vue-tsc 看不懂 `template lang="pug"`                   |
| Pug 编译     | `pug`                               | `^3.0.4`            | `@vitejs/plugin-vue` 构建期调用                                                        |
| 样式         | `sass-embedded`                     | `^1.100.0`          | Vite 官方推荐，比纯 `sass` 快                                                          |
| Lint(JS/TS)  | `oxlint`                            | `^1.72.0`           | stable、生产可用。**只 lint `<script>`，不碰 `<template>`**                            |
| 格式化       | `prettier` + `@prettier/plugin-pug` | `^3.9.4` / `^3.4.2` | 见下方"为什么不用 oxfmt"                                                               |
| 文档站       | `vitepress`                         | `^1.6.4`            | 自带 Vite 5；够用且稳                                                                  |
| 文档 demo    | `vitepress-demo-plugin`             | `^1.5.1`            | Markdown 内嵌 live 组件 + 源码展示                                                     |

### 关键决策与理由

**1. Vite 8 + Rolldown：放心直接上。** Vite 8（2026-03 发布）已把 Rust 编写的 Rolldown 内置为唯一打包器，取代旧的 esbuild/Rollup 双打包架构，**无需任何 alias/override**。`rolldown-vite` 现在只是给"仍停留在 Vite 7 又想提前体验 Rolldown"的项目用的过渡包，新项目不用。唯一提醒：Rolldown 1.0 才发布两个月，库产物（单独 `style.css`、dts、tree-shaking）**构建后人工核验一遍**（见 §12）。回退方案：真遇 Rolldown bug，临时退 `vite@7`（Rollup）排查。

**2. 格式化为什么不用 oxfmt（尽管用户本意想全用 oxc）。** 查证结果：oxfmt 当前 ① **完全不支持 Pug**（兼容矩阵未列 Pug，而本库模板全是 Pug），② 对 Vue SFC 仅 "Partial"，③ 仍是 beta。强上会让 `template lang="pug"` 这一大块无法格式化。因此格式化继续用 **Prettier + `@prettier/plugin-pug`**。未来 oxfmt 支持 Pug 并转正后再评估迁移（`oxfmt --migrate prettier` 可一键转配置）。

**3. Lint 用 oxlint，模板 lint 暂不做。** oxlint 1.72 已 stable，但**只能 lint `<script>` 块，不支持 Vue 模板**（模板规则需 `eslint-plugin-vue` 兜底）。本期决定**只用 oxlint（JS/TS）**，保持工具链精简、贴合用户"用 oxc"的意图；模板 lint（`eslint` + `eslint-plugin-vue` + `eslint-plugin-oxlint` 去重）列为可选后续，待确有需要再加。

**4. 文档站 VitePress 暂不追 Vite 8。** 截至 2026-06-30 没有任何已发布的 VitePress 版本原生跑在 Vite 8 上（稳定版 1.6.4 自带 Vite 5，next 2.0-alpha 用 Vite 7）。文档站不是性能瓶颈，用 1.6.4 即可，不为它强上 Vite 8。

---

## 4. 构建与产物

### 形态

- Vite **library mode** → 仅产 **ESM**（库无需 CJS；如某姊妹项目确需再加 `cjs`）。
- `external: ['vue']`，vue 走 `peerDependencies`。
- CSS 集中产出**单个 `style.css`**（`build.cssCodeSplit: false`），消费端 `import 'fnb-ui/style.css'`。
- Pug、SCSS（含 `_fnb.scss` 的 mixin）**构建期全部编译掉**，产物为标准 Vue 渲染函数 + 纯 CSS，消费端零 Pug/SCSS 依赖。
- `vite-plugin-dts` 产出 `.d.ts`。

### `vite.config.ts` 骨架（参考，实现期细化）

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json' })],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
      fileName: (format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: { assetFileNames: 'style.css' },
    },
  },
})
```

### `package.json` exports（已写入初始 manifest）

```jsonc
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./style.css": "./dist/style.css",
    "./package.json": "./package.json",
    // "./nuxt" 在 Nuxt module 落地时追加（§8）
  },
  "sideEffects": ["**/*.css", "**/*.scss"],
}
```

---

## 5. 组件清单与处置

来源：PixivNow `app/components/ui/Fnb*.vue`（21 个）+ `app/components/FnbIcon.vue`（1 个，位于 ui 目录之外，初版清单漏扫），作为移植蓝本。处置分四类：

### 直接移植（纯 Vue，零业务耦合，仅去掉 `~/` 自动导入、改显式 import）

`FnbButton` · `FnbCard` · `FnbInput` · `FnbSelect` · `FnbTag` · `FnbTable` · `FnbPagination` · `FnbProgress` · `FnbSkeleton` · `FnbSpin` · `FnbScrollbar` · `FnbImage` · `FnbFloatButton` · `FnbEllipsis` · `FnbResult`

### 新增 / API 化（PixivNow 已有雏形，纳库时正式定义接口）

| 组件          | 来源                                                                     | 处置                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`FnbIcon`** | PixivNow `app/components/FnbIcon.vue`（无 props 的 `i.fnb-icon` 包裹器） | 对标 naive `NIcon` 加 props：`size`(`number→px`/`string`)、`color`、`component`（直接传图标组件，免插槽）。`inheritAttrs:false` + 默认可覆盖的 `aria-hidden`。**砍掉** naive 的 `depth`（依赖主题 opacity token，YAGNI）与 nesting 警告。样式走 naive 路线：包裹 `<i>` 只设 `font-size`/`color` + `fill: currentColor`，靠图标自带 `currentColor` 着色；不强制 `stroke`、不写 `.tabler-icon` 特例（tabler 的 `fill="none"` presentation attribute 自然胜出）。`FnbButton` 的 `:deep(.fnb-icon)` 即指此 class，纳库后成正式契约。 |

### 改名（对齐主流命名）

| 现名                    | 新名                                   | 依据                                                                          |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| `FnbMbox`               | **`FnbAlert`**                         | 带 type/closable/header 的静态内联提示 = naive `n-alert` / element `el-alert` |
| `FnbToast` + `useToast` | **`FnbMessage` 体系 + `useMessage()`** | 轻量飘条统一用 naive 的 "Message" 术语；"Toast" 偏 shadcn/chakra              |

> 其余保持不变的组件名（Button/Card/Input/Select/Tag/Table/Pagination/Progress/Skeleton/Image/Result/Ellipsis/Scrollbar/FloatButton）本就与 naive/element/ant 对齐。`FnbSpin` 采用 naive 风（`n-spin`，包裹内容加 loading 遮罩），已确认不改名为 Loading。

### API 重构（详见 §6）

- `FnbTabs` → 组合式 `<FnbTabs>` + `<FnbTabPane>`
- `FnbDialog` / `FnbToast` → 并入 Provider/Hook 体系，成为内部渲染器

### 出库（不进库，留在各消费项目）

- **`ThemeToggle`**（连同 `useTheme` / `useColorMode` / `@tabler/icons-vue`）。它本质是"紧凑+纯图标+无面板"的分段控件，可由库的 `FnbTabs type="segment" size="small"` 承载；主题状态怎么管（Nuxt color-mode 或其它）是消费端的事。各项目迁移时用 `<FnbTabs type="segment">` + 自己的主题逻辑重写。

---

## 6. API 重构（对标 naive-ui）

### 6.1 Tabs：组合式

抛弃现有扁平 `tabs: [{key,label}]` prop，改 naive 风组合式 + provide/inject：

```pug
FnbTabs(v-model:value='active', type='segment', size='small')
  FnbTabPane(name='light', tab='Light') …panel content…
  FnbTabPane(name='dark', tab='Dark') …panel content…
```

- `FnbTabs` props：`value`(v-model) · `type`（`line` | `segment`）· `size`（`small` | `medium` | `large`）。
- `FnbTabPane` props：`name`（唯一键）· `tab`（标签，支持同名具名插槽放图标/富内容）。默认插槽 = 面板内容。
- `FnbTabs` 经 provide 暴露注册表，`FnbTabPane` inject 后自注册——nav 与 panel 由父组件统一渲染。
- `type="segment" size="small"` + `tab` 插槽放图标 → 天然覆盖原 `ThemeToggle` 的"图标紧凑分段"形态，无需单独的 segmented 组件（与 naive 一致）。

### 6.2 Provider / Hook 体系

抛弃现有"模块级单例 `ref` + `FnbProvider` 直接渲染"的做法，改 naive 风 **provide/inject 上下文 + hook**，解决 SSR 安全、作用域隔离、可测试性：

| Provider             | Hook              | 职责                                               | 替代                         |
| -------------------- | ----------------- | -------------------------------------------------- | ---------------------------- |
| `FnbConfigProvider`  | （inject 内部用） | 主题 token 覆写（`theme-overrides`）+ 暗色模式注入 | 新增                         |
| `FnbMessageProvider` | `useMessage()`    | 轻量飘条（info/success/warning/error）             | 旧 `useToast` + `FnbToast`   |
| `FnbDialogProvider`  | `useDialog()`     | 确认/对话框（返回 Promise）                        | 旧 `useDialog` + `FnbDialog` |

- **实现以 naive 源码为蓝本**（已克隆至 `../naive-ui`，见 `src/message/src/`、`src/dialog/src/`）。地道 Vue3 形态：`context.ts` 暴露 typed `InjectionKey` → Provider 组件 `defineComponent` 内持有 `reactive` 列表、构造 `api` 对象、`provide(key, api)`、用 `Teleport` 渲染各条目 → `useMessage()`/`useDialog()` 仅 `inject(key, null)`，无 Provider 时 `throw`。message api 形如 `create/info/success/warning/error/destroyAll`，返回带 `.destroy()` 的 handle。**避免 React 味写法**（render-prop、prop-drilling、模块级单例）。
- `useMessage()` / `useDialog()` **读 inject 进来的上下文**，不再是模块级全局单例。组件树外层需挂对应 Provider。
- **聚合入口 `FnbProvider`**：一次性挂好 config + message + dialog（保留这个好用的总入口），消费端单标签包裹即可。
- `FnbConfigProvider` 的 `theme-overrides` 不走 css-in-js，而是把覆写的 token 当**内联 CSS 变量**写到自身根元素 `style` 上（见 §7）。
- **`createDiscreteApi`（setup 外调用）**：本期不做，列可选后续。当前各项目调用点全在 setup 内，YAGNI。

API 形状参考（实现期细化）：

```ts
const message = useMessage()
message.success('已收藏')
message.error('请求失败')

const dialog = useDialog()
const ok = await dialog.confirm({ title: '删除', content: '确定？' })
```

### 6.3 行为保真

API 形状重构，但**视觉与交互行为须与各项目现有 `Fnb*` 保持一致**（neubrutalism 外观、动画、type 配色等不变）。重构是接口层的事，不借机改设计。

---

## 7. 主题 / Token 模型

**DX 对齐 naive 的 `n-config-provider :theme-overrides`，但实现不抄 css-in-js。** 理由：本库美学固定、token 集很小，naive 的运行时 JS 样式生成是过度设计（背运行时、SSR 更麻烦）。改用主流 headless 库（Reka UI、shadcn-vue、Park UI）的**纯 CSS 变量**路线——零运行时、SSR 天然友好。

两层：

1. **全局默认**：库导出编译好的 `style.css`，内含 `:root { --fnb-* }` 默认 token（light）+ 暗色覆写。消费端 `import 'fnb-ui/style.css'` 后，想全局改主题就在自己 `:root` 覆写任意 `--fnb-*`。
2. **作用域覆写**：`FnbConfigProvider` 接收 `theme-overrides`（部分 token map），将其作为**内联 CSS 变量**写到自身根元素 `style`（`<div style="--fnb-brand:…">`），子树即被重新主题化——纯 CSS 变量、无 JS 样式生成。

### Token 拆分

现有 `_variables.scss` 把设计系统 token 与业务 token 混在一起，须拆分：

- **`--fnb-*`（进库）**：颜色（brand/surface/text/danger/success…）、圆角、字体、阴影等设计系统 token，含 light + dark 两套。
- **`--pixiv-*` / `--pica-*`（不进库）**：各项目业务 token（如 PixivNow 的 `--pixiv-r18-text`），留在各自项目。

### 暗色触发约定

采用 `.dark` class（对齐 Tailwind/生态主流，区别于现有 PixivNow 的 `html.dark`——实现期统一为 `.dark` 或文档说明可配）。文档需给出如何接 Nuxt color-mode 的指引。

---

## 8. Nuxt module（可选，子路径 `fnb-ui/nuxt`）

现有姊妹项目都是 Nuxt，提供一个可选 module 提升 DX：

- 自动注册全部 `Fnb*` 组件
- 自动导入 `useMessage` / `useDialog`
- 自动注入 `style.css`

普通 Vite + Vue3 项目走标准 `import`，不依赖该 module。落地时在 `exports` 追加 `"./nuxt"` 子路径，并加 `@nuxt/kit` / `@nuxt/module-builder` 相关 devDep。

> 排期上可放在核心库 + 文档站之后（§11）。

---

## 9. 文档站

- 站点位于 **`website/`**（VitePress root），与 `docs/`（SDD specs/plans）分开，避免 VitePress 把设计文档也当站点页面构建。`package.json` 的 `docs:*` 脚本指向 `website`。
- VitePress 1.6.4 + `vitepress-demo-plugin` 1.5.1，Markdown 内嵌 live 组件 demo（渲染效果 + 源码）。
- 覆盖：每个组件用法、主题覆写指南、Provider/Hook 用法、Nuxt 接入指南。
- 同时承接各项目原本散落的"组件 showcase"（如 PixivNow 的 `/_debug/components`）的职责。

---

## 10. 目录结构（参考）

```
fnb-ui/
├─ src/
│  ├─ components/          # Fnb*.vue（Pug + SCSS）
│  ├─ composables/         # useMessage / useDialog 等
│  ├─ providers/           # FnbConfigProvider / FnbProvider 等
│  ├─ styles/              # _variables.scss / _fnb.scss(mixins) / index.scss
│  └─ index.ts             # 公共入口（导出组件 + hook + 类型）
├─ nuxt/                   # 可选 Nuxt module（§8，后续）
├─ website/                # VitePress 文档站（独立于 docs/，避免与 SDD 文档冲突）
│  └─ .vitepress/
├─ docs/                   # SDD 文档（非 VitePress）
│  └─ superpowers/         # specs / plans（本文件所在）
├─ vite.config.ts
├─ tsconfig.json           # 含 vueCompilerOptions.plugins: ['@vue/language-plugin-pug']
├─ .oxlintrc.json
├─ .prettierrc             # 含 @prettier/plugin-pug
└─ package.json
```

> 代码风格沿用既有约定：Prettier 无分号、单引号、2 空格、`es5` 尾逗号；模板 Pug；样式 SCSS。

---

## 11. 实现阶段划分

按依赖顺序，非时间排期：

1. **基建**：`vite.config.ts`、`tsconfig.json`（挂 Pug language plugin）、`.oxlintrc.json`、`.prettierrc`、`src/index.ts` 空壳；跑通一个最小组件的 build → 产物核验（ESM + style.css + dts）。
2. **样式底座**：拆分并移植 `--fnb-*` token（light + dark）与 SCSS mixin 到 `src/styles/`。
3. **直接移植组件**（§5 第一类）：逐个搬运、去自动导入、补类型。
4. **改名组件**：`FnbMbox`→`FnbAlert`。
5. **API 重构组件**：`FnbTabs`/`FnbTabPane`；Provider/Hook 体系（`FnbConfigProvider` / `FnbMessageProvider`+`useMessage` / `FnbDialogProvider`+`useDialog` / `FnbProvider`）。
6. **文档站**：VitePress + demo，覆盖全部组件与指南。
7. **Nuxt module**（可选）。
8. **首次发布**：`0.x` 发布到 npm。

---

## 12. 待验证 / 风险

- **Rolldown 库产物正确性**（最高优先）：library mode 下 `external vue`、单 `style.css`、`.d.ts` 完整性、tree-shaking 是否都正常。Rolldown 1.0 仅发布两月，官方称"插件基本兼容"但无公开缺陷清单，**必须构建后人工核验**。回退：临时退 Vite 7（Rollup）。
- **Pug + dts 链路**：`vue-tsc` + `@vue/language-plugin-pug` 能否对 Pug 模板正确产出类型声明，需实测。
- **暗色 class 约定**（`.dark` vs 可配）实现期定稿。

---

## 13. PixivNow / 姊妹项目迁移（本期非目标，后续）

`fnb-ui` 发布后，各项目改用该包是独立后续任务：

- 删除项目内 `app/components/ui/Fnb*.vue`，改依赖 `fnb-ui`。
- `import 'fnb-ui/style.css'`，业务 token（`--pixiv-*` 等）留项目内。
- 用 `<FnbTabs type="segment">` + 项目自己的主题逻辑重写 `ThemeToggle`。
- 调用点从 `useToast` → `useMessage`、`FnbMbox` → `FnbAlert`、`FnbTabs` 旧 API → 新组合式。

迁移属 API 破坏性变更，各项目独立排期、独立验证。
