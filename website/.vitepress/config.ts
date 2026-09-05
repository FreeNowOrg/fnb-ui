import { defineConfig } from 'vitepress'
import { vitepressDemoPlugin } from 'vitepress-demo-plugin'
import { fileURLToPath, URL } from 'node:url'
import { version } from '../../packages/vue/package.json'

export default defineConfig({
  title: 'fnb-ui',
  description: 'Free Neubrutalism — a CSS-first design system',
  lang: 'en-US',

  // Archivo Black is the display voice of this design language. The docs site
  // is the showcase, so it loads the real face rather than falling back.
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
      },
    ],
  ],

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
        // Preview against source directly — no build step needed. The alias
        // key must stay the real published name: vitepress-demo-plugin shows
        // each demo's source verbatim, so whatever the imports say is what
        // readers copy into their own project.
        '@fnb-ui/vue': fileURLToPath(
          new URL('../../packages/vue/src/index.ts', import.meta.url)
        ),
      },
    },
    define: {
      'import.meta.env.__VERSION__': JSON.stringify(version),
    },
  },
})
