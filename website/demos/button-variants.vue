<script setup lang="ts">
import { FnbButton } from '@fnb-ui/vue'
</script>

<template>
  <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
    <FnbButton>Default</FnbButton>
    <FnbButton variant="primary">Primary</FnbButton>
    <FnbButton variant="success">Success</FnbButton>
    <FnbButton variant="danger">Danger</FnbButton>
    <FnbButton variant="primary" loading>Loading</FnbButton>
    <FnbButton variant="primary" disabled>Disabled</FnbButton>
  </div>
</template>
