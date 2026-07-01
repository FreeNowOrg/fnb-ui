# Message

A lightweight, auto-dismissing toast. Call `useMessage()` from any component
under an `<FnbMessageProvider>` (bundled into `<FnbProvider>`).

<demo vue="../demos/message-basic.vue" />

## API

```ts
const message = useMessage()

message.info('…')
message.success('…')
message.warning('…')
message.error('…')

// Optional duration (ms); 0 keeps it sticky. Returns a handle.
const handle = message.success('Saved', { duration: 5000 })
handle.destroy()
```

`useMessage()` throws if no `<FnbMessageProvider>` is above it.
