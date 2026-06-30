import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbFloatButton } from '../src'

describe('FnbFloatButton', () => {
  it('renders default slot and emits click', async () => {
    const w = mount(FnbFloatButton, { slots: { default: '+' } })
    expect(w.text()).toContain('+')
    await w.find('button').trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('renders the menu slot', () => {
    const w = mount(FnbFloatButton, {
      slots: { menu: '<a class="m">menu-item</a>' },
    })
    expect(w.find('a.m').exists()).toBe(true)
  })

  it('applies bottom/right as inline px positions', () => {
    const w = mount(FnbFloatButton, { props: { bottom: 40, right: 20 } })
    const html = w.html()
    expect(html).toContain('bottom: 40px')
    expect(html).toContain('right: 20px')
  })
})
