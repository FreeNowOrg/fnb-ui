import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
).replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * Every innermost rule as { selector, body }. `[^{}]` for both halves means a
 * wrapper like `@media (...) { ... }` never matches as a rule itself, while the
 * rules nested inside it still do — which is what these assertions want: the
 * reduced-motion overrides must be scanned like any other rule.
 */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: m[1].trim().replace(/\s+/g, ' '),
  body: m[2],
}))

const declares = (body: string, prop: string) =>
  new RegExp(`(^|;)\\s*${prop}\\s*:([^;]*)`, 'i').exec(body)?.[2].trim() ?? null

describe('interaction states', () => {
  it('never moves the element that is itself being hovered', () => {
    // A transform on the hovered element slides it out from under the cursor,
    // hover is lost, the box springs back, the cursor is over it again — a
    // frame-rate oscillation near the element's edge. The travel budget belongs
    // to :active, where the pointer being held down makes that loop impossible.
    //
    // Transforming a DESCENDANT is fine and stays allowed: the pointer rests on
    // the ancestor that owns the :hover, so nothing moves out from under it.
    // That is how FloatButton reveals its menu.
    const movesItself = (selector: string) =>
      selector.split(',').some((part) =>
        /:hover/.test(
          part
            .trim()
            .split(/[\s>+~]+/)
            .pop()!
        )
      )

    const offenders = rules
      .filter((r) => movesItself(r.selector))
      .map((r) => ({ r, t: declares(r.body, 'transform') }))
      .filter(({ t }) => t !== null && t !== 'none')
      .map(({ r, t }) => `${r.selector} { transform: ${t} }`)

    expect(offenders).toEqual([])
  })

  it('never gives a text field the press treatment', () => {
    // A field is typed into, not pressed. An offset jumps the caret mid-word;
    // a shrinking shadow makes the field breathe while typing.
    const inputStates = rules.filter((r) =>
      /\.fnb-input:(hover|active|focus)/.test(r.selector)
    )
    expect(inputStates.length).toBeGreaterThan(0)

    for (const r of inputStates) {
      const t = declares(r.body, 'transform')
      expect(t === null || t === 'none', `${r.selector} moves`).toBe(true)

      const shadow = declares(r.body, 'box-shadow')
      if (shadow !== null) {
        // Only ever the rest shadow, restated — never shrunk, never recoloured.
        expect(shadow.replace(/\s+/g, ' ')).toBe(
          'var(--fnb-weight-shadow) var(--fnb-weight-shadow) 0 0 var(--fnb-shadow-color)'
        )
      }
    }
  })

  it('never clears the state layer inside :hover or :active', () => {
    // The wash is the non-geometric half of every state. Replacing it instead
    // of compositing over it makes the luminance ladder non-monotonic — hover
    // darkens, then the next state brightens again, which reads as the control
    // lighting up when you press it.
    const offenders = rules
      .filter((r) => /:hover|:active/.test(r.selector))
      .filter((r) => declares(r.body, 'background-image') === 'none')
      .map((r) => r.selector)

    expect(offenders).toEqual([])
  })

  it('gives every pressable control a non-motion hover channel', () => {
    // Motion alone carries nothing under prefers-reduced-motion, so each
    // control that presses must also wash.
    const pressable = [
      '.fnb-button',
      '.fnb-tag--clickable',
      '.fnb-select__trigger',
      '.fnb-pagination__btn',
      '.fnb-float-button__main',
    ]

    for (const sel of pressable) {
      const hover = rules.find((r) => r.selector === `${sel}:hover`)
      expect(hover, `${sel} has no :hover rule`).toBeDefined()
      expect(
        declares(hover!.body, 'background-image'),
        `${sel}:hover has no state layer`
      ).toContain('--fnb-state-hover')

      const active = rules.find((r) => r.selector === `${sel}:active`)
      expect(active, `${sel} has no :active rule`).toBeDefined()
      expect(
        declares(active!.body, 'background-image'),
        `${sel}:active has no state layer`
      ).toContain('--fnb-state-active')
    }
  })

  it('lands the press exactly where the shadow was', () => {
    // The offset must equal the shadow it removes, or the object does not come
    // to rest on the page — it just shrinks. Both halves read the same
    // variable, so the sm/lg/w1 tiers stay in proportion for free.
    const pairs: [string, string][] = [
      ['.fnb-button:active', '--fnb-weight-shadow'],
      ['.fnb-select__trigger:active', '--fnb-weight-shadow'],
      ['.fnb-pagination__btn:active', '--fnb-weight-shadow'],
      ['.fnb-tag--clickable:active', '--fnb-w1-shadow'],
    ]

    for (const [sel, token] of pairs) {
      const rule = rules.find((r) => r.selector === sel)
      expect(rule, `${sel} missing`).toBeDefined()
      expect(declares(rule!.body, 'transform')).toBe(
        `translate(var(${token}), var(${token}))`
      )
      expect(declares(rule!.body, 'box-shadow')).toBe(
        '0 0 0 0 var(--fnb-shadow-color)'
      )
    }
  })

  it('flattens members of an input group in every state', () => {
    // Members share one shadow drawn on the group. Any press or focus lift on a
    // member tears the seam open, so the group has to reassert flatness for
    // each state a member's own rules touch.
    const flat = rules.filter(
      (r) =>
        r.selector.includes('.fnb-input-group >') &&
        /:hover|:active|:focus/.test(r.selector)
    )
    const covered = flat.map((r) => r.selector).join(' ')

    for (const state of [':hover', ':active', ':focus', ':focus-visible']) {
      expect(covered, `group does not flatten ${state}`).toContain(state)
    }
    for (const r of flat) {
      expect(declares(r.body, 'transform'), r.selector).toBe('none')
      expect(declares(r.body, 'box-shadow'), r.selector).toBe('none')
    }
  })

  it('keeps every state legible with motion switched off', () => {
    const reduced = css.match(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/
    )?.[0]
    expect(reduced, 'no reduced-motion block').toBeDefined()
    // Transitions go too: a 150ms cross-fade is still motion to someone who
    // asked for none.
    expect(reduced).toContain('transition: none')
    expect(reduced).toContain('transform: none')
  })
})
