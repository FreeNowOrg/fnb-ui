import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbProvider, useMessage, useDialog } from '../src'

const Child = defineComponent({
  setup() {
    // Both hooks must resolve inside FnbProvider without throwing.
    const message = useMessage()
    const dialog = useDialog()
    message.success('ready')
    return () =>
      h(
        'div',
        { class: 'ok' },
        typeof dialog.confirm === 'function' ? 'ok' : 'bad'
      )
  },
})

describe('FnbProvider', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('provides message + dialog + config from a single wrapper', async () => {
    const w = mount(FnbProvider, {
      attachTo: document.body,
      props: { themeOverrides: { brand: '#abcdef' } },
      slots: { default: () => h(Child) },
    })
    await w.vm.$nextTick()
    expect(w.find('.ok').text()).toBe('ok')
    expect(document.body.querySelector('.fnb-message--success')).not.toBeNull()
    // config provider applied the override on its root
    const style = w.find('.fnb-config-provider').attributes('style') ?? ''
    expect(style).toContain('--fnb-brand: #abcdef')
  })
})
