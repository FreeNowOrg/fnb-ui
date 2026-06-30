import { describe, it, expect } from 'vitest'
import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbTabs, FnbTabPane } from '../src'

function mountTabs(props = {}) {
  return mount(FnbTabs, {
    props: { value: 'a', ...props },
    slots: {
      default: () => [
        h(
          FnbTabPane,
          { name: 'a', tab: 'Apple' },
          { default: () => 'Panel A' }
        ),
        h(
          FnbTabPane,
          { name: 'b', tab: 'Banana' },
          { default: () => 'Panel B' }
        ),
      ],
    },
  })
}

describe('FnbTabs', () => {
  it('renders a nav button per pane from the tab prop', async () => {
    const w = mountTabs()
    // Panes self-register on mount; nav appears after the next reactive tick.
    await nextTick()
    const labels = w.findAll('.fnb-tabs__tab').map((b) => b.text())
    expect(labels).toEqual(['Apple', 'Banana'])
  })

  it('shows only the active pane panel', () => {
    const w = mountTabs({ value: 'a' })
    expect(w.text()).toContain('Panel A')
    // Panel B is rendered but v-show-hidden
    const panelB = w.findAll('.fnb-tabs__panel')[1]
    expect(panelB.attributes('style')).toContain('display: none')
  })

  it('marks the active tab and emits update:value on click', async () => {
    const w = mountTabs({ value: 'a' })
    await nextTick()
    const tabs = w.findAll('.fnb-tabs__tab')
    expect(tabs[0].classes()).toContain('fnb-tabs__tab--active')
    await tabs[1].trigger('click')
    expect(w.emitted('update:value')).toEqual([['b']])
  })

  it('applies type and size modifier classes', () => {
    const w = mountTabs({ type: 'segment', size: 'small' })
    expect(w.classes()).toContain('fnb-tabs--segment')
    expect(w.classes()).toContain('fnb-tabs--small')
  })

  it('renders a rich #tab slot when provided', async () => {
    const w = mount(FnbTabs, {
      props: { value: 'x' },
      slots: {
        default: () => [
          h(
            FnbTabPane,
            { name: 'x' },
            { tab: () => h('span', { class: 'ico' }, '★'), default: () => 'PX' }
          ),
        ],
      },
    })
    await nextTick()
    expect(w.find('.fnb-tabs__tab .ico').text()).toBe('★')
  })

  it('FnbTabPane throws when used outside FnbTabs', () => {
    expect(() => mount(FnbTabPane, { props: { name: 'a' } })).toThrow(/FnbTabs/)
  })
})
