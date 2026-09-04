<template lang="pug">
FnbConfigProvider(:theme-overrides='themeOverrides', :dark='dark')
  FnbMessageProvider
    FnbDialogProvider
      slot
</template>

<script lang="ts" setup>
import FnbConfigProvider from './FnbConfigProvider.vue'
import FnbMessageProvider from './FnbMessageProvider.vue'
import FnbDialogProvider from './FnbDialogProvider.vue'
import type { FnbThemeOverrides } from './config-context'

defineProps<{
  themeOverrides?: FnbThemeOverrides
  dark?: boolean
}>()
</script>
