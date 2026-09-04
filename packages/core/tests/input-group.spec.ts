import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
)

describe('.fnb-input-group', () => {
  it('merges adjacent borders using the weight variable', () => {
    expect(css).toContain(
      'margin-inline-start: calc(-1 * var(--fnb-weight-border))'
    )
  })

  it('zeroes member shadows and lifts the shadow to the group', () => {
    // Anchored to `\s*\{` so this only matches the baseline
    // ".fnb-input-group > *" rule, not ".fnb-input-group > *:hover".
    expect(css).toMatch(/\.fnb-input-group > \*\s*\{[^}]*box-shadow: none/)
  })

  it('suppresses the press transform inside a group', () => {
    expect(css).toMatch(/\.fnb-input-group > \*\s*\{[^}]*transform: none/)
  })

  it('uses an inset outline for focus so seams do not break', () => {
    expect(css).toContain('outline-offset: -2px')
  })

  it('keeps the focus state shadow-free so the seam does not break', () => {
    // A member's own :focus rule (e.g. .fnb-input:focus) outranks the
    // ".fnb-input-group > *" baseline on specificity, so the group's
    // focus/focus-visible rule must reassert box-shadow: none itself.
    expect(css).toMatch(
      /\.fnb-input-group > \*:focus,\s*\.fnb-input-group > \*:focus-visible\s*\{[^}]*box-shadow: none/
    )
  })
})
