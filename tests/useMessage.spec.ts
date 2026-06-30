import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { FnbMessageProvider, useMessage } from '../src'

const Child = defineComponent({
  setup(_, { expose }) {
    const message = useMessage()
    expose({ message })
    return () => h('div', 'child')
  },
})

function mountWithProvider() {
  // A host template owns the `child` ref so it resolves on `w.vm.$refs`.
  // Slot content refs resolve in the owner scope, not the consumer
  // component, so passing the child via `slots` would never register on
  // FnbMessageProvider's own $refs.
  const Host = defineComponent({
    components: { FnbMessageProvider, Child },
    template: '<FnbMessageProvider><Child ref="child" /></FnbMessageProvider>',
  })
  return mount(Host, { attachTo: document.body })
}

describe('useMessage', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders a success message in a teleported container', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).message.success('Saved')
    await w.vm.$nextTick()
    const el = document.body.querySelector('.fnb-message--success')
    expect(el).not.toBeNull()
    expect(el!.textContent).toContain('Saved')
  })

  it('auto-dismisses after the duration', async () => {
    const w = mountWithProvider()
    ;(w.vm.$refs.child as any).message.info('Hi', { duration: 1000 })
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).not.toBeNull()
    vi.advanceTimersByTime(1100)
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).toBeNull()
  })

  it('handle.destroy() removes the message early', async () => {
    const w = mountWithProvider()
    const handle = (w.vm.$refs.child as any).message.error('Boom')
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message--error')).not.toBeNull()
    handle.destroy()
    await w.vm.$nextTick()
    expect(document.body.querySelector('.fnb-message')).toBeNull()
  })

  it('useMessage throws without a provider', () => {
    const Lonely = defineComponent({
      setup() {
        useMessage()
        return () => h('div')
      },
    })
    expect(() => mount(Lonely)).toThrow(/FnbMessageProvider/)
  })
})
