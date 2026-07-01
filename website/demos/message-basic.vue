<script setup lang="ts">
import { FnbButton, useMessage } from 'fnb-ui'

// Works because the docs site is wrapped in <FnbProvider>.
const message = useMessage()
</script>

<template>
  <div style="display: flex; gap: 12px; flex-wrap: wrap">
    <FnbButton @click="message.info('Just so you know.')">Info</FnbButton>
    <FnbButton variant="success" @click="message.success('Saved!')">
      Success
    </FnbButton>
    <FnbButton variant="primary" @click="message.warning('Heads up.')">
      Warning
    </FnbButton>
    <FnbButton variant="danger" @click="message.error('Something broke.')">
      Error
    </FnbButton>
  </div>
</template>
