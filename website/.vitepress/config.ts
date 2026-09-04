import { defineConfig } from 'vitepress'
import { vitepressDemoPlugin } from 'vitepress-demo-plugin'
import { fileURLToPath, URL } from 'node:url'
import { version } from '../../packages/vue/package.json'

export default defineConfig({
  title: 'fnb-ui',
  description: 'Free Neubrutalism — a Vue 3 component library',
  lang: 'en-US',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Components', link: '/components/button' },
      { text: `v${version}`, link: 'https://github.com/FreeNowOrg/fnb-ui' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Guide',
          items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
        },
        {
          text: 'Components',
          items: [
            { text: 'Button', link: '/components/button' },
            { text: 'Tabs', link: '/components/tabs' },
            { text: 'Message', link: '/components/message' },
            { text: 'Dialog', link: '/components/dialog' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/FreeNowOrg/fnb-ui' },
    ],
  },

  markdown: {
    config(md) {
      md.use(vitepressDemoPlugin)
    },
  },

  vite: {
    resolve: {
      alias: {
        // Preview against source directly — no build step needed.
        'fnb-ui': fileURLToPath(
          new URL('../../packages/vue/src/index.ts', import.meta.url)
        ),
      },
    },
    define: {
      'import.meta.env.__VERSION__': JSON.stringify(version),
    },
  },
})
