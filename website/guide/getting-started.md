# Getting Started

## Installation

```sh
pnpm add @fnb-ui/core @fnb-ui/vue
```

`vue` (^3.5) is a peer dependency.

Styles and framework bindings ship separately — CSS is the core product,
the framework binding is a thin wrapper around it. `@fnb-ui/vue` ships no
CSS of its own; the stylesheet always comes from `@fnb-ui/core`.

## Global registration

Install the plugin to register every component, and import the stylesheet once:

```ts
import { createApp } from 'vue'
import '@fnb-ui/core/style.css'
import FnbUI from '@fnb-ui/vue'
import App from './App.vue'

createApp(App).use(FnbUI).mount('#app')
```

Not using Vue? Link the stylesheet directly to get the full look with zero JS:

```html
<link rel="stylesheet" href="node_modules/@fnb-ui/core/dist/style.css" />
<button class="fnb-button fnb-button--primary">Button</button>
```

## Providers & hooks

`useMessage()` and `useDialog()` require a provider above them. Wrap your app
in `<FnbProvider>` (which bundles the config, message, and dialog providers):

```vue
<template>
  <FnbProvider>
    <RouterView />
  </FnbProvider>
</template>
```

Then call the hooks from any descendant:

```ts
import { useMessage, useDialog } from '@fnb-ui/vue'

const message = useMessage()
const dialog = useDialog()

message.success('Saved!')

const ok = await dialog.confirm({
  title: 'Delete item?',
  content: 'This cannot be undone.',
  positiveText: 'Delete',
  negativeText: 'Cancel',
})
```

## Theming

All colors and surfaces come from `--fnb-*` CSS variables. Override them
globally on `:root` / `.dark`, or scope overrides to a subtree with
`<FnbConfigProvider :theme-overrides="{ brand: '#ff5577' }">`.
