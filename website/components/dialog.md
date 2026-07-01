# Dialog

A promise-based confirm dialog. `useDialog().confirm(...)` resolves `true` on
the positive action and `false` on cancel / overlay / close.

<demo vue="../demos/dialog-basic.vue" />

## API

```ts
const dialog = useDialog()

const ok = await dialog.confirm({
  title: 'Delete item?',
  content: 'This action cannot be undone.',
  positiveText: 'Delete', // default '确定'
  negativeText: 'Cancel', // omit to hide the cancel button
})
```

`useDialog()` throws if no `<FnbDialogProvider>` is above it. Only one dialog
shows at a time; opening a new one resolves the previous as `false`.
