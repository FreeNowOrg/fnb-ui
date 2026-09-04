<template lang="pug">
.fnb-ellipsis(:style='ellipsisStyle')
  slot
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    lineClamp?: number
  }>(),
  {
    lineClamp: 1,
  }
)

const ellipsisStyle = computed<CSSProperties>(() => ({
  display: '-webkit-box',
  '-webkit-line-clamp': props.lineClamp,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
}))
</script>
