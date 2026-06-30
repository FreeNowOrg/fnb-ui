import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbAlert } from '../src'

describe('FnbAlert', () => {
  it('renders default slot in the alert root', () => {
    const w = mount(FnbAlert, { slots: { default: 'Heads up' } })
    expect(w.classes()).toContain('fnb-alert')
    expect(w.text()).toContain('Heads up')
  })

  it('renders header from prop and from slot', () => {
    const viaProp = mount(FnbAlert, { props: { header: 'Title' } })
    expect(viaProp.text()).toContain('Title')
    const viaSlot = mount(FnbAlert, { slots: { header: 'SlotTitle' } })
    expect(viaSlot.text()).toContain('SlotTitle')
  })

  it('type prop changes the class list', () => {
    const info = mount(FnbAlert, { props: { type: 'info' } })
    const error = mount(FnbAlert, { props: { type: 'error' } })
    expect(info.classes()).not.toEqual(error.classes())
  })

  it('shows a close button that emits close when closable', async () => {
    const w = mount(FnbAlert, { props: { closable: true } })
    await w.find('button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
