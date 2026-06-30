<template lang="pug">
slot
Teleport(to='body')
  Transition(name='fnb-dialog')
    .fnb-dialog-overlay(v-if='state', @click.self='resolve(false)')
      .fnb-dialog(role='dialog', aria-modal='true')
        button.fnb-dialog__close(
          type='button',
          aria-label='关闭',
          @click='resolve(false)'
        ) ×
        .fnb-dialog__header {{ state.title }}
        .fnb-dialog__body {{ state.content }}
        .fnb-dialog__footer
          FnbButton(v-if='state.negativeText', @click='resolve(false)') {{ state.negativeText }}
          FnbButton(variant='primary', @click='resolve(true)') {{ state.positiveText ?? '确定' }}
</template>

<script lang="ts" setup>
import { provide, ref, watch } from 'vue'
import FnbButton from '../components/FnbButton.vue'
import { fnbDialogKey } from './dialog-context'
import type { FnbDialogApi, FnbDialogOptions } from './dialog-context'

interface DialogState extends FnbDialogOptions {
  resolve: (value: boolean) => void
}

const state = ref<DialogState | null>(null)

function resolve(value: boolean) {
  state.value?.resolve(value)
  state.value = null
}

const api: FnbDialogApi = {
  confirm(options) {
    // Resolve any currently-open dialog as cancelled before opening a new one.
    state.value?.resolve(false)
    return new Promise<boolean>((res) => {
      state.value = { ...options, resolve: res }
    })
  },
}

provide(fnbDialogKey, api)

// Lock body scroll while a dialog is open.
watch(
  () => state.value !== null,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog {
  @include fnb-border;
  @include fnb-shadow-lg;
  position: relative;
  width: 400px;
  max-width: 86vw;
  max-height: 80vh;
  overflow: auto;
  padding: 1.5rem;
  background: var(--fnb-surface);
  color: var(--fnb-text);

  &__close {
    position: absolute;
    top: 0.5rem;
    right: 0.75rem;
    font-size: 1.5rem;
    line-height: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--fnb-text-muted);
  }

  &__header {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  &__body {
    color: var(--fnb-text);
    margin-bottom: 1.5rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
}

.fnb-dialog-enter-active,
.fnb-dialog-leave-active {
  transition: opacity 200ms ease;
}

.fnb-dialog-enter-active .fnb-dialog,
.fnb-dialog-leave-active .fnb-dialog {
  transition: transform 200ms ease;
}

.fnb-dialog-enter-from,
.fnb-dialog-leave-to {
  opacity: 0;
}

.fnb-dialog-enter-from .fnb-dialog {
  transform: scale(0.9) translateY(10px);
}

.fnb-dialog-leave-to .fnb-dialog {
  transform: scale(0.95);
}
</style>
