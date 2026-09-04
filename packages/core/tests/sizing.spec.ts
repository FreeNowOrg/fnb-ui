import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
)

// Strip comments before parsing rules: components.css uses grouped,
// comma-separated selectors (e.g. `.fnb-button,\n.fnb-input,\n...`), so a
// naive "selector immediately followed by {" regex matches the wrong rule
// once a `/* ... */` block or a later standalone `.fnb-button {}` exists.
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * Extract the merged declarations of every top-level rule whose selector
 * list contains the given selector (handles grouped selectors like
 * `.fnb-button, .fnb-input, .fnb-select__trigger { ... }`) as well as a
 * component's own dedicated rule (`.fnb-button { display: inline-flex; ... }`).
 * A selector can legitimately own more than one rule, and every one of them
 * has to be scanned — a single-match version would leave a component's own
 * rule block unchecked whenever the shared baseline rule matches first.
 */
function block(selector: string): string {
  const ruleRe = /([^{}]+)\{([^}]*)\}/g
  let m: RegExpExecArray | null
  const blocks: string[] = []
  while ((m = ruleRe.exec(cssNoComments))) {
    const selectors = m[1].split(',').map((s) => s.trim())
    if (selectors.includes(selector)) blocks.push(m[2])
  }
  if (!blocks.length) throw new Error(`selector not found: ${selector}`)
  return blocks.join('\n')
}

const CONTROLS = ['.fnb-button', '.fnb-input', '.fnb-select__trigger']

describe('control sizing', () => {
  it('every control drives geometry from the same variables', () => {
    for (const sel of CONTROLS) {
      const b = block(sel)
      expect(b, sel).toContain('height: var(--fnb-control-h)')
      expect(b, sel).toContain('padding-inline: var(--fnb-control-px)')
      expect(b, sel).toContain('font-size: var(--fnb-control-font)')
      expect(b, sel).toContain('border: var(--fnb-weight-border)')
      expect(b, sel).toContain('var(--fnb-weight-shadow)')
      expect(b, sel).toContain('box-sizing: border-box')
    }
  })

  it('never grows controls with vertical padding', () => {
    for (const sel of CONTROLS) {
      const b = block(sel)
      expect(b, sel).not.toMatch(/padding-block/)
      expect(b, sel).not.toMatch(/padding:\s/)
    }
  })

  it('keeps Tag on w1 and out of the control size scale', () => {
    const b = block('.fnb-tag')
    expect(b).toContain('--fnb-weight-border: var(--fnb-w1-border)')
    expect(b).toContain('--fnb-weight-shadow: var(--fnb-w1-shadow)')
    expect(b).not.toContain('var(--fnb-control-h)')
  })

  it('size modifiers switch both dimensions together', () => {
    const sm = block('.fnb-button--sm')
    expect(sm).toContain('--fnb-control-h: var(--fnb-control-h-sm)')
    expect(sm).toContain('--fnb-weight-border: var(--fnb-w2-border)')
    expect(sm).toContain('--fnb-weight-shadow: var(--fnb-w2-shadow)')
  })
})
