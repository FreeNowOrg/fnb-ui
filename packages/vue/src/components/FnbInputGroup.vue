<template lang="pug">
.fnb-input-group(:class='size !== "md" ? `fnb-input-group--${size}` : undefined')
  slot
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
</script>
