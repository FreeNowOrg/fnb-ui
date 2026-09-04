<template lang="pug">
.fnb-spin(:class='{ "fnb-spin--active": show }')
  slot
  .fnb-spin__overlay(v-if='show')
    svg.spin(viewBox='0 0 24 24', :width='spinnerSize', :height='spinnerSize')
      circle(
        cx='12',
        cy='12',
        r='10',
        fill='none',
        stroke='currentColor',
        stroke-width='3',
        stroke-dasharray='31.4 31.4',
        stroke-linecap='round'
      )
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    show?: boolean
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    size: 'medium',
  }
)

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small':
      return '16'
    case 'large':
      return '40'
    default:
      return '24'
  }
})
</script>
