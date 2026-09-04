import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (name: string) =>
  readFileSync(resolve(import.meta.dirname, `../src/styles/${name}`), 'utf8')

const css = read('base.css')

/** Split a selector list on top-level commas only — `:where(a, b)` is one. */
function splitSelectorList(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let buf = ''
  for (const ch of list) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(buf.trim())
      buf = ''
    } else buf += ch
  }
  out.push(buf.trim())
  return out.filter(Boolean)
}

const selectors = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('}')
  .map((chunk) => chunk.split('{')[0].trim())
  .filter(Boolean)
  .flatMap(splitSelectorList)

describe('base.css', () => {
  it('scopes every element selector under .fnb-prose, or behind an explicit .fnb- class', () => {
    // .fnb-divider is an explicit opt-in class (same pattern as .fnb-link),
    // not a bare element selector, so it is as safe as the other two prefixes.
    const allowedPrefixes = ['.fnb-prose', '.fnb-link', '.fnb-divider']

    for (const sel of selectors) {
      const scoped = allowedPrefixes.some((prefix) => sel.startsWith(prefix))
      expect(scoped, `bare selector leaks into host page: "${sel}"`).toBe(true)
    }
  })

  it('keeps every prose rule at single-class specificity', () => {
    // A prose rule that outweighs (0,1,0) silently beats the component class
    // on the same element — .fnb-link--plain, .fnb-button--primary, .fnb-tag.
    // The only shape allowed is `.fnb-prose` plus a single :where(...) group;
    // anything left over (a bare `h1`, a trailing `:hover`) adds weight.
    for (const sel of selectors.filter((s) => s.startsWith('.fnb-prose'))) {
      const leftover = sel
        .slice('.fnb-prose'.length)
        .replace(/:where\([^)]*\)/g, '')
        .trim()
      expect(
        leftover,
        `prose selector outweighs a component class: "${sel}"`
      ).toBe('')
    }
  })

  it('provides both underlined and plain link styles', () => {
    expect(css).toContain('.fnb-link')
    expect(css).toContain('.fnb-link--plain')
  })
})

/*
 * Cascade checks against a real DOM. base.css and components.css are attached
 * in the same order index.css imports them, because these ties are settled by
 * source order, not specificity — a text assertion cannot see that.
 * jsdom does not substitute var(), so custom-property values read back
 * verbatim; which rule won is still unambiguous from the variable name.
 */
describe('prose does not outrank component classes', () => {
  beforeAll(() => {
    for (const name of ['base.css', 'components.css']) {
      const style = document.createElement('style')
      style.textContent = read(name)
      document.head.append(style)
    }
    document.body.innerHTML = `
      <div class="fnb-prose">
        <a class="fnb-link fnb-link--plain" id="plain-in" href="#">a</a>
        <a class="fnb-button fnb-button--primary" id="button-in" href="#">b</a>
        <span class="fnb-tag" id="tag-in">t</span>
      </div>
      <a class="fnb-link fnb-link--plain" id="plain-out" href="#">a</a>
      <a class="fnb-button fnb-button--primary" id="button-out" href="#">b</a>
      <span class="fnb-tag" id="tag-out">t</span>`
  })

  const style = (id: string) =>
    getComputedStyle(document.getElementById(id) as HTMLElement)

  it('leaves .fnb-link--plain undecorated inside prose', () => {
    expect(style('plain-in').textDecoration).toBe(
      style('plain-out').textDecoration
    )
    expect(style('plain-in').textDecoration).toBe('none')
  })

  it('leaves a button-styled link identical inside and outside prose', () => {
    expect(style('button-in').color).toBe(style('button-out').color)
    expect(style('button-in').color).toBe('var(--fnb-on-brand)')
    expect(style('button-in').textDecoration).toBe('none')
  })

  it('leaves a tag identical inside and outside prose', () => {
    expect(style('tag-in').borderTopWidth).toBe(style('tag-out').borderTopWidth)
  })
})
