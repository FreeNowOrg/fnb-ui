import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbIcon } from '../src'

describe('FnbIcon', () => {
  it('wraps the default slot in i.fnb-icon', () => {
    const w = mount(FnbIcon, { slots: { default: () => h('svg') } })
    expect(w.element.tagName).toBe('I')
    expect(w.classes()).toContain('fnb-icon')
    expect(w.find('svg').exists()).toBe(true)
  })

  it('renders the component prop instead of the slot', () => {
    const Star = { name: 'Star', render: () => h('svg', { class: 'star' }) }
    const w = mount(FnbIcon, { props: { component: Star } })
    expect(w.find('svg.star').exists()).toBe(true)
  })

  it('applies size as px for numbers and passes strings through', () => {
    const wNum = mount(FnbIcon, { props: { size: 18 } })
    expect(wNum.attributes('style')).toContain('font-size: 18px')
    const wStr = mount(FnbIcon, { props: { size: '1.5em' } })
    expect(wStr.attributes('style')).toContain('font-size: 1.5em')
  })

  it('applies color', () => {
    const w = mount(FnbIcon, { props: { color: 'rgb(255, 0, 0)' } })
    expect(w.attributes('style')).toContain('color: rgb(255, 0, 0)')
  })

  it('defaults aria-hidden=true and lets $attrs override it', () => {
    expect(mount(FnbIcon).attributes('aria-hidden')).toBe('true')
    const w = mount(FnbIcon, {
      attrs: { 'aria-hidden': 'false', 'aria-label': 'star' },
    })
    expect(w.attributes('aria-hidden')).toBe('false')
    expect(w.attributes('aria-label')).toBe('star')
  })
})
