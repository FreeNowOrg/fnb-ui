# @fnb-ui/core

> **F**ree **N**eu**b**rutalism — the stylesheet is the product.

Hard borders, offset shadows, zero radius. One framework-agnostic stylesheet
plus the design tokens behind it. No JavaScript required to use any of it.

```bash
npm i @fnb-ui/core
```

## Plain HTML

Import the stylesheet once and write the class names. Nothing else to set up.

```html
<link rel="stylesheet" href="node_modules/@fnb-ui/core/dist/style.css" />

<button class="fnb-button fnb-button--primary">Search</button>
<input class="fnb-input" placeholder="Query" />
<span class="fnb-tag">original</span>
```

Or from a bundler:

```js
import '@fnb-ui/core/style.css'
```

## Theming

Every value is a `--fnb-*` custom property. Semantic colours derive from the
brand colour, so a new palette is a couple of declarations — including the hard
shadow in dark mode.

```css
:root {
  --fnb-brand: #ff5c8a;
}
```

Dark mode hangs off a bare `.dark` class on any ancestor, matching the
convention Tailwind and Nuxt color-mode already use.

## Two dimensions, kept apart

- `--fnb-control-*` is **size**: height, font-size, padding-inline. Every
  single-line control reads the same three variables, so a button and a field
  at the same size are the same height with no per-use tweaking.
- `--fnb-weight-*` is **visual weight**: border width and shadow offset, always
  moving together. The tier is chosen by element type, not by size — a Tag
  stays light at every size.

## Tokens in TypeScript

```js
import { tokens, breakpoints } from '@fnb-ui/core'
```

Breakpoints are deliberately not emitted as CSS variables:
`@media (min-width: var(--x))` silently never matches.

## Vue

`@fnb-ui/vue` is a thin wrapper around this package — components, and the bits
that genuinely need JavaScript (dialog, message, pagination).

Full docs: <https://github.com/FreeNowOrg/fnb-ui>
