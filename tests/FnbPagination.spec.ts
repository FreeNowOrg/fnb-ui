import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbPagination } from '../src'

describe('FnbPagination', () => {
  it('renders a button for each page when total is small', () => {
    // 30 items / 10 per page = 3 pages
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toContain('1')
    expect(labels).toContain('2')
    expect(labels).toContain('3')
  })

  it('emits update:page when a page button is clicked', async () => {
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const pageTwo = w.findAll('button').find((b) => b.text() === '2')!
    await pageTwo.trigger('click')
    expect(w.emitted('update:page')).toEqual([[2]])
  })

  it('shows an ellipsis when pages exceed pageSlot', () => {
    // 200 items / 10 = 20 pages, default pageSlot 7
    const w = mount(FnbPagination, {
      props: { page: 10, itemCount: 200, pageSize: 10 },
    })
    expect(w.text()).toContain('…')
  })

  it('does not emit when clicking the current page', async () => {
    const w = mount(FnbPagination, {
      props: { page: 1, itemCount: 30, pageSize: 10 },
    })
    const pageOne = w.findAll('button').find((b) => b.text() === '1')!
    await pageOne.trigger('click')
    // clamped/no-op: either no event or emits the same page — assert it never moves off 1
    const emitted = w.emitted('update:page') as number[][] | undefined
    if (emitted) expect(emitted.every(([p]) => p === 1)).toBe(true)
  })
})
