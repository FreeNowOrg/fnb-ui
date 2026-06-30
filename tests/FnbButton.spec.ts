import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbButton } from '../src'

describe('FnbButton', () => {
  it('renders default slot content with the base class', () => {
    const w = mount(FnbButton, { slots: { default: 'Click' } })
    expect(w.text()).toContain('Click')
    expect(w.classes()).toContain('fnb-button')
  })

  it('applies variant and size modifier classes', () => {
    const w = mount(FnbButton, { props: { variant: 'primary', size: 'lg' } })
    expect(w.classes()).toContain('fnb-button--primary')
    expect(w.classes()).toContain('fnb-button--lg')
  })

  it('renders an <a> element when href is provided', () => {
    const w = mount(FnbButton, { props: { href: 'https://example.com' } })
    expect(w.element.tagName).toBe('A')
  })

  it('shows the spinner and marks loading when loading', () => {
    const w = mount(FnbButton, { props: { loading: true } })
    expect(w.find('.fnb-button__spinner').exists()).toBe(true)
    expect(w.classes()).toContain('fnb-button--loading')
  })
})
