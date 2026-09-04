import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbProgress } from '../src'

describe('FnbProgress', () => {
  it('renders the root track', () => {
    const w = mount(FnbProgress)
    expect(w.classes()).toContain('fnb-progress')
  })

  it('sets the fill width from percentage', () => {
    const w = mount(FnbProgress, { props: { percentage: 50 } })
    expect(w.html()).toContain('width: 50%')
  })

  it('clamps percentage above 100 to 100%', () => {
    const w = mount(FnbProgress, { props: { percentage: 150 } })
    expect(w.html()).toContain('width: 100%')
    expect(w.html()).not.toContain('width: 150%')
  })

  it('shows the rounded value label when showValue is set', () => {
    const w = mount(FnbProgress, {
      props: { percentage: 42.6, showValue: true },
    })
    expect(w.text()).toContain('43%')
  })
})
