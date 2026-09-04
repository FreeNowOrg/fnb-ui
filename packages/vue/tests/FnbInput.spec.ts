import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbInput } from '../src'

describe('FnbInput', () => {
  it('renders an input reflecting modelValue', () => {
    const w = mount(FnbInput, { props: { modelValue: 'hello' } })
    expect(w.find('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const w = mount(FnbInput, { props: { modelValue: '' } })
    const input = w.find('input')
    input.element.value = 'world'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toEqual([['world']])
  })

  it('forwards type, placeholder, disabled, readonly to the input', () => {
    const w = mount(FnbInput, {
      props: {
        type: 'password',
        placeholder: 'pw',
        disabled: true,
        readonly: true,
      },
    })
    const el = w.find('input').element
    expect(el.type).toBe('password')
    expect(el.placeholder).toBe('pw')
    expect(el.disabled).toBe(true)
    expect(el.readOnly).toBe(true)
  })
})
