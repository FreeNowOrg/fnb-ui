import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbScrollbar } from '../src'

describe('FnbScrollbar', () => {
  it('renders default slot in the scrollbar root', () => {
    const w = mount(FnbScrollbar, { slots: { default: 'content' } })
    expect(w.classes()).toContain('fnb-scrollbar')
    expect(w.text()).toContain('content')
  })

  it('xScrollable changes the class list', () => {
    const off = mount(FnbScrollbar, { props: { xScrollable: false } })
    const on = mount(FnbScrollbar, { props: { xScrollable: true } })
    expect(off.classes()).not.toEqual(on.classes())
  })
})
