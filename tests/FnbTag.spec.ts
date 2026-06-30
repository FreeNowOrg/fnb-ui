import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbTag } from '../src'

describe('FnbTag', () => {
  it('renders default slot', () => {
    const w = mount(FnbTag, { slots: { default: 'R-18' } })
    expect(w.classes()).toContain('fnb-tag')
    expect(w.text()).toContain('R-18')
  })

  it('emits click only when clickable', async () => {
    const plain = mount(FnbTag, { props: { clickable: false } })
    await plain.trigger('click')
    expect(plain.emitted('click')).toBeUndefined()

    const clickable = mount(FnbTag, { props: { clickable: true } })
    await clickable.trigger('click')
    expect(clickable.emitted('click')).toHaveLength(1)
  })

  it('applies the color prop as an inline background-color', () => {
    const w = mount(FnbTag, { props: { color: 'rgb(255, 0, 0)' } })
    expect(w.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
  })

  it('active prop changes the class list', () => {
    const off = mount(FnbTag, { props: { active: false } })
    const on = mount(FnbTag, { props: { active: true } })
    expect(off.classes()).not.toEqual(on.classes())
  })
})
