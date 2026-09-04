<template lang="pug">
template(v-if='repeat > 1')
  span.fnb-skeleton(
    v-for='i in repeat',
    :key='i',
    :class='classes',
    :style='sizeStyle'
  )
span.fnb-skeleton(v-else, :class='classes', :style='sizeStyle')
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    circle?: boolean
    block?: boolean
    text?: boolean
    repeat?: number
  }>(),
  {
    repeat: 1,
  }
)

const classes = computed(() => ({
  'fnb-skeleton--circle': props.circle,
  'fnb-skeleton--block': props.block,
  'fnb-skeleton--text': props.text,
}))

const sizeStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>
