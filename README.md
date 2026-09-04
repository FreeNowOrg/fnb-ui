# fnb-ui

> **F**ree **N**eu**b**rutalism — a CSS-first design system.

The design system behind [FreeNowOrg](https://github.com/FreeNowOrg) projects —
first introduced in
[PicaComicNow](https://github.com/FreeNowOrg/PicaComicNow) and since carried into
[PixivNow](https://github.com/FreeNowOrg/PixivNow) and sibling apps. Hard shadows,
zero radius, `Archivo Black` display type — themeable entirely through `--fnb-*`
CSS custom properties.

**The stylesheet is the product.** `@fnb-ui/core` is a framework-agnostic
stylesheet plus its design tokens: every component's appearance comes from
plain `.fnb-*` classes that any framework, or none, can put on an element.
`@fnb-ui/vue` is a thin binding layer on top — Vue components with a
naive-ui-aligned API that ship no CSS of their own.

> 🚧 Early development. Design specs live under `docs/superpowers/specs/`.

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

## License

[MIT](./LICENSE) © FreeNowOrg
