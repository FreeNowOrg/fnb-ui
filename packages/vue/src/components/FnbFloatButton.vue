<template lang="pug">
.fnb-float-button(:style='positionStyle')
  button.fnb-float-button__main(
    @click='$emit("click", $event)',
    v-bind='$attrs'
  )
    slot
  .fnb-float-button__menu(v-if='$slots.menu')
    slot(name='menu')
</template>

<script lang="ts" setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

defineEmits<{
  click: [event: Event]
}>()

const props = defineProps<{
  bottom?: number
  right?: number
}>()

const positionStyle = computed(() => ({
  bottom: props.bottom ? `${props.bottom}px` : undefined,
  right: props.right ? `${props.right}px` : undefined,
}))
</script>
