<template lang="pug">
input.fnb-input(
  :class='[`fnb-input--${size}`, { "fnb-input--disabled": disabled }]',
  :disabled='disabled',
  :placeholder='placeholder',
  :readonly='readonly',
  :type='type',
  :value='modelValue',
  @input='onInput'
)
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    type?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    type: 'text',
    size: 'md',
  }
)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>
