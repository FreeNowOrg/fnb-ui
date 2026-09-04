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

## 3. 架构分层

```
src/tokens/index.ts          真源（TS，带类型）
      │ scripts/gen-tokens.mjs
      ▼
src/styles/
  tokens.css        :root 默认值 + .dark 覆写        ← 生成，勿手改
  base.css          .fnb-prose 正文排版层             ← 新增
  components.css    .fnb-button / .fnb-card / …      ← 从 SFC 外提
  layout.css        .fnb-header / .fnb-sider / …     ← 新增
  index.css         汇总入口
```

Vue 层只提供行为与结构，`import 'fnb-ui/style.css'` 之外不产出任何样式。

### 主题的三层作用域

| 层 | 谁提供 | 作用域 | 运行时开销 | 用途 |
|---|---|---|---|---|
| 默认值 | `tokens.css` 的 `:root` | 全局 | 零 | 库自带 |
| 项目常驻主题 | 项目自写 `:root { --fnb-brand: … }` | 全局 | 零 | PixivNow 蓝 / PicaComicNow 粉 |
| 运行时覆盖 | `FnbProvider :theme-overrides` | 作用域，可嵌套 | 内联 style | 动态换肤、局部主题 |

**禁令：`FnbProvider` 不得写入 `document.documentElement`。** 注入 `:root` 会带来副作用（SSR 渲染不出，首屏闪默认主题）、破坏 Provider 嵌套（后挂载者覆盖先挂载者，卸载顺序还会出错）、污染宿主页面根节点。作用域内联注入是既定方案，不要改。

---

## 4. 阶段 ①：token 真源化

### 4.1 真源与生成

`src/tokens/index.ts` 为唯一定义，`scripts/gen-tokens.mjs` 生成 `src/styles/tokens.css`。生成产物提交进仓库（便于 review diff），并在 CI 校验"重新生成后无差异"。

### 4.2 原始层 → 语义层

两个项目的调色板结构完全对称，差异只在 brand 及其淡化出的 bg：

| 角色 | PixivNow | PicaComicNow |
|---|---|---|
| brand | `#4993ff` | `#FF5C8A` |
| bg | `#eef2ff` | `#FFF0F3` |
| highlight | `#FFE066` | `#FFE066`（相同） |
| danger | `#FF5555` | `#FF5555`（相同） |

因此**原始 token 保持极少数**，语义 token 由原始 token 用 `color-mix(in oklab, …)` 派生，纯 CSS 零运行时。目标形态是项目接入只需：

```css
:root { --fnb-brand: #ff5c8a; --fnb-bg: #fff0f3; }
```

必须派生化的两处漏色（当前实现的实际缺陷）：

- `.dark { --fnb-shadow-color: #2f5ea8 }` 是**硬编码的蓝**，未引用 brand。粉色主题下暗色硬阴影仍是蓝的。
- `--fnb-brand-hover` 是独立硬编码值，覆盖 brand 后不跟随。

**视觉等价约束**：派生值必须与现有色值视觉等价。实现时逐个比对派生结果与原值，做一次性的前后并排对比供人工确认（不要边改边翻转覆写）；无法在可接受误差内等价的，保留硬编码并在 `tokens/index.ts` 注明原因。这是本期唯一允许的视觉变化点。

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

因此 breakpoint 在 `tokens/index.ts` 定义后，只生成 **SCSS 变量**（供 `@media` 使用）与 **TS 常量导出**（供 `useMediaQuery` 使用），**不生成 CSS 变量**。生成脚本需对 breakpoint 分组做此特殊处理。

### 4.5 类型收紧

`FnbThemeOverrides` 从 `Record<string, string>` 收紧为 token 名的联合类型，写错即报错、有补全。类型由 `tokens/index.ts` 推导，不手写维护。

### 4.6 覆盖粒度：只做全局 token

`themeOverrides` 是**平铺的全局 token map**，不支持 `{ Button: { … } }` 组件级覆盖。

理由：组件级要做到 naive-ui 的粒度，需为每个组件声明整套 `--fnb-button-*`，变量从 ~45 膨胀到 200+，且每新增一个组件都要同步维护一套——naive-ui 靠 CSS-in-JS 自动生成才负担得起，手写 CSS 变量扛不住。且 CSS 层本就开放，组件要特殊化直接类名覆盖即可。

### 4.7 业务 token 出库

删除 `--fnb-bookmark`（`#ff69b4`，Pixiv 收藏色）。基础 spec §7 已确立业务 token 不进库，此处执行。PixivNow 迁移时在项目侧自行声明。

### 4.8 主题预设

`src/themes/index.ts` 导出 `pixivTheme` / `picaTheme` 等预设对象。同一份预设两用：传给 `FnbProvider`（动态），或由脚本生成 CSS 片段直接引入（静态）。

---

## 5. 尺寸系统

**本章是本期的核心质量目标：任一 size 下，所有控件默认值互相对齐、开箱即生产可用。使用方不应为对齐而调整任何尺寸。**

### 5.1 问题实证

dist 实测（Chromium，16px 根字号）：

| 组件 | 实测高度 | naive-ui 对应档 | Ant Design 对应档 |
|---|---|---|---|
| `FnbButton` sm | 35.8px | small 28 | small 24 |
| `FnbButton` md | **52.5px** | medium 34 | middle 32 |
| `FnbButton` lg | 62.5px | large 40 | large 40 |
| `FnbInput` | **42.5px** | — | — |
| `FnbTag` | 27.8px | — | — |

三项症状：

1. **整个 scale 上偏一档以上**：`md` 52.5px 比 Ant Design 的 `large`(40px) 还大 12.5px。
2. **同档不对齐**：`Button md` 52.5px 与 `Input` 42.5px 相差 10px，并排必然错位。
3. **生产中默认值是少数派**：PixivNow 的 36 个 `FnbButton` 里 **24 个显式写 `size='sm'`**（占三分之二）。

后果见 PixivNow `SiteHeader.vue` 的搜索胶囊——为把 `FnbSelect` + `FnbInput` 拼在一起，使用方把两个组件的样式**几乎全部拆光再重贴**：

```scss
.fnb-select-trigger {
  border: none; box-shadow: none;      // 拆掉组件边框与阴影
  border-right: 2px solid …;            // 手动补分隔线
  background: transparent;
  height: 100%;                         // 强行拉高对齐 ← 无统一 control-height 的直接后果
  &:hover { transform: none }           // 拆掉按压动效
}
```

### 5.2 control height 锚定

新增尺寸 token，**同一 size 下所有单行控件共用同一高度**：

| size | `--fnb-control-h-*` | font-size | padding-inline | border-width |
|---|---|---|---|---|
| sm | **28px** | 13px | 10px | 2px |
| md（默认） | **36px** | 14px | 14px | 3px |
| lg | **44px** | 16px | 18px | 3px |

**`md = 36px` 取自真实生产**：PixivNow 三分之二的按钮实际选用的 `size='sm'` 实测 35.8px，取整到 4px 基数即 36px。默认值直接对齐两个项目已经跑了很久的那个尺寸，而非另拍一个数。

已验证：该 scale 下 `Button md` 与 `Input md` 实测均为 36.0px。

### 5.3 实现约束

- **单行控件用显式 `height: var(--fnb-control-h-*)` + `padding-inline`，禁止用 `padding-block` 撑高。** 靠 padding 撑高会因各组件字号与 `line-height: normal` 的差异产生偏移——这正是当前 Button 与 Input 差 10px 的病根。
- `box-sizing: border-box`，border 计入高度。
- 图标槽位用 `1em` 相对字号，不得额外撑高行。
- **适用**：Button、Input、Select、Pagination 按钮等单行控件。
- **不适用**：Tag（标记而非控件，独立档 ~24px）、Card / Alert / Table 等容器与多行内容组件。

### 5.4 组合拼接：`.fnb-input-group`

库需提供拼接的一等支持，消灭 §5.1 那种拆解重组。

```pug
.fnb-input-group
  FnbSelect(…)
  FnbInput(…)
  FnbButton(variant='primary') 搜索
```

`.fnb-input-group` 的职责：

- 成员共享相邻边（相邻项 `margin-inline-start: calc(-1 * var(--fnb-border-width))`）
- 成员各自的 `box-shadow` 归零，由 group 统一施加一次
- 成员的按压位移（`fnb-press`）在组内禁用，避免拼接处裂开
- 高度由 group 的 size 决定，成员继承

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

| 类别 | 组件 | 职责 |
|---|---|---|
| 骨架 | `FnbLayout` | 纵向 flex 容器，`min-height: 100vh` |
| | `FnbHeader` | sticky + 三槽（left/center/right）+ 滚动隐藏 |
| | `FnbSider` | 抽屉 + 遮罩 + 滚动锁，`v-model:open` |
| | `FnbFooter` | 页脚容器 |
| 配件 | `FnbBrand` / `FnbNav` / `FnbNavLink` | 导航现成件 |
| 基础件 | `FnbDropdown` | 新增。触发器 + 浮层 + click-outside |
| 全局件 | `FnbBackToTop` | 基于已有 `FnbFloatButton` 薄封装 + 滚动阈值 |
| | `FnbLoadingBar` | 顶部加载指示条，**自实现替换 `nprogress`**（见 §7.3） |
| | `FnbLink` | 统一链接件，`external` 为语法糖（见 §7.4） |
| composable | `useScrollDirection` / `useScrollLock` | 行为复用 |

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

### 7.5 布局层的 CSS/JS 分界

布局件是本库唯一带显著行为的一层。分界：`layout.css` 提供全部外观与**状态类**（`.fnb-sider--open`、`.fnb-header--hidden`、`.fnb-header--not-at-top`），Vue 只负责在正确时机切换这些类。非 Vue 使用者自行切类即可获得同样效果。

### 7.6 修复 Teleport 主题逃逸

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
7. `FnbLink` 同时传 `external` 与自定义 `suffix-icon` 时，图标被覆盖而 `target` / `rel` 仍生效（正交性）。
8. `tokens.css` 中不含任何 breakpoint 变量；SCSS 变量与 TS 常量各生成一份且取值一致。
9. **尺寸对齐**：同一 size 下 `FnbButton` / `FnbInput` / `FnbSelect` 的 `getBoundingClientRect().height` 完全相等，sm/md/lg 三档均需通过。
10. **组合零覆盖**：`.fnb-input-group` 包裹 Select + Input + Button 后，不写任何额外 CSS 即得到与 PixivNow 现有搜索胶囊等效的外观。
