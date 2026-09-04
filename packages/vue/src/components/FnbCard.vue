<template lang="pug">
.fnb-card(:class='[`fnb-card--${color}`, `fnb-card--shadow-${shadow}`]')
  slot
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    color?: 'white' | 'brand' | 'highlight' | 'success'
    shadow?: 'sm' | 'md' | 'lg' | 'none'
  }>(),
  {
    color: 'white',
    shadow: 'md',
  }
)
</script>
