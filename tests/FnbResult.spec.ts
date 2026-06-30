import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbResult } from '../src'

describe('FnbResult', () => {
  it('renders title and description', () => {
    const w = mount(FnbResult, {
      props: { title: 'Not found', description: 'gone' },
    })
    expect(w.text()).toContain('Not found')
    expect(w.text()).toContain('gone')
  })

  it('renders the footer slot', () => {
    const w = mount(FnbResult, { slots: { footer: '<button>retry</button>' } })
    expect(w.find('button').text()).toBe('retry')
  })

  it('different status values render different glyphs', () => {
    const e404 = mount(FnbResult, { props: { status: '404' } })
    const ok = mount(FnbResult, { props: { status: 'success' } })
    expect(e404.text()).not.toEqual(ok.text())
  })
})
