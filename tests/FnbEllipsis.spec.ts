import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbEllipsis } from '../src'

describe('FnbEllipsis', () => {
  it('renders default slot', () => {
    const w = mount(FnbEllipsis, { slots: { default: 'long text' } })
    expect(w.text()).toContain('long text')
  })

  it('applies the line-clamp from the prop', () => {
    const w = mount(FnbEllipsis, { props: { lineClamp: 3 } })
    expect(w.attributes('style')).toContain('-webkit-line-clamp: 3')
  })

  it('defaults line-clamp to 1', () => {
    const w = mount(FnbEllipsis)
    expect(w.attributes('style')).toContain('-webkit-line-clamp: 1')
  })
})
