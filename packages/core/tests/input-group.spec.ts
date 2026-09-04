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
    expect(css).toMatch(/\.fnb-input-group > \*[^{]*\{[^}]*box-shadow: none/)
  })

  it('suppresses the press transform inside a group', () => {
    expect(css).toMatch(/\.fnb-input-group > \*[^{]*\{[^}]*transform: none/)
  })

  it('uses an inset outline for focus so seams do not break', () => {
    expect(css).toContain('outline-offset: -2px')
  })
})
