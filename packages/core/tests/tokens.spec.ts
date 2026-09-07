import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tokens, breakpoints } from '../src/tokens'

const css = () =>
  readFileSync(resolve(import.meta.dirname, '../src/styles/tokens.css'), 'utf8')

describe('tokens', () => {
  it('exposes the two orthogonal dimensions', () => {
    expect(tokens.control.md).toEqual({ h: '36px', font: '14px', px: '14px' })
    expect(tokens.weight.w1).toEqual({ border: '2px', shadow: '2px' })
    expect(tokens.weight.w3).toEqual({ border: '3px', shadow: '4px' })
  })

  it('emits the state layer in both colour schemes', () => {
    // The wash is what carries hover/active when motion is off, so it has to
    // exist on dark ground too — and inverted, or a dark control would only
    // ever get darker and the press would vanish.
    const [light, dark] = css().split('.dark {')
    expect(light).toContain('--fnb-state-hover: rgb(0 0 0 / 0.09)')
    expect(dark).toContain('--fnb-state-hover: rgb(255 255 255 / 0.11)')
    expect(dark).toContain('--fnb-state-active: rgb(255 255 255 / 0.2)')
  })

  it('drops the Pixiv-specific bookmark token', () => {
    expect(css()).not.toContain('--fnb-bookmark')
  })

  it('derives brand-hover and dark shadow from brand via color-mix', () => {
    expect(css()).toContain(
      '--fnb-brand-hover: color-mix(in oklab, var(--fnb-brand), #fff 17%)'
    )
    expect(css()).toContain(
      '--fnb-shadow-color: color-mix(in oklab, var(--fnb-brand), #000 27%)'
    )
  })

  it('never emits breakpoints as CSS variables', () => {
    expect(css()).not.toContain('--fnb-bp')
    expect(breakpoints.md).toBe(768)
  })
})
