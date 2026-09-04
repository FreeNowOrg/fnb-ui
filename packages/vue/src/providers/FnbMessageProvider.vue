<template lang="pug">
slot
Teleport(to='body')
  TransitionGroup.fnb-message-container(
    name='fnb-message',
    tag='div',
    :class='themeClass',
    :style='themeStyle'
  )
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
import { useThemeScope } from './useThemeScope'

interface MessageItem {
  id: number
  content: string
  type: FnbMessageType
}

const messages = reactive<MessageItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 0
const { themeClass, themeStyle } = useThemeScope()

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
