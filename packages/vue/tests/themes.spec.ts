import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbConfigProvider, picaTheme, pixivTheme } from '../src'

describe('themes', () => {
  it('ships presets for both first-party projects', () => {
    expect(picaTheme).toEqual({ brand: '#ff5c8a', bg: '#fff0f3' })
    expect(pixivTheme).toEqual({ brand: '#4993ff', bg: '#eef2ff' })
  })

  it('maps overrides onto scoped CSS variables', () => {
    const w = mount(FnbConfigProvider, { props: { themeOverrides: picaTheme } })
    const style = w.attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #ff5c8a')
    expect(style).toContain('--fnb-bg: #fff0f3')
  })

  it('never writes to the document root', () => {
    const before = document.documentElement.getAttribute('style')
    mount(FnbConfigProvider, { props: { themeOverrides: picaTheme } })
    expect(document.documentElement.getAttribute('style')).toBe(before)
  })
})
