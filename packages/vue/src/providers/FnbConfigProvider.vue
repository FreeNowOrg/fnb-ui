<template lang="pug">
.fnb-config-provider(:class='{ dark: mergedDark }', :style='cssVars')
  slot
</template>

<script lang="ts" setup>
import { computed, inject, provide } from 'vue'
import type { CSSProperties } from 'vue'
import { fnbConfigKey } from './config-context'
import type { FnbThemeOverrides } from './config-context'

const props = defineProps<{
  themeOverrides?: FnbThemeOverrides
  dark?: boolean
}>()

const parent = inject(fnbConfigKey, null)

// Child overrides win; missing keys inherit from a parent provider.
const mergedOverrides = computed<FnbThemeOverrides>(() => ({
  ...parent?.themeOverrides.value,
  ...props.themeOverrides,
}))

const mergedDark = computed(() => props.dark ?? parent?.dark.value ?? false)

const cssVars = computed<CSSProperties>(() => {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(mergedOverrides.value)) {
    vars[`--fnb-${key}`] = value
  }
  return vars as CSSProperties
})

provide(fnbConfigKey, {
  themeOverrides: mergedOverrides,
  dark: mergedDark,
})
</script>
