<template lang="pug">
.fnb-scrollbar(:class='{ "fnb-scrollbar--x": xScrollable }')
  slot
</template>

<script lang="ts" setup>
defineProps<{
  xScrollable?: boolean
}>()
</script>
