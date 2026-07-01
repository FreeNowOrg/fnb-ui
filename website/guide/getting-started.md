# Getting Started

## Installation

```sh
pnpm add fnb-ui
```

`vue` (^3.5) is a peer dependency.

## Global registration

Install the plugin to register every component, and import the stylesheet once:

```ts
import { createApp } from 'vue'
import FnbUI from 'fnb-ui'
import 'fnb-ui/style.css'
import App from './App.vue'

createApp(App).use(FnbUI).mount('#app')
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
import { useMessage, useDialog } from 'fnb-ui'

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
