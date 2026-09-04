import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import {
  FnbConfigProvider,
  FnbDialogProvider,
  useDialog,
  picaTheme,
} from '../src'

const Opener = defineComponent({
  setup() {
    const dialog = useDialog()
    return () =>
      h(
        'button',
        { onClick: () => dialog.confirm({ title: 'x', content: 'y' }) },
        'open'
      )
  },
})

describe('teleported content theme scope', () => {
  it('carries theme vars and dark class onto the teleported root', async () => {
    mount(FnbConfigProvider, {
      props: { themeOverrides: picaTheme, dark: true },
      slots: {
        default: () => h(FnbDialogProvider, null, { default: () => h(Opener) }),
      },
      attachTo: document.body,
    })
    document.querySelector('button')!.dispatchEvent(new MouseEvent('click'))
    await new Promise((r) => setTimeout(r))

    const overlay = document.querySelector('.fnb-dialog-overlay') as HTMLElement
    expect(overlay).toBeTruthy()
    expect(overlay.style.getPropertyValue('--fnb-brand')).toBe('#ff5c8a')
    expect(overlay.classList.contains('dark')).toBe(true)
  })
})
