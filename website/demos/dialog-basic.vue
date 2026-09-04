<script setup lang="ts">
import { FnbButton, useDialog, useMessage } from '@fnb-ui/vue'

const dialog = useDialog()
const message = useMessage()

async function onDelete() {
  const ok = await dialog.confirm({
    title: 'Delete item?',
    content: 'This action cannot be undone.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
  })
  if (ok) message.success('Deleted.')
  else message.info('Cancelled.')
}
</script>

<template>
  <FnbButton variant="danger" @click="onDelete">Delete…</FnbButton>
</template>
