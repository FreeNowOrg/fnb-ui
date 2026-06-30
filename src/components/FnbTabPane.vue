<template lang="pug">
.fnb-tabs__panel(v-show='isActive', role='tabpanel')
  slot
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, useSlots } from 'vue'
import { fnbTabsKey } from './tabs-context'

const props = defineProps<{ name: string; tab?: string }>()
const slots = useSlots()

const ctx = inject(fnbTabsKey, null)
if (!ctx) {
  throw new Error('[fnb-ui] FnbTabPane must be used inside FnbTabs')
}

const isActive = computed(() => ctx.activeName.value === props.name)

onMounted(() => {
  ctx.registerPane({ name: props.name, tab: props.tab, tabSlot: slots.tab })
})
onBeforeUnmount(() => {
  ctx.unregisterPane(props.name)
})
</script>
