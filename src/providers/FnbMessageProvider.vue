<template lang="pug">
slot
Teleport(to='body')
  TransitionGroup.fnb-message-container(name='fnb-message', tag='div')
    .fnb-message(
      v-for='m in messages',
      :key='m.id',
      :class='`fnb-message--${m.type}`',
      role='alert'
    ) {{ m.content }}
</template>

<script lang="ts" setup>
import { onUnmounted, provide, reactive } from 'vue'
import { fnbMessageKey } from './message-context'
import type {
  FnbMessageApi,
  FnbMessageHandle,
  FnbMessageOptions,
  FnbMessageType,
} from './message-context'

interface MessageItem {
  id: number
  content: string
  type: FnbMessageType
}

const messages = reactive<MessageItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 0

function remove(id: number) {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
  const i = messages.findIndex((m) => m.id === id)
  if (i !== -1) messages.splice(i, 1)
}

function create(
  content: string,
  type: FnbMessageType,
  options?: FnbMessageOptions
): FnbMessageHandle {
  const id = nextId++
  messages.push({ id, content, type })
  const duration = options?.duration ?? 3000
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => remove(id), duration)
    )
  }
  return { destroy: () => remove(id) }
}

const api: FnbMessageApi = {
  info: (content, options) => create(content, 'info', options),
  success: (content, options) => create(content, 'success', options),
  warning: (content, options) => create(content, 'warning', options),
  error: (content, options) => create(content, 'error', options),
}

provide(fnbMessageKey, api)

// Clear any pending auto-dismiss timers on provider teardown.
onUnmounted(() => {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-message-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.fnb-message {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  max-width: 80vw;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  pointer-events: auto;

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }

  &--warning {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }

  &--error {
    background: var(--fnb-danger);
    color: var(--fnb-on-brand);
  }
}

.fnb-message-enter-active,
.fnb-message-leave-active {
  transition:
    transform 250ms ease-out,
    opacity 250ms ease-out;
}

.fnb-message-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fnb-message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
