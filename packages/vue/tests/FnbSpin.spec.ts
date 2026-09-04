import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSpin } from '../src'

describe('FnbSpin', () => {
  it('renders the wrapped default slot', () => {
    const w = mount(FnbSpin, { slots: { default: '<p class="c">content</p>' } })
    expect(w.find('p.c').exists()).toBe(true)
  })

  it('renders the spinner svg when show is true', () => {
    const w = mount(FnbSpin, { props: { show: true } })
    expect(w.find('svg.fnb-spin__icon').exists()).toBe(true)
  })

  it('size prop changes the class list', () => {
    const md = mount(FnbSpin, { props: { show: true, size: 'medium' } })
    const lg = mount(FnbSpin, { props: { show: true, size: 'large' } })
    expect(md.html()).not.toEqual(lg.html())
  })
})
