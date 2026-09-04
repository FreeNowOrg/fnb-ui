import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(
  resolve(import.meta.dirname, '../src/styles/components.css'),
  'utf8'
)

/*
 * These assertions run against a real DOM with the real stylesheet attached,
 * so they verify WHICH ELEMENTS each rule hits. A text-level regex only proves
 * that a rule was typed into the file — it cannot tell a rule that lands on the
 * intended control from one that lands on an empty wrapper. That gap is not
 * hypothetical: the group rules were once child-selector-only and silently
 * missed FnbSelect's trigger, which sits one level inside a bare .fnb-select
 * wrapper, while every regex in this file stayed green.
 *
 * jsdom resolves the cascade and selector matching but does NOT substitute
 * var(), so only keyword/literal values (`none`, `-2px`) can be read back
 * through getComputedStyle. Anything var()-valued stays a text assertion, and
 * is marked as such.
 *
 * :hover cannot be simulated, so the sheet is injected with `:hover` rewritten
 * to `.fnb-t-hover`. A class and a pseudo-class weigh the same in specificity,
 * so the cascade between hover rules is preserved exactly; elements that do not
 * carry the class behave as if unhovered.
 */

const HOVER = 'fnb-t-hover'

const MEMBERS = {
  trigger: '.fnb-select__trigger',
  input: '.fnb-input',
  button: '.fnb-button',
}

let group: HTMLElement
const el = (sel: string) => group.querySelector<HTMLElement>(sel)!
const computed = (sel: string) => getComputedStyle(el(sel))

beforeAll(() => {
  const style = document.createElement('style')
  style.textContent = css.replaceAll(':hover', `.${HOVER}`)
  document.head.append(style)
  // Mirrors FnbSelect.vue's real markup: the bordered, shadowed, focusable
  // control is the trigger nested inside the wrapper, not the wrapper itself.
  document.body.innerHTML = `
    <div class="fnb-input-group">
      <div class="fnb-select">
        <button class="fnb-select__trigger" type="button">pick</button>
        <ul class="fnb-select__dropdown">
          <li class="fnb-select__option">a</li>
        </ul>
      </div>
      <input class="fnb-input" />
      <button class="fnb-button">go</button>
    </div>`
  group = document.querySelector<HTMLElement>('.fnb-input-group')!
})

describe('.fnb-input-group', () => {
  it('zeroes the shadow of every member, nested Select trigger included', () => {
    for (const [name, sel] of Object.entries(MEMBERS)) {
      expect(computed(sel).boxShadow, name).toBe('none')
    }
  })

  it('suppresses the press transform of every member on hover', () => {
    for (const [name, sel] of Object.entries(MEMBERS)) {
      const target = el(sel)
      target.classList.add(HOVER)
      expect(getComputedStyle(target).transform, name).toBe('none')
      expect(getComputedStyle(target).boxShadow, name).toBe('none')
      target.classList.remove(HOVER)
    }
  })

  it('leaves the dropdown overlay alone', () => {
    // The dropdown is an absolutely positioned overlay outside the pill, so
    // the group's reset rules must not reach it or its options.
    expect(computed('.fnb-select__dropdown').boxShadow).not.toBe('none')
  })

  it('reaches a focused member with the inset outline, not a shadow', () => {
    for (const [name, sel] of Object.entries(MEMBERS)) {
      const target = el(sel)
      target.focus()
      expect(document.activeElement, name).toBe(target)
      // .fnb-input:focus paints a brand-coloured box-shadow of its own; the
      // group's focus rule has to beat it or the seam reopens.
      expect(getComputedStyle(target).boxShadow, name).toBe('none')
      expect(getComputedStyle(target).outlineOffset, name).toBe('-2px')
      target.blur()
    }
  })

  it('puts the seam margin on the direct children', () => {
    // The negative margin has to land on the flex item — for a Select that is
    // the .fnb-select wrapper, not the trigger inside it.
    expect(el('.fnb-select').matches('.fnb-input-group > * + *')).toBe(false)
    expect(el('.fnb-input').matches('.fnb-input-group > * + *')).toBe(true)
    expect(el('.fnb-button').matches('.fnb-input-group > * + *')).toBe(true)
  })

  it('merges adjacent borders using the weight variable', () => {
    // var()-valued: jsdom does not substitute custom properties, so the seam
    // width itself can only be checked as source text.
    expect(css).toContain(
      'margin-inline-start: calc(-1 * var(--fnb-weight-border))'
    )
  })
})
