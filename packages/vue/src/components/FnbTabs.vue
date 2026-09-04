<template lang="pug">
.fnb-tabs(:class='[`fnb-tabs--${type}`, `fnb-tabs--${size}`]')
  .fnb-tabs__nav(role='tablist')
    button.fnb-tabs__tab(
      v-for='pane in panes',
      :key='pane.name',
      type='button',
      role='tab',
      :aria-selected='pane.name === activeName',
      :class='{ "fnb-tabs__tab--active": pane.name === activeName }',
      @click='select(pane.name)'
    )
      component(v-if='pane.tabSlot', :is='{ render: pane.tabSlot }')
      template(v-else) {{ pane.tab ?? pane.name }}
  .fnb-tabs__panels
    slot
</template>

<script lang="ts" setup>
import { computed, provide, reactive, ref } from 'vue'
import { fnbTabsKey } from './tabs-context'
import type { FnbTabPaneInfo } from './tabs-context'

const props = withDefaults(
  defineProps<{
    value?: string
    type?: 'line' | 'segment'
    size?: 'small' | 'medium' | 'large'
  }>(),
  { type: 'line', size: 'medium' }
)

const emit = defineEmits<{ 'update:value': [value: string] }>()

// Panes self-register in slot/mount order.
const panes = reactive<FnbTabPaneInfo[]>([])

// Internal fallback for uncontrolled usage (no v-model:value bound).
const uncontrolledValue = ref<string>()

const activeName = computed(
  () => props.value ?? uncontrolledValue.value ?? panes[0]?.name
)

function select(name: string) {
  if (name === activeName.value) return
  uncontrolledValue.value = name
  emit('update:value', name)
}

provide(fnbTabsKey, {
  activeName,
  registerPane(pane) {
    if (!panes.some((p) => p.name === pane.name)) panes.push(pane)
  },
  unregisterPane(name) {
    const i = panes.findIndex((p) => p.name === name)
    if (i !== -1) panes.splice(i, 1)
  },
})
</script>
