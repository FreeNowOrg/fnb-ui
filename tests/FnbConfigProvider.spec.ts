import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbConfigProvider } from '../src'

describe('FnbConfigProvider', () => {
  it('emits theme-overrides as inline --fnb-* css variables', () => {
    const w = mount(FnbConfigProvider, {
      props: { themeOverrides: { brand: '#ff5577', surface: '#fafafa' } },
      slots: { default: 'child' },
    })
    const style = w.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #ff5577')
    expect(style).toContain('--fnb-surface: #fafafa')
    expect(w.text()).toContain('child')
  })

  it('toggles the dark class', () => {
    const light = mount(FnbConfigProvider, {
      props: {},
      slots: { default: 'x' },
    })
    expect(light.classes()).not.toContain('dark')
    const dark = mount(FnbConfigProvider, {
      props: { dark: true },
      slots: { default: 'x' },
    })
    expect(dark.classes()).toContain('dark')
  })

  it('merges nested config providers (child overrides win, parent inherited)', () => {
    const Parent = {
      components: { FnbConfigProvider },
      template: `
        <FnbConfigProvider :theme-overrides="{ brand: '#111111', surface: '#222222' }">
          <FnbConfigProvider :theme-overrides="{ brand: '#999999' }" class="inner">
            <span>n</span>
          </FnbConfigProvider>
        </FnbConfigProvider>
      `,
    }
    const w = mount(Parent)
    const inner = w.find('.inner')
    const style = inner.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #999999') // child wins
    expect(style).toContain('--fnb-surface: #222222') // inherited from parent
  })
})
