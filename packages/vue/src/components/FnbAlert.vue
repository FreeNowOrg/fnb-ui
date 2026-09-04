<template lang="pug">
.fnb-alert(:class='`fnb-alert--${type}`')
  .fnb-alert__header(v-if='header || $slots.header')
    slot(name='header') {{ header }}
  .fnb-alert__body
    slot
  button.fnb-alert__close(
    v-if='closable',
    @click='$emit("close")',
    aria-label='关闭'
  ) ×
</template>

<script lang="ts" setup>
defineEmits<{
  close: []
}>()

withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    header?: string
    closable?: boolean
  }>(),
  {
    type: 'info',
  }
)
</script>
