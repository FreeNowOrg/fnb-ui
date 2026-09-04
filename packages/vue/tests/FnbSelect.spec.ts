import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSelect } from '../src'

const options = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

describe('FnbSelect', () => {
  it('shows the selected option label', () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'dark' } })
    expect(w.text()).toContain('Dark')
  })

  it('opens the listbox on trigger click and lists options', async () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'light' } })
    await w.find('.fnb-select__trigger').trigger('click')
    expect(w.text()).toContain('Light')
    expect(w.text()).toContain('Dark')
  })

  it('emits update:modelValue when an option is chosen', async () => {
    const w = mount(FnbSelect, { props: { options, modelValue: 'light' } })
    await w.find('.fnb-select__trigger').trigger('click')
    const darkOption = w
      .findAll('.fnb-select__option')
      .find((n) => n.text().includes('Dark'))!
    await darkOption.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['dark']])
  })
})
