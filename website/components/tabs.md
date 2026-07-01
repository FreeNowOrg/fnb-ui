# Tabs

`FnbTabs` + `FnbTabPane` are compositional: drop panes inside the tabs and they
self-register. Each pane's `tab` prop (or `#tab` slot) drives its nav button.

## Controlled

Bind `v-model:value` to drive the active tab.

<demo vue="../demos/tabs-basic.vue" />

## Uncontrolled · segment · small

Without `v-model`, the tabs keep their own active state. `type="segment"` gives
the boxed nav; `size` adjusts density.

<demo vue="../demos/tabs-segment.vue" />

## Props

### FnbTabs

| Prop    | Type                                | Default    |
| ------- | ----------------------------------- | ---------- |
| `value` | `string` (v-model:value)            | —          |
| `type`  | `'line' \| 'segment'`               | `'line'`   |
| `size`  | `'small' \| 'medium' \| 'large'`    | `'medium'` |

### FnbTabPane

| Prop   | Type     | Notes                              |
| ------ | -------- | ---------------------------------- |
| `name` | `string` | required; identifies the pane      |
| `tab`  | `string` | nav label (or use the `#tab` slot) |
