import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbTable } from '../src'

describe('FnbTable', () => {
  it('renders a table wrapper around slotted content', () => {
    const w = mount(FnbTable, {
      slots: { default: '<tbody><tr><td>cell</td></tr></tbody>' },
    })
    expect(w.find('table').exists()).toBe(true)
    expect(w.text()).toContain('cell')
  })
})
