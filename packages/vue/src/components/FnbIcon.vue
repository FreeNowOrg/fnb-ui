<template lang="pug">
i.fnb-icon(aria-hidden='true', :style='iconStyle', v-bind='$attrs')
  component(v-if='component', :is='component')
  slot(v-else)
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  size?: number | string
  color?: string
  component?: Component
}>()

// Number sizes become px; string sizes pass through. Unset -> inherit 1em.
const iconStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color,
}))
</script>

<style scoped lang="scss">
.fnb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  width: 1em;
  height: 1em;
  line-height: 1;
  // Default fill for icon sets that rely on currentColor. Stroke-based sets
  // (tabler) keep their own fill="none" attribute, which wins over this.
  fill: currentColor;
  vertical-align: -0.125em;

  > svg,
  > img {
    width: 1em;
    height: 1em;
  }
}
</style>
