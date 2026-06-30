import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FnbImage } from '../src'

describe('FnbImage', () => {
  it('renders an img with src and alt', () => {
    const w = mount(FnbImage, { props: { src: '/a.png', alt: 'pic' } })
    const img = w.find('img').element
    expect(img.getAttribute('src')).toBe('/a.png')
    expect(img.getAttribute('alt')).toBe('pic')
  })

  it('swaps to fallback on error', async () => {
    const w = mount(FnbImage, {
      props: { src: '/broken.png', fallback: '/fallback.png' },
    })
    await w.find('img').trigger('error')
    expect(w.find('img').element.getAttribute('src')).toBe('/fallback.png')
  })

  it('opens the teleported preview on click', async () => {
    const w = mount(FnbImage, {
      props: { src: '/a.png', previewSrc: '/big.png' },
      attachTo: document.body,
    })
    await w.find('img').trigger('click')
    const preview = document.body.querySelector('img[src="/big.png"]')
    expect(preview).not.toBeNull()
    w.unmount()
  })
})
