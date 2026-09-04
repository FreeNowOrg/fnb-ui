<template lang="pug">
.fnb-result
  .fnb-result__status {{ statusEmoji }}
  .fnb-result__title(v-if='title') {{ title }}
  .fnb-result__description(v-if='description') {{ description }}
  .fnb-result__footer(v-if='$slots.footer')
    slot(name='footer')
  slot
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status?:
      'warning' | '500' | 'error' | 'info' | 'success' | '404' | '403' | '418'
    title?: string
    description?: string
  }>(),
  {
    status: 'warning',
  }
)

const statusEmoji = computed(() => {
  const map: Record<string, string> = {
    warning: '⚠',
    '500': '500',
    error: '✗',
    info: 'ℹ',
    success: '✓',
    '404': '404',
    '403': '403',
    '418': '418',
  }
  return map[props.status] || props.status
})
</script>
