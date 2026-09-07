<template lang="pug">
.fnb-select(
  :class='[`fnb-select--${size}`, { "fnb-select--open": open }]',
  ref='rootEl'
)
  button.fnb-select__trigger(
    @click='open = !open',
    @keydown='onTriggerKeydown',
    type='button',
    role='combobox',
    :aria-expanded='open',
    aria-haspopup='listbox',
    :aria-activedescendant='open ? `fnb-opt-${modelValue}` : undefined'
  )
    span.fnb-select__label {{ currentLabel }}
    span.fnb-select__arrow(:class='{ "fnb-select__arrow--flipped": open }') ▼
  Transition(name='fnb-select__dropdown')
    ul.fnb-select__dropdown(v-if='open', role='listbox')
      li.fnb-select__option(
        v-for='(opt, i) in options',
        :key='opt.value',
        :id='`fnb-opt-${opt.value}`',
        :class='{ "fnb-select__option--selected": opt.value === modelValue, "fnb-select__option--focused": i === focusedIndex }',
        :aria-selected='opt.value === modelValue',
        role='option',
        @click='select(opt.value)'
      ) {{ opt.label }}
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    options: { label: string; value: string }[]
    modelValue: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const focusedIndex = ref(-1)
const rootEl = ref<HTMLElement | null>(null)

const currentLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt?.label ?? props.modelValue
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  focusedIndex.value = -1
}

function onTriggerKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value) {
        open.value = true
        focusedIndex.value = props.options.findIndex(
          (o) => o.value === props.modelValue
        )
        if (focusedIndex.value === -1) focusedIndex.value = 0
      } else {
        moveFocus(e.key === 'ArrowDown' ? 1 : -1)
      }
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (open.value && focusedIndex.value >= 0) {
        select(props.options[focusedIndex.value]!.value)
      } else {
        open.value = !open.value
        if (open.value) {
          focusedIndex.value = props.options.findIndex(
            (o) => o.value === props.modelValue
          )
          if (focusedIndex.value === -1) focusedIndex.value = 0
        }
      }
      break
    case 'Escape':
      e.preventDefault()
      open.value = false
      focusedIndex.value = -1
      break
  }
}

function moveFocus(delta: number) {
  const len = props.options.length
  if (!len) return
  focusedIndex.value = (focusedIndex.value + delta + len) % len
}

function onDocPointerDown(e: PointerEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
    focusedIndex.value = -1
  }
}
onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', onDocPointerDown)
)
</script>
