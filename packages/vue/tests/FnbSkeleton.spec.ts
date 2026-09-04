import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbSkeleton } from '../src'

describe('FnbSkeleton', () => {
  it('renders a single skeleton by default', () => {
    const w = mount(FnbSkeleton)
    expect(w.findAll('.fnb-skeleton').length).toBeGreaterThanOrEqual(1)
  })

  it('renders `repeat` copies', () => {
    const w = mount(FnbSkeleton, { props: { repeat: 3 } })
    expect(w.findAll('.fnb-skeleton').length).toBe(3)
  })

  it('applies width/height from props', () => {
    const w = mount(FnbSkeleton, { props: { width: '120px', height: '20px' } })
    const html = w.html()
    expect(html).toContain('width: 120px')
    expect(html).toContain('height: 20px')
  })

  it('circle modifier changes the class list', () => {
    const plain = mount(FnbSkeleton)
    const circle = mount(FnbSkeleton, { props: { circle: true } })
    expect(plain.html()).not.toEqual(circle.html())
  })
})
