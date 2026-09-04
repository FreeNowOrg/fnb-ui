import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbDialogProvider, useDialog } from '../src'

const Child = defineComponent({
  setup(_, { expose }) {
    const dialog = useDialog()
    expose({ dialog })
    return () => h('div', 'child')
  },
})

function mountWithProvider() {
  // A host template owns the `child` ref so it resolves on `w.vm.$refs`.
  // Slot content refs resolve in the owner scope, not the consumer
  // component, so passing the child via `slots` would never register on
  // FnbDialogProvider's own $refs.
  const Host = defineComponent({
    components: { FnbDialogProvider, Child },
    template: '<FnbDialogProvider><Child ref="child" /></FnbDialogProvider>',
  })
  return mount(Host, { attachTo: document.body })
}

describe('useDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens a dialog showing title and content', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).dialog.confirm({
      title: 'Delete?',
      content: 'Sure?',
    })
    await w.vm.$nextTick()
    const el = document.body.querySelector('.fnb-dialog')
    expect(el).not.toBeNull()
    expect(el!.textContent).toContain('Delete?')
    expect(el!.textContent).toContain('Sure?')
  })

  it('resolves true on positive click', async () => {
    const w = mountWithProvider()
    const p = (w.vm.$refs.child as any).dialog.confirm({
      title: 't',
      content: 'c',
    })
    await w.vm.$nextTick()
    const positive = document.body.querySelector(
      '.fnb-dialog__footer .fnb-button--primary'
    ) as HTMLElement
    positive.click()
    await w.vm.$nextTick()
    await expect(p).resolves.toBe(true)
    expect(document.body.querySelector('.fnb-dialog')).toBeNull()
  })

  it('resolves false on negative click', async () => {
    const w = mountWithProvider()
    const p = (w.vm.$refs.child as any).dialog.confirm({
      title: 't',
      content: 'c',
      negativeText: 'Cancel',
    })
    await w.vm.$nextTick()
    const buttons = [
      ...document.body.querySelectorAll('.fnb-dialog__footer .fnb-button'),
    ] as HTMLElement[]
    const negative = buttons.find((b) => b.textContent?.includes('Cancel'))!
    negative.click()
    await w.vm.$nextTick()
    await expect(p).resolves.toBe(false)
  })

  it('useDialog throws without a provider', () => {
    const Lonely = defineComponent({
      setup() {
        useDialog()
        return () => h('div')
      },
    })
    expect(() => mount(Lonely)).toThrow(/FnbDialogProvider/)
  })
})
