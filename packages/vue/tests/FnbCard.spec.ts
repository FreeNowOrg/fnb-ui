import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbCard } from '../src'

describe('FnbCard', () => {
  it('renders default slot inside the card root', () => {
    const w = mount(FnbCard, { slots: { default: 'Body' } })
    expect(w.classes()).toContain('fnb-card')
    expect(w.text()).toContain('Body')
  })

  it('color prop changes the class list', () => {
    const white = mount(FnbCard, { props: { color: 'white' } })
    const brand = mount(FnbCard, { props: { color: 'brand' } })
    expect(white.classes()).not.toEqual(brand.classes())
  })

  it('shadow prop changes the class list', () => {
    const md = mount(FnbCard, { props: { shadow: 'md' } })
    const none = mount(FnbCard, { props: { shadow: 'none' } })
    expect(md.classes()).not.toEqual(none.classes())
  })
})
