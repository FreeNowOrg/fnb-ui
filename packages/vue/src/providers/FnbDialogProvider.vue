<template lang="pug">
slot
Teleport(to='body')
  Transition(name='fnb-dialog')
    .fnb-dialog-overlay(
      v-if='state',
      :class='themeClass',
      :style='themeStyle',
      @click.self='resolve(false)'
    )
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
import { onUnmounted, provide, ref, watch } from 'vue'
import { lockScroll } from '@fnb-ui/core'
import FnbButton from '../components/FnbButton.vue'
import { fnbDialogKey } from './dialog-context'
import type { FnbDialogApi, FnbDialogOptions } from './dialog-context'
import { useThemeScope } from './useThemeScope'

interface DialogState extends FnbDialogOptions {
  resolve: (value: boolean) => void
}

const state = ref<DialogState | null>(null)
const { themeClass, themeStyle } = useThemeScope()

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

// Lock body scroll while a dialog is open. `release` is null when no lock is held.
let release: (() => void) | null = null
watch(
  () => state.value !== null,
  (open) => {
    if (open) {
      release = lockScroll()
    } else {
      release?.()
      release = null
    }
  }
)

// Restore body scroll if the provider unmounts while a dialog is open.
onUnmounted(() => {
  release?.()
  release = null
})
</script>
