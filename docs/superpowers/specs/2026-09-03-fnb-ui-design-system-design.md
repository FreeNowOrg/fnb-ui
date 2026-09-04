# fnb-ui 设计系统分层 spec

- **日期**：2026-09-03
- **状态**：设计定稿，待实现
- **承接**：[2026-06-30-fnb-ui-foundation-design.md](./2026-06-30-fnb-ui-foundation-design.md)
- **作者**：FreeNowOrg / Dragon-Fish（设计），Claude（整理）

---

## 1. 背景与目标

### 背景

基础 spec 已落地：23 个组件、`--fnb-*` CSS 变量主题、`FnbConfigProvider` 作用域覆写。但样式全部锁在 SFC 的 `<style scoped>` 里，离开 Vue 无法使用；token 手写在 `_variables.scss`，无类型无校验。

与此同时，两个目标项目仍在大量复制粘贴：

- PicaComicNow 的品牌色 `#FF5C8A` **硬编码 30 处**，项目内连 `:root` 变量都没有
- 两项目各有一份 `Header` / `Footer` / `SideNav` / `BackToTop` / `NProgress` / `ExternalLink`
- 复制粘贴后已开始漂移：`ExternalLink` 两边图标库、间距（`0.4em` / `4px`）、字号（`0.7em` / `0.75em`）、预处理器（sass / scss）全不相同；`NProgress` 的 header 偏移一边 `63px` 一边 `61px`
- PixivNow 的 `SiteHeader.vue` 456 行、`SideNav.vue` 210 行，通用骨架与业务逻辑完全缠绕

### 目标

把 fnb-ui 做成正经组件库，前期服务 FreeNowOrg 的两个项目。

两条成功标准，缺一不可：

1. **两个项目的重复 CSS 与组件被消灭**——不是库里组件变多。
2. **组件默认状态开箱即生产可用、互相对齐**——使用方不需要为了让 Button / Input / Select 排在一起而各自调尺寸。当前做不到这点（见 §5），这不叫组件库。
3. **CSS 层可脱离任何框架独立使用**——由 monorepo 的包边界强制（见 §3），而非仅靠约定。

### 非目标

- **不迁移 PixivNow / PicaComicNow**——单开 spec，跨仓库改动不混进本期
- 不做 MediaWiki 皮肤、单文件内联 dist、字体拉取脚本
- 不做 `FnbUserMenu`（Pixiv 特有形态：banner 背景 + 大头像 + `@uid`，换项目必不合身，用 `FnbDropdown` + slot 在业务侧组装即可）
- 不做 naive-ui 式的组件级主题覆盖（理由见 §4.6）
- 不附带任何向后兼容层

---

## 2. 第一原则

> **CSS 是产品，Vue 是薄封装。**

三条推论，后续所有取舍以此裁定：

1. **任何样式的唯一真源是 CSS 文件**。SFC 不得含 `<style>` 块。
2. **组件能力优先用 CSS 表达**，JS 只承担 CSS 无法表达的行为（状态、事件、焦点管理）。
3. **不追 naive-ui 的深度，只借它的形状**：顶层配置、类型安全、预设、可嵌套——这些要；组件级全属性运行时覆盖——不要。

### 命名约定（强制）

- 组件一律 `Fnb*` 前缀
- CSS 变量一律 `--fnb-*` 前缀
- CSS 类一律 `fnb-` 前缀 + BEM（`fnb-block__element--modifier`）
- `@keyframes` 一律 `fnb-` 前缀（外提后为全局，须防与宿主页面冲突）

---

## 3. 包结构

仓库为 pnpm monorepo。**CSS 是核心导出，框架封装是外围。**

```
packages/
  core/                       @fnb-ui/core —— 核心导出
    src/tokens/index.ts         token 真源（TS，带类型）
    src/styles/                 ← scripts/gen-tokens.mjs 产出 tokens.css
      tokens.css                  :root 默认值 + .dark 覆写   ← 生成，勿手改
      base.css                    .fnb-prose 正文排版层
      components.css              .fnb-button / .fnb-card / …  ← 从 SFC 外提
      layout.css                  .fnb-header / .fnb-sider / …
      index.css                   汇总入口
    src/logic/                  框架无关逻辑
  vue/                        @fnb-ui/vue —— Vue 3 薄封装，依赖 core
    src/components/
    src/providers/
    src/composables/
website/                      VitePress 文档站
```

**core 双入口**，使纯 CSS 使用者不会拉进任何 JS：

```jsonc
// packages/core/package.json
"exports": {
  "./style.css": "./dist/style.css",   // 纯 CSS，零 JS
  ".":           "./dist/index.js"     // tokens 常量 + 类型 + 框架无关逻辑
}
```

**包边界即第一原则的强制**：`@fnb-ui/vue` 不含任何 CSS 文件，物理上无法把样式塞回 SFC。将来 `@fnb-ui/vanilla` / `react` / `web-components` 与 vue 平级，同样只依赖 core。

### logic 层的范围

23 个组件中**仅 6 个**含框架无关逻辑：`Select`（open + click-outside + 键盘导航）、`Pagination`（页码窗口计算，纯函数）、`Dialog`（promise 化 + scroll-lock）、`Message`（队列 + 定时器）、`Image`（预览 + scroll-lock）、`Tabs`（激活项）。其余 16 个是 props→class 的映射，在 vue 包中即为数行模板。

**不现在拆独立 `@fnb-ui/headless` 包**：6 个组件的逻辑量不足以支撑一个包。但 `core/src/logic/` 的目录与 exports 边界已经画好，将来真要拆分时成本接近零。

### 主题的三层作用域

| 层           | 谁提供                              | 作用域         | 运行时开销 | 用途                          |
| ------------ | ----------------------------------- | -------------- | ---------- | ----------------------------- |
| 默认值       | `tokens.css` 的 `:root`             | 全局           | 零         | 库自带                        |
| 项目常驻主题 | 项目自写 `:root { --fnb-brand: … }` | 全局           | 零         | PixivNow 蓝 / PicaComicNow 粉 |
| 运行时覆盖   | `FnbProvider :theme-overrides`      | 作用域，可嵌套 | 内联 style | 动态换肤、局部主题            |

**禁令：`FnbProvider` 不得写入 `document.documentElement`。** 注入 `:root` 会带来副作用（SSR 渲染不出，首屏闪默认主题）、破坏 Provider 嵌套（后挂载者覆盖先挂载者，卸载顺序还会出错）、污染宿主页面根节点。作用域内联注入是既定方案，不要改。

---

## 4. 阶段 ①：token 真源化

### 4.1 真源与生成

`packages/core/src/tokens/index.ts` 为唯一定义，`scripts/gen-tokens.mjs` 生成 `packages/core/src/styles/tokens.css`。生成产物提交进仓库（便于 review diff），并在 CI 校验"重新生成后无差异"。

### 4.2 原始层 → 语义层

两个项目的调色板结构完全对称，差异只在 brand 及其淡化出的 bg：

| 角色      | PixivNow  | PicaComicNow      |
| --------- | --------- | ----------------- |
| brand     | `#4993ff` | `#FF5C8A`         |
| bg        | `#eef2ff` | `#FFF0F3`         |
| highlight | `#FFE066` | `#FFE066`（相同） |
| danger    | `#FF5555` | `#FF5555`（相同） |

因此**原始 token 保持极少数**，语义 token 由原始 token 用 `color-mix(in oklab, …)` 派生，纯 CSS 零运行时。目标形态是项目接入只需：

```css
:root {
  --fnb-brand: #ff5c8a;
  --fnb-bg: #fff0f3;
}
```

必须派生化的两处漏色（当前实现的实际缺陷）：

- `.dark { --fnb-shadow-color: #2f5ea8 }` 是**硬编码的蓝**，未引用 brand。粉色主题下暗色硬阴影仍是蓝的。
- `--fnb-brand-hover` 是独立硬编码值，覆盖 brand 后不跟随。

**视觉等价约束**：派生值必须与现有色值视觉等价。实现时逐个比对派生结果与原值，做一次性的前后并排对比供人工确认（不要边改边翻转覆写）；无法在可接受误差内等价的，保留硬编码并在 `core/src/tokens/index.ts` 注明原因。这是本期唯一允许的视觉变化点。

### 4.3 补齐 scale

当前 30 个 token 偏平，缺以下 scale。`FnbSider` 的遮罩层级、`FnbHeader` 的 sticky 层级现在无处声明，必须先补。

- **spacing**：4px 基数，`--fnb-space-1` … `--fnb-space-8`
- **motion**：`--fnb-duration-fast`（150ms，现有组件统一用值）、`--fnb-duration`、`--fnb-ease`
- **z-index**：显式分配，避免各组件各自拍脑袋
  ```
  base < sticky-header < sider-overlay < sider
       < dialog-overlay < dialog < message < image-preview
  ```
- **layout 尺寸**：`--fnb-header-height`。两项目 header 高度目前是手调的 magic number（PixivNow `63px` / PicaComicNow `61px`），导致顶部进度条偏移、锚点 `scroll-margin-top`、`FnbSider` 顶部对齐全部各写各的。此 token 是布局层的前置依赖。

### 4.4 breakpoint 是特例，不生成 CSS 变量

**CSS 变量在 `@media` 查询条件里不生效**——`@media (min-width: var(--fnb-bp-md))` 静默失效，不报错。`@custom-media` 尚未落地可用。

因此 breakpoint 只以 `core/src/tokens/index.ts` 的 **TS 常量**发布（供 `useMediaQuery` 等消费），**不进入任何样式表**——既不生成 CSS 变量，也不生成 SCSS 变量。生成脚本跳过 breakpoint 分组。

库内若需要 `@media`，直接写死与该常量一致的 px 字面量。本仓库已无 SCSS 层，发布一份没有消费者的 `_breakpoints.scss` 属于过度设计。

### 4.5 类型收紧

`FnbThemeOverrides` 从 `Record<string, string>` 收紧为 token 名的联合类型，写错即报错、有补全。类型由 `core/src/tokens/index.ts` 推导，由 core 导出、vue 包重导出，不手写维护。

### 4.6 覆盖粒度：只做全局 token

`themeOverrides` 是**平铺的全局 token map**，不支持 `{ Button: { … } }` 组件级覆盖。

理由：组件级要做到 naive-ui 的粒度，需为每个组件声明整套 `--fnb-button-*`，变量从 ~45 膨胀到 200+，且每新增一个组件都要同步维护一套——naive-ui 靠 CSS-in-JS 自动生成才负担得起，手写 CSS 变量扛不住。且 CSS 层本就开放，组件要特殊化直接类名覆盖即可。

### 4.7 业务 token 出库

删除 `--fnb-bookmark`（`#ff69b4`，Pixiv 收藏色）。基础 spec §7 已确立业务 token 不进库，此处执行。PixivNow 迁移时在项目侧自行声明。

### 4.8 主题预设

`packages/core/src/themes/index.ts` 导出 `pixivTheme` / `picaTheme` 等预设对象（属 core，因其为纯数据）。同一份预设两用：传给 `FnbProvider`（动态），或由脚本生成 CSS 片段直接引入（静态）。

---

## 5. 尺寸系统

**本章是本期的核心质量目标：任一 size 下，所有控件默认值互相对齐、开箱即生产可用。使用方不应为对齐而调整任何尺寸。**

### 5.1 问题实证

dist 实测（Chromium，16px 根字号）：

| 组件           | 实测高度   | border  | shadow  | naive-ui 对应档 | Ant Design 对应档 |
| -------------- | ---------- | ------- | ------- | --------------- | ----------------- |
| `FnbButton` sm | 35.8px     | 2px     | 4px     | small 28        | small 24          |
| `FnbButton` md | **52.5px** | **3px** | **6px** | medium 34       | middle 32         |
| `FnbButton` lg | 62.5px     | 3px     | 6px     | large 40        | large 40          |
| `FnbInput`     | **42.5px** | **2px** | **4px** | —               | —                 |
| `FnbTag`       | 27.8px     | 2px     | 3px     | —               | —                 |
| `FnbCard`      | —          | 3px     | 6px     | —               | —                 |

四项症状：

1. **整个 scale 上偏一档以上**：`md` 52.5px 比 Ant Design 的 `large`(40px) 还大 12.5px。
2. **同类控件在三个维度上全部不对齐**：`Button md` 与 `Input` 高度差 10px、边框差 1px、阴影差 2px。在本设计语言里 border 与 shadow **就是视觉重量本身**，因此即使高度调齐，两者并排仍不像一套。（`FnbTag` 的 2px/3px 偏轻**是合理的**——它是行内标记不是控件，见 §5.2 的 weight 维度。）
3. **border 不一致使拼接无法计算**：Group 合并相邻边依赖 `-1 × border-width`，成员边框不等宽则必然裂开或重叠。故边框/阴影对齐是 §5.4 能成立的**前提**，非锦上添花。
4. **生产中默认值是少数派**：PixivNow 的 36 个 `FnbButton` 里 **24 个显式写 `size='sm'`**（占三分之二）。

后果见 PixivNow `SiteHeader.vue` 的搜索胶囊——为把 `FnbSelect` + `FnbInput` 拼在一起，使用方把两个组件的样式**几乎全部拆光再重贴**：

```scss
.fnb-select-trigger {
  border: none;
  box-shadow: none; // 拆掉组件边框与阴影
  border-right: 2px solid …; // 手动补分隔线
  background: transparent;
  height: 100%; // 强行拉高对齐 ← 无统一 control-height 的直接后果
  &:hover {
    transform: none;
  } // 拆掉按压动效
}
```

### 5.2 两个正交维度：size 与 weight

尺寸与视觉重量是**两个正交维度**，不可合并为一。

**维度一 · size** —— 决定尺寸：

| size       | height   | font-size | padding-inline |
| ---------- | -------- | --------- | -------------- |
| sm         | 28px     | 13px      | 10px           |
| md（默认） | **36px** | 14px      | 14px           |
| lg         | 44px     | 16px      | 18px           |

**`md = 36px` 取自真实生产**：PixivNow 三分之二的按钮实际选用的 `size='sm'` 实测 35.8px，取整到 4px 基数即 36px。默认值直接对齐两个项目已经跑了很久的那个尺寸，而非另拍一个数。

**维度二 · weight** —— 决定视觉重量，border 与 shadow 成对：

| weight     | border | shadow | 适用              |
| ---------- | ------ | ------ | ----------------- |
| w1（轻）   | 2px    | 3px    | Tag 等行内标记    |
| w2         | 2px    | 4px    | sm 档控件         |
| w3（标准） | 3px    | 6px    | md 档控件、Card   |
| w4（重）   | 3px    | 8px    | lg 档控件、Dialog |

**禁令：border 与 shadow 必须成对变更，禁止单独调整其一。** 在本设计语言中硬阴影与边框是同级别的东西，二者合起来才构成一档视觉重量；拆开调会立刻失衡。

**元素 → weight 映射由元素类型主导，不由 size 单独决定：**

- **Tag 恒为 w1，不随 size 升档。** `size=md` 的 Tag 不应背上 Card 的 3px/6px——行内标记与容器的视觉重量本就不同，强行统一是错的。
- Button / Input / Select：sm→w2，md→w3，lg→w4
- Card：w3　｜　Dialog：w4

**同一 size 的控件之间**（Button / Input / Select），height、border、shadow 三者必须全部一致——缺任一维度都对不齐。这与「Tag 保持轻」并不冲突：前者是同类元素的同档对齐，后者是异类元素的重量分级。

`w3` 的 `border 3px / shadow 6px` 与现有 `FnbButton md`、`FnbCard` 一致，故容器与标准控件的视觉重量自动统一。`w4` 的 border 保持 3px 不升到 4px：4px 边框在本设计语言下过重，大元素改由更深的阴影表达层级。

**已验证**（原型实测）：三档 group 成员高度分别为 28/36/44 且组内完全一致，接缝间隙等于 `-border`（完美重合）；独立的 Button md 与 Input md 三维一致；Tag(w1) 2px/3px 与 Button(w3) 3px/6px 在同为默认 size 时重量不同，正交生效。

### 5.3 实现约束

- **单行控件用显式 `height: var(--fnb-control-h-*)` + `padding-inline`，禁止用 `padding-block` 撑高。** 靠 padding 撑高会因各组件字号与 `line-height: normal` 的差异产生偏移——这正是当前 Button 与 Input 差 10px 的病根。
- `box-sizing: border-box`，border 计入高度。
- 图标槽位用 `1em` 相对字号，不得额外撑高行。
- **适用**：Button、Input、Select、Pagination 按钮等单行控件。
- **不适用于 control-h**：Tag（行内标记，固定 ~24px，weight 恒为 w1）、Alert / Table 等多行内容组件。Card 取 w3 的 border/shadow 但不受 height 约束。

**size 通过 CSS 变量继承传递，组件不感知自己所处的 size 上下文**：

```css
:root {
  /* size 维度，默认 md */
  --fnb-control-h: 36px;
  --fnb-control-font: 14px;
  --fnb-control-px: 14px;
  /* weight 维度，默认 w3 */
  --fnb-weight-border: 3px;
  --fnb-weight-shadow: 6px;
}
.fnb-button,
.fnb-input,
.fnb-select__trigger {
  height: var(--fnb-control-h);
  font-size: var(--fnb-control-font);
  padding-inline: var(--fnb-control-px);
  border-width: var(--fnb-weight-border);
  box-shadow: var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0
    var(--fnb-shadow-color);
}
/* 控件的 size 类同时切两个维度——控件的 weight 跟随其 size */
.fnb-button--sm,
.fnb-input-group--sm {
  --fnb-control-h: 28px;
  --fnb-control-font: 13px;
  --fnb-control-px: 10px;
  --fnb-weight-border: 2px;
  --fnb-weight-shadow: 4px; /* → w2 */
}
/* Tag 只锁 weight，不参与 control size */
.fnb-tag {
  --fnb-weight-border: 2px;
  --fnb-weight-shadow: 3px;
  height: 24px;
}
```

由此 `.fnb-input-group--sm` 只需覆盖变量，**全体成员经 CSS 继承自动跟随**——成员无需知道自己在 group 内，Vue 侧也不必 provide/inject 传 size。两个维度各用一组变量，正交性由此在实现层面强制。

### 5.4 组合拼接：`.fnb-input-group`

库需提供拼接的一等支持，消灭 §5.1 那种拆解重组。

```pug
.fnb-input-group
  FnbSelect(…)
  FnbInput(…)
  FnbButton(variant='primary') 搜索
```

`.fnb-input-group` 的职责：

- 成员共享相邻边：相邻项 `margin-inline-start: calc(-1 * var(--fnb-weight-border))`。**此式成立的前提是组内成员边框等宽**，由 §5.2 保证。
- 成员各自的 `box-shadow` 归零，由 group 统一施加一次——否则硬阴影会互相遮挡（后一个盖住前一个）。
- 成员的按压位移（`fnb-press`）在组内禁用，避免拼接处裂开。
- size 由 group 上的变量覆盖决定，成员经 CSS 继承自动跟随（见 §5.3）。
- **焦点态改用内描边**：成员 shadow 已归零，`FnbInput` 原有的 `:focus { box-shadow: 4px 4px 0 0 brand }` 在组内既失效又会撑破拼接。组内改用
  ```css
  .fnb-input-group > :focus-visible {
    outline: 2px solid var(--fnb-brand);
    outline-offset: -2px; /* 内描边，不占布局、不影响相邻边合并 */
    position: relative;
    z-index: 1; /* 描边压在相邻成员之上 */
  }
  ```

目标是 SiteHeader 的搜索胶囊迁移后**零样式覆盖**。

### 5.5 破坏性变更声明

本章是本期**唯一的、经明确批准的整体视觉变更**：所有组件默认尺寸缩小。

迁移影响：PixivNow 现有 24 处 `size='sm'` 在新 scale 下应**删除该属性改用默认值**（旧 sm 35.8px ≈ 新 md 36px），由迁移 spec 承接。§4.2 的 `color-mix` 派生仍须保持视觉等价，不在此豁免范围内。

---

## 6. 阶段 ②：样式外提

### 6.1 外提范围

19 个含 `<style scoped>` 的 SFC，样式迁入 `components.css`，SFC 只保留模板与逻辑。

组件模板**现已在输出 BEM 类名**（如 `fnb-button--${variant}`），所以模板改动极小，本质是搬运 + 去掉 scoped 属性。

`cssCodeSplit: false` 已使产物为单个 `style.css`，**scoped 转全局不损失任何 tree-shaking**（本来就没有）。

### 6.2 需要专门处理的点

- **`:deep()` 失效**：scoped 移除后 `:deep()` 无意义，改为直接选择器（如 `FnbButton` 里的 `:deep(.fnb-icon)` → `.fnb-button .fnb-icon`）。
- **`@keyframes` 去重**：多个 SFC 各自内联了同名 keyframes（`spin`、`imgProgress`），外提后统一定义一次，并加 `fnb-` 前缀避免与宿主页面冲突。
- **命名前缀**：所有类名 `fnb-` 前缀 + BEM，防止全局化后与宿主冲突。

### 6.3 新增 base.css

正文排版层，作用域限定在 `.fnb-prose`（不裸改 `h1`/`p`/`a`，避免污染宿主）。覆盖标题、正文、链接、列表、表格、代码块。两个项目的全局排版 CSS（PixivNow `app/assets/styles/_elements.scss` 等）由此统一收编。

链接排版一并收编：默认 `underline` + `text-underline-offset: 3px`，`.fnb-link--plain` 去除装饰（对应 PixivNow 现有的 `a.plain`，站内 30+ 处使用）。

---

## 7. 阶段 ③：布局层

### 7.1 组件清单

| 类别       | 组件                                   | 职责                                                  |
| ---------- | -------------------------------------- | ----------------------------------------------------- |
| 骨架       | `FnbLayout`                            | 纵向 flex 容器，`min-height: 100vh`                   |
|            | `FnbHeader`                            | sticky + 三槽（left/center/right）+ 滚动隐藏          |
|            | `FnbSider`                             | 抽屉 + 遮罩 + 滚动锁，`v-model:open`                  |
|            | `FnbFooter`                            | 页脚容器                                              |
| 配件       | `FnbBrand` / `FnbNav` / `FnbNavLink`   | 导航现成件                                            |
| 基础件     | `FnbDropdown`                          | 新增。触发器 + 浮层 + click-outside                   |
|            | `FnbDivider`                           | 新增。分隔线，强/弱两档 + 可带标题（见 §7.5）         |
| 全局件     | `FnbBackToTop`                         | 基于已有 `FnbFloatButton` 薄封装 + 滚动阈值           |
|            | `FnbLoadingBar`                        | 顶部加载指示条，**自实现替换 `nprogress`**（见 §7.3） |
|            | `FnbLink`                              | 统一链接件，`external` 为语法糖（见 §7.4）            |
| composable | `useScrollDirection` / `useScrollLock` | 行为复用                                              |

### 7.2 去重要点

- `FnbDropdown` 落地后，`FnbSelect` 内部那份重复的 click-outside 实现改为复用它。
- `useScrollLock` 从 `FnbDialogProvider` 现有实现提取，`FnbSider` 与 `FnbDialogProvider` 共用一份。

### 7.3 `FnbLoadingBar`：替换 nprogress 而非封装它

两项目现有的 `NProgress.vue` 模板为空，本体是第三方包 `nprogress`（停更于 v0.2.0）加一层样式补丁与路由钩子。两边都在删它自带的 `.peg`、都不需要 `.spinner` 却都留着、都硬编码了 header 偏移。**覆盖它的代码量已接近重写它**，而它的核心逻辑（伪造递增至 99%、完成时冲到 100%）仅约 30 行。

因此自实现 `FnbLoadingBar`，让两个项目移除 `nprogress` 与 `@types/nprogress` 依赖。

- **命名**：不叫 `FnbProgress`（已存在，是 `percentage` 受控的真实进度条）。LoadingBar 显示的是**伪造进度**，语义不同，不可混用。
- **API**：`useLoadingBar()` 提供 `start()` / `finish()` / `error()`。**不绑定任何路由库**，路由联动留在项目侧。
- **定位**：默认 `top: var(--fnb-header-height)`，消灭 `63px` / `61px` 这类 magic number。
- **不做 spinner**：两项目都不需要。

### 7.4 `FnbLink`：合并 ExternalLink

两项目的 `ExternalLink` 合并为通用 `FnbLink`。

- **`external` 是三件事的语法糖**：默认后缀图标 + `target="_blank"` + `rel="nofollow noopener"`。
- **`external` 与 `suffix-icon` 槽位正交**：槽位只覆盖图标，不影响 `target` / `rel`。若把 `external` 实现成纯图标语法糖，用户自定义图标时会连带丢掉链接行为——不要这样做。
- **默认外链图标用纯 CSS 实现**（`::after` + SVG data URI 作 `mask`，颜色随 `currentColor`）。库不携带任何图标资源（`FnbIcon` 亦只接收外部传入的组件），且此法使非 Vue 使用者写 `class="fnb-link fnb-link--external"` 同样得到图标。
- **不做 `RouterLink` 适配**：`<RouterLink class="fnb-link">` 直接可用。这是「CSS 是产品」的直接红利，不要为路由链接单独造组件。

### 7.5 `FnbDivider`

两个项目并存两种分隔线，故需两档，非过度设计：

| 档             | 线宽 / 颜色                                 | 用途         | 现有出处                      |
| -------------- | ------------------------------------------- | ------------ | ----------------------------- |
| 弱（默认）     | 1px `--fnb-divider`                         | 列表项之间   | PicaComicNow `1px solid #eee` |
| 强（`strong`） | `var(--fnb-weight-border)` + `--fnb-border` | section 边界 | 两项目多处 `3px solid #000`   |

- props：`strong` / `dashed` / `vertical` / `titlePlacement`（`left | center | right`，默认 `center`），标题走默认 slot。
- **Divider 不参与 weight 维度的 shadow 部分**——它是线不是块，无阴影。强档线宽复用 `--fnb-weight-border`，以与同处容器的边框等宽。
- 垂直档在 flex 行内用 `align-self: stretch`，不设固定高度。
- `base.css` 中 `<hr>` 直接套用弱档样式，使 `.fnb-prose` 内的分节符与 `FnbDivider` 外观一致（PixivNow `NovelReader` 的 `.page-divider` 由此复用）。

**迁移注记**：PicaComicNow 的分隔线颜色全部硬编码（`#000` / `#eee`），未走 `--fnb-border` / `--fnb-divider`——与其品牌色硬编码 30 处同源，迁移 spec 需计入。

### 7.6 布局层的 CSS/JS 分界

布局件是本库唯一带显著行为的一层。分界：`layout.css` 提供全部外观与**状态类**（`.fnb-sider--open`、`.fnb-header--hidden`、`.fnb-header--not-at-top`），Vue 只负责在正确时机切换这些类。非 Vue 使用者自行切类即可获得同样效果。

### 7.7 修复 Teleport 主题逃逸

**现存 bug**：`FnbConfigProvider` 将 `--fnb-*` 与 `dark` class 施加于 `.fnb-config-provider` 这个 div，而 `FnbMessageProvider`、`FnbDialogProvider`、`FnbImage` 预览层均 `Teleport(to='body')`——传送出去的内容**同时拿不到主题变量和暗色 class**。粉色主题 + 暗色下开弹窗，会看到蓝色阴影的亮色弹窗。

修法：新增内部 composable

```ts
const { class: themeClass, style: themeStyle } = useThemeScope()
```

经现有 `provide` 通道下发，在 `.fnb-dialog-overlay`、`.fnb-message-container`、`FnbImage` 预览层三处根元素 `v-bind`。变量跟着组件走，不碰 document，不污染 `:root`，嵌套语义不变。

---

## 8. 验证标准

1. `pnpm build` 产出的 `style.css` 在**无 Vue 的纯 HTML 页**中引入后，按钮/卡片/标签/表单/排版外观正确。
2. 单页内写 `:root { --fnb-brand: #ff5c8a; --fnb-bg: #fff0f3 }`，明暗两模式下**无残留蓝色**（含硬阴影、focus 环、弹窗、图片预览）。
3. `themeOverrides` 传入不存在的 token 名，`vue-tsc` 报错。
4. 嵌套两层 `FnbProvider`，内层覆盖生效且不影响外层；卸载内层后外层主题正确恢复。
5. `scripts/gen-tokens.mjs` 重新运行后 `tokens.css` 无 diff。
6. 全库 SFC 中 `<style>` 块数量为 0。
   6b. **包边界**：`packages/vue/dist` 中不存在任何 `.css` 文件；`@fnb-ui/core/style.css` 的引入不触发任何 JS 加载。
7. `FnbLink` 同时传 `external` 与自定义 `suffix-icon` 时，图标被覆盖而 `target` / `rel` 仍生效（正交性）。
8. `tokens.css` 中不含任何 breakpoint 变量；breakpoint 只以 TS 常量导出，构建产物中不存在任何 breakpoint 样式表。
9. **同类控件三维对齐**：同一 size 下 `FnbButton` / `FnbInput` / `FnbSelect` 的 `height`、`borderTopWidth`、`boxShadow` 三项计算值完全相等，sm/md/lg 三档均需通过。
   9b. **weight 与 size 正交**：默认 size 下 `FnbTag` 的 border/shadow 严格轻于 `FnbButton`（2px/3px vs 3px/6px）；Tag 不因 size 变化而升到 w3。
10. **组合零覆盖**：`.fnb-input-group` 包裹 Select + Input + Button 后，不写任何额外 CSS 即得到与 PixivNow 现有搜索胶囊等效的外观；组内任一成员获得焦点时拼接不裂开。
