import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/base.css'),
  'utf8'
)

describe('base.css', () => {
  it('scopes every element selector under .fnb-prose, or behind an explicit .fnb- class', () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}')
      .map((chunk) => chunk.split('{')[0].trim())
      .filter(Boolean)
      .flatMap((s) => s.split(',').map((x) => x.trim()))
      .filter(Boolean)

    // .fnb-divider is an explicit opt-in class (same pattern as .fnb-link),
    // not a bare element selector, so it is as safe as the other two prefixes.
    const allowedPrefixes = ['.fnb-prose', '.fnb-link', '.fnb-divider']

    for (const sel of selectors) {
      const scoped = allowedPrefixes.some((prefix) => sel.startsWith(prefix))
      expect(scoped, `bare selector leaks into host page: "${sel}"`).toBe(true)
    }
  })

  it('provides both underlined and plain link styles', () => {
    expect(css).toContain('.fnb-link')
    expect(css).toContain('.fnb-link--plain')
  })
})
