# @fnb-ui/vue

> Vue 3 bindings for [`@fnb-ui/core`](https://www.npmjs.com/package/@fnb-ui/core).

A thin wrapper. The styling all lives in `@fnb-ui/core`; these components add
the behaviour that genuinely needs JavaScript — dialogs, messages, pagination,
the select's keyboard handling — and ship no CSS of their own.

```bash
npm i @fnb-ui/vue
```

## Usage

The stylesheet is not imported for you: import it once, wherever you set up
your app.

```js
import { createApp } from 'vue'
import '@fnb-ui/core/style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

Then import components where you use them:

```vue
<script setup>
import { FnbButton, FnbInput, FnbInputGroup, FnbSelect } from '@fnb-ui/vue'
import { ref } from 'vue'

const scope = ref('artworks')
const query = ref('')
</script>

<template>
  <FnbInputGroup>
    <FnbSelect v-model="scope" :options="options" />
    <FnbInput v-model="query" placeholder="Search" />
    <FnbButton variant="primary">Search</FnbButton>
  </FnbInputGroup>
</template>
```

`FnbInputGroup` joins its members into one pill — shared borders, one shadow —
with no override CSS in the consumer.

## Providers

`FnbProvider` wires up the imperative pieces. Put it once near the root:

```vue
<FnbProvider>
  <RouterView />
</FnbProvider>
```

It composes `FnbConfigProvider` (theme scope), `FnbDialogProvider` and
`FnbMessageProvider`. Theme overrides are injected into the provider's own
scope, never onto `document.documentElement`, so nesting works and a host page
is left alone.

## Requirements

Vue `^3.5.0`.

Full docs: <https://github.com/FreeNowOrg/fnb-ui>
