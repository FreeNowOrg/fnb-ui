<template lang="pug">
.fnb-progress
  .fnb-progress__track
    .fnb-progress__fill(:style='fillStyle')
  .fnb-progress__label(v-if='showValue') {{ Math.round(percentage) }}%
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percentage?: number
    color?: string
    height?: number
    showValue?: boolean
  }>(),
  {
    percentage: 0,
    height: 6,
  }
)

const fillStyle = computed(() => ({
  width: `${Math.min(100, Math.max(0, props.percentage))}%`,
  backgroundColor: props.color || 'var(--fnb-brand)',
  height: `${props.height}px`,
}))
</script>
