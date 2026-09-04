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

<style scoped lang="scss">
@use '../styles/fnb' as *;

.fnb-tabs__nav {
  display: flex;
  gap: 3px;
}

.fnb-tabs__tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  color: var(--fnb-text-muted);
  background: transparent;
  border: 3px solid transparent;
  cursor: pointer;
  transition:
    color 150ms,
    background 150ms;

  &:hover:not(.fnb-tabs__tab--active) {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &--active {
    color: var(--fnb-on-brand);
    font-weight: 900;
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}

.fnb-tabs__panels {
  margin-top: 1rem;
}

// segment: boxed equal-width nav (the PixivNow look)
.fnb-tabs--segment .fnb-tabs__nav {
  @include fnb-border;
  padding: 3px;
  background: var(--fnb-surface);
}

// line: underline-style nav
.fnb-tabs--line {
  .fnb-tabs__nav {
    border-bottom: 3px solid var(--fnb-border);
    gap: 0;
  }

  .fnb-tabs__tab {
    flex: 0 0 auto;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -3px;

    &--active {
      color: var(--fnb-brand);
      background: transparent;
      border-bottom-color: var(--fnb-brand);
    }

    &:hover:not(.fnb-tabs__tab--active) {
      background: transparent;
      color: var(--fnb-text);
    }
  }
}

// sizes
.fnb-tabs--small .fnb-tabs__tab {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.fnb-tabs--large .fnb-tabs__tab {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}
</style>
